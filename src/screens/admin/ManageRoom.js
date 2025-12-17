import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../api/supabase";

const { width } = Dimensions.get("window");

const normalize = (v) =>
  String(v ?? "")
    .trim()
    .replace(/^0+/, "") || "0";

const INITIAL_ROOM = { floor: "", room_number: "" };
const INITIAL_ERRORS = { floor: "", room_number: "" };

export default function ManageRoom() {
  const navigation = useNavigation();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [newRoom, setNewRoom] = useState(INITIAL_ROOM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "assigned", title: "Đã có bác sĩ" },
    { key: "unassigned", title: "Chưa có bác sĩ" },
  ]);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from("clinic_rooms")
        .select("id, floor, room_number, doctor_id")
        .order("floor")
        .order("room_number");
      setRooms(data || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const validateFloor = (v) => {
    if (!v) return "Vui lòng nhập tầng";
    if (!/^\d+$/.test(v)) return "Tầng chỉ được nhập số";
    const n = Number(v);
    if (n < 1 || n > 20) return "Tầng phải từ 1–20";
    return "";
  };

  const validateRoom = (v) => {
    if (!v) return "Vui lòng nhập số phòng";
    if (!/^\d+$/.test(v)) return "Số phòng chỉ được nhập số";
    const exists = rooms.some(
      (r) =>
        normalize(r.floor) === normalize(newRoom.floor) &&
        normalize(r.room_number) === normalize(v)
    );
    return exists ? "Phòng này đã tồn tại" : "";
  };

  const isFormValid =
    !errors.floor &&
    !errors.room_number &&
    newRoom.floor &&
    newRoom.room_number;

  const handleAddRoom = async () => {
    if (!isFormValid) return;
    await supabase.from("clinic_rooms").insert({
      floor: normalize(newRoom.floor),
      room_number: normalize(newRoom.room_number),
    });
    setModalVisible(false);
    setNewRoom(INITIAL_ROOM);
    setErrors(INITIAL_ERRORS);
    fetchRooms();
  };

  const RoomItem = ({ item }) => (
    <View style={styles.roomCard}>
      <View>
        <Text style={styles.roomNumber}>Phòng {item.room_number}</Text>
        <Text style={styles.roomFloor}>Tầng {item.floor}</Text>
      </View>

      <View
        style={[
          styles.badge,
          item.doctor_id ? styles.badgeActive : styles.badgeEmpty,
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            item.doctor_id ? styles.textActive : styles.textEmpty,
          ]}
        >
          {item.doctor_id ? "Đã phân bác sĩ" : "Phòng trống"}
        </Text>
      </View>
    </View>
  );

  const assignedRooms = rooms.filter((r) => r.doctor_id);
  const unassignedRooms = rooms.filter((r) => !r.doctor_id);

  const renderScene = SceneMap({
    assigned: () => (
      <FlatList
        data={assignedRooms}
        keyExtractor={(i) => i.id.toString()}
        renderItem={({ item }) => <RoomItem item={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchRooms} />
        }
        contentContainerStyle={styles.list}
      />
    ),
    unassigned: () => (
      <FlatList
        data={unassignedRooms}
        keyExtractor={(i) => i.id.toString()}
        renderItem={({ item }) => <RoomItem item={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchRooms} />
        }
        contentContainerStyle={styles.list}
      />
    ),
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#2563EB", "#1E40AF"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back-ios" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản Lý Phòng</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: "#2563EB", height: 3 }}
            style={{ backgroundColor: "#FFF" }}
            activeColor="#2563EB"
            inactiveColor="#94A3B8"
            labelStyle={{ fontWeight: "800" }}
          />
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <MaterialIcons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>➕ Thêm phòng mới</Text>

            <Text style={[styles.label, errors.floor && styles.labelError]}>
              TẦNG
            </Text>
            <TextInput
              style={[styles.input, errors.floor && styles.inputError]}
              value={newRoom.floor}
              keyboardType="numeric"
              placeholder="Ví dụ: 3"
              onChangeText={(t) => {
                const v = t.replace(/[^0-9]/g, "");
                setNewRoom({ ...newRoom, floor: v });
                setErrors({ ...errors, floor: validateFloor(v) });
              }}
            />
            {!!errors.floor && <Text style={styles.error}>{errors.floor}</Text>}

            <Text
              style={[
                styles.label,
                errors.room_number && styles.labelError,
                (!newRoom.floor || errors.floor) && styles.labelDisabled,
              ]}
            >
              SỐ PHÒNG
            </Text>
            <TextInput
              editable={!!newRoom.floor && !errors.floor}
              style={[
                styles.input,
                errors.room_number && styles.inputError,
                (!newRoom.floor || errors.floor) && styles.inputDisabled,
              ]}
              value={newRoom.room_number}
              keyboardType="numeric"
              placeholder="Ví dụ: 12"
              onChangeText={(t) => {
                const v = t.replace(/[^0-9]/g, "");
                setNewRoom({ ...newRoom, room_number: v });
                setErrors({
                  ...errors,
                  room_number: validateRoom(v),
                });
              }}
            />
            {!!errors.room_number && (
              <Text style={styles.error}>{errors.room_number}</Text>
            )}

            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancel}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!isFormValid}
                onPress={handleAddRoom}
                style={[styles.saveBtn, !isFormValid && styles.saveDisabled]}
              >
                <Text style={styles.saveText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    paddingTop: 65,
    paddingBottom: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: "#FFF", fontSize: 22, fontWeight: "900" },

  list: { padding: 14 },

  roomCard: {
    backgroundColor: "#FFF",
    padding: 18,
    borderRadius: 20,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  roomNumber: { fontSize: 18, fontWeight: "800" },
  roomFloor: { color: "#2563EB", marginTop: 4, fontWeight: "600" },

  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  badgeActive: { backgroundColor: "#DCFCE7" },
  badgeEmpty: { backgroundColor: "#FEF3C7" },
  badgeText: { fontWeight: "800", fontSize: 13 },
  textActive: { color: "#166534" },
  textEmpty: { color: "#92400E" },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 32,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: width * 0.9,
    backgroundColor: "#FFF",
    borderRadius: 26,
    padding: 24,
  },
  modalTitle: { fontSize: 22, fontWeight: "900", marginBottom: 16 },

  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    marginTop: 12,
    marginBottom: 6,
  },
  labelError: { color: "#EF4444" },
  labelDisabled: { color: "#94A3B8" },

  input: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#F8FAFC",
  },
  inputError: { borderColor: "#EF4444" },
  inputDisabled: { backgroundColor: "#E5E7EB" },

  error: { color: "#EF4444", marginTop: 4, fontSize: 12 },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 22,
    gap: 20,
  },
  cancel: { fontSize: 16, fontWeight: "700", color: "#64748B" },
  saveBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
  },
  saveDisabled: { backgroundColor: "#94A3B8" },
  saveText: { color: "#FFF", fontSize: 16, fontWeight: "900" },
});
