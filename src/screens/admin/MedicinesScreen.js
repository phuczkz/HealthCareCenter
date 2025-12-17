import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../api/supabase";
import Icon from "react-native-vector-icons/Ionicons";

export default function MedicinesScreen() {
  const navigation = useNavigation();

  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGeneric, setSelectedGeneric] = useState("all");
  const [selectedForm, setSelectedForm] = useState("all");
  const [loading, setLoading] = useState(true);

  const [genericDropdownVisible, setGenericDropdownVisible] = useState(false);
  const [formDropdownVisible, setFormDropdownVisible] = useState(false);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setMedicines(data || []);
      setFilteredMedicines(data || []);
    } catch (e) {
      Alert.alert("Lỗi", "Không thể tải danh sách thuốc");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const genericOptions = [
    { label: "Tất cả hoạt chất", value: "all" },
    ...Array.from(
      new Set(medicines.map((m) => m.generic_name).filter(Boolean))
    ).map((g) => ({ label: g, value: g })),
  ];

  const formOptions = [
    { label: "Tất cả dạng bào chế", value: "all" },
    ...Array.from(new Set(medicines.map((m) => m.form).filter(Boolean))).map(
      (f) => ({ label: f, value: f })
    ),
  ];

  useEffect(() => {
    let result = medicines;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.name?.toLowerCase().includes(q) ||
          m.generic_name?.toLowerCase().includes(q) ||
          m.manufacturer?.toLowerCase().includes(q)
      );
    }

    if (selectedGeneric !== "all") {
      result = result.filter((m) => m.generic_name === selectedGeneric);
    }

    if (selectedForm !== "all") {
      result = result.filter((m) => m.form === selectedForm);
    }

    setFilteredMedicines(result);
  }, [searchQuery, medicines, selectedGeneric, selectedForm]);

  const resetFilters = () => {
    setSelectedGeneric("all");
    setSelectedForm("all");
    setSearchQuery("");
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.name}</Text>
        {item.is_essential && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Thiết yếu</Text>
          </View>
        )}
      </View>

      {item.generic_name && (
        <Text style={styles.generic}>{item.generic_name}</Text>
      )}

      <View style={styles.meta}>
        {item.form && <Text style={styles.metaText}>{item.form}</Text>}
        {item.category && <Text style={styles.metaDot}>•</Text>}
        {item.category && <Text style={styles.metaText}>{item.category}</Text>}
      </View>

      {item.dosage && <Text style={styles.info}>Liều dùng: {item.dosage}</Text>}

      {item.manufacturer && (
        <Text style={styles.info}>NSX: {item.manufacturer}</Text>
      )}

      {item.price !== null && (
        <Text style={styles.price}>{item.price.toLocaleString("vi-VN")} ₫</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Đang tải danh sách thuốc…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      <LinearGradient
        colors={["#2563EB", "#1E40AF"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerSafeArea}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.title}>Kho Thuốc</Text>
              <Text style={styles.subtitle}>
                {filteredMedicines.length} thuốc
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <SafeAreaView style={styles.content}>
        <View style={styles.searchBox}>
          <Icon name="search-outline" size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm tên thuốc, hoạt chất, hãng..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setGenericDropdownVisible(true)}
          >
            <Text style={styles.filterText} numberOfLines={1}>
              {genericOptions.find((o) => o.value === selectedGeneric)?.label ||
                "Hoạt chất"}
            </Text>
            <Icon name="chevron-down" size={18} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFormDropdownVisible(true)}
          >
            <Text style={styles.filterText} numberOfLines={1}>
              {formOptions.find((o) => o.value === selectedForm)?.label ||
                "Dạng bào chế"}
            </Text>
            <Icon name="chevron-down" size={18} color="#64748B" />
          </TouchableOpacity>

          {(selectedGeneric !== "all" ||
            selectedForm !== "all" ||
            searchQuery) && (
            <TouchableOpacity style={styles.clearBtn} onPress={resetFilters}>
              <Icon name="close" size={18} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredMedicines}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="medkit-outline" size={80} color="#CBD5E1" />
              <Text style={styles.emptyText}>Không tìm thấy thuốc nào</Text>
              <Text style={styles.emptySub}>
                Thử thay đổi bộ lọc hoặc từ khóa
              </Text>
            </View>
          }
        />
      </SafeAreaView>

      <Modal visible={genericDropdownVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setGenericDropdownVisible(false)}
        >
          <View style={styles.dropdownModal}>
            {genericOptions.map((o) => (
              <TouchableOpacity
                key={o.value}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedGeneric(o.value);
                  setGenericDropdownVisible(false);
                }}
              >
                <Text style={styles.dropdownText}>{o.label}</Text>
                {selectedGeneric === o.value && (
                  <Icon name="checkmark" size={20} color="#2563EB" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={formDropdownVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFormDropdownVisible(false)}
        >
          <View style={styles.dropdownModal}>
            {formOptions.map((o) => (
              <TouchableOpacity
                key={o.value}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedForm(o.value);
                  setFormDropdownVisible(false);
                }}
              >
                <Text style={styles.dropdownText}>{o.label}</Text>
                {selectedForm === o.value && (
                  <Icon name="checkmark" size={20} color="#2563EB" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 70 : 60,
    paddingHorizontal: 20,
    paddingBottom: 24,

    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerSafeArea: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Platform.OS === "ios" ? 10 : 0,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  title: { fontSize: 26, fontWeight: "900", color: "#FFFFFF" },
  subtitle: { fontSize: 15, color: "#DBEAFE", marginTop: 4 },

  content: { flex: 1 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: -20,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: "#1E293B" },

  filterRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#E0E7FF",
  },
  filterText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  clearBtn: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  name: { fontSize: 18, fontWeight: "900", color: "#0F172A", flex: 1 },
  badge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { fontSize: 12, fontWeight: "800", color: "#065F46" },

  generic: { marginTop: 8, fontSize: 16, fontWeight: "700", color: "#2563EB" },
  meta: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  metaText: { fontSize: 14, color: "#64748B" },
  metaDot: { marginHorizontal: 8, color: "#CBD5E1" },
  info: { fontSize: 14, color: "#475569", marginTop: 6 },
  price: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "900",
    color: "#16A34A",
  },

  empty: { alignItems: "center", marginTop: 100 },
  emptyText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
    color: "#64748B",
  },
  emptySub: { marginTop: 8, fontSize: 14, color: "#94A3B8" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.4)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  dropdownModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    maxHeight: "60%",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  dropdownText: { fontSize: 15, color: "#1E293B" },

  loadingText: { marginTop: 16, color: "#64748B", fontSize: 16 },
});
