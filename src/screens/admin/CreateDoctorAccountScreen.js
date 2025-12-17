import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import { useNavigation } from "@react-navigation/native";
import theme from "../../theme/theme";

const { COLORS, GRADIENTS, SPACING, SHADOWS } = theme;

export default function CreateDoctorAccountScreen() {
  const navigation = useNavigation();

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState(""); // Khoa: Tim mạch, Da liễu...
  const [specialization, setSpecialization] = useState(""); // Chuyên môn: Khám chuyên khoa Tim mạch
  const [serviceId, setServiceId] = useState(null); // ID dịch vụ khám
  const [roomNumber, setRoomNumber] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [maxPatients, setMaxPatients] = useState("10");
  const [bio, setBio] = useState("");

  // Data
  const [departments, setDepartments] = useState([]); // Danh sách khoa
  const [specializations, setSpecializations] = useState([]); // Danh sách chuyên môn theo khoa
  const [availableRooms, setAvailableRooms] = useState([]);

  // Modal
  const [deptModal, setDeptModal] = useState(false);
  const [specModal, setSpecModal] = useState(false);
  const [roomModal, setRoomModal] = useState(false);
  const [searchDept, setSearchDept] = useState("");
  const [searchSpec, setSearchSpec] = useState("");
  const [searchRoom, setSearchRoom] = useState("");
  const modalAnim = useRef(new Animated.Value(0)).current;

  // 1. LẤY TẤT CẢ KHOA (department) TỪ services
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from("services")
        .select("department")
        .not("department", "is", null)
        .eq("is_active", true)
        .order("department");

      if (error) {
        console.error("Lỗi lấy khoa:", error);
        return;
      }

      const uniqueDepts = [
        ...new Set(data?.map((item) => item.department.trim()).filter(Boolean)),
      ];
      setDepartments(uniqueDepts.sort());
    };
    fetchDepartments();
  }, []);

  // 2. KHI CHỌN KHOA → LẤY TẤT CẢ CHUYÊN MÔN (name) CỦA KHOA ĐÓ
  useEffect(() => {
    const fetchSpecializations = async () => {
      if (!department) {
        setSpecializations([]);
        setSpecialization("");
        setServiceId(null);
        return;
      }

      const cleanDept = department.trim();

      // TÌM THEO department CHÍNH XÁC + ilike (đảm bảo không bỏ sót)
      const { data, error } = await supabase
        .from("services")
        .select("id, name, price")
        .eq("is_active", true)
        .or(`department.eq.${cleanDept},department.ilike.%${cleanDept}%`)
        .order("name");

      if (error || !data || data.length === 0) {
        console.log("Không tìm thấy chuyên môn cho khoa:", cleanDept);
        setSpecializations([]);
        return;
      }

      console.log(
        `Tìm thấy ${data.length} chuyên môn cho khoa "${cleanDept}":`,
        data
      );
      setSpecializations(data);
    };

    fetchSpecializations();
  }, [department]);

  // 3. LẤY PHÒNG TRỐNG – CHỈ LẤY PHÒNG CHƯA CÓ BÁC SĨ VÀ is_active = true
  useEffect(() => {
    const fetchRooms = async () => {
      if (!department) {
        setAvailableRooms([]);
        setRoomNumber("");
        return;
      }

      const { data } = await supabase
        .from("clinic_rooms")
        .select("room_number")
        .or(`department.eq.${department},department.is.null`)
        .is("doctor_id", null) // chưa có bác sĩ
        .eq("is_active", true) // chỉ lấy phòng đang hoạt động
        .order("room_number");

      const rooms = data?.map((r) => r.room_number) || [];
      setAvailableRooms(rooms);

      // Nếu phòng đang chọn đã bị chiếm → reset
      if (roomNumber && !rooms.includes(roomNumber)) {
        setRoomNumber("");
        Alert.alert("Thông báo", "Phòng này đã được bác sĩ khác chọn!");
      }
    };
    fetchRooms();
  }, [department]);

  // Filter
  const filteredDepts = departments.filter((d) =>
    d.toLowerCase().includes(searchDept.toLowerCase())
  );
  const filteredSpecs = specializations.filter((s) =>
    s.name.toLowerCase().includes(searchSpec.toLowerCase())
  );
  const filteredRooms = availableRooms.filter((r) =>
    r.toLowerCase().includes(searchRoom.toLowerCase())
  );

  const getFloor = (room) => {
    const num = parseInt(room, 10);
    return isNaN(num) ? "" : `Tầng ${Math.floor(num / 100)}`;
  };

  const validate = () => {
    if (!fullName.trim())
      return Alert.alert("Lỗi", "Vui lòng nhập họ tên bác sĩ");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return Alert.alert("Lỗi", "Email không hợp lệ");
    if (password.length < 6)
      return Alert.alert("Lỗi", "Mật khẩu ít nhất 6 ký tự");
    if (!department) return Alert.alert("Lỗi", "Vui lòng chọn khoa");
    if (!specialization) return Alert.alert("Lỗi", "Vui lòng chọn chuyên môn");
    if (!roomNumber) return Alert.alert("Lỗi", "Vui lòng chọn phòng khám");
    if (
      !experienceYears ||
      isNaN(experienceYears) ||
      Number(experienceYears) < 0
    )
      return Alert.alert("Lỗi", "Số năm kinh nghiệm không hợp lệ");
    return true;
  };

  const handleNext = () => {
    if (!validate()) return;

    navigation.navigate("CreateDoctorSchedule", {
      doctorInfo: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        service_id: serviceId,
        department_name: department,
        specialization: specialization,
        experience_years: Number(experienceYears),
        room_number: roomNumber,
        max_patients_per_slot: Number(maxPatients || 10),
        bio: bio.trim() || null,
      },
    });
  };

  const openModal = (type) => {
    if (type === "dept") setDeptModal(true);
    if (type === "spec") setSpecModal(true);
    if (type === "room") setRoomModal(true);

    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setDeptModal(false);
      setSpecModal(false);
      setRoomModal(false);
      setSearchDept("");
      setSearchSpec("");
      setSearchRoom("");
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={["#2563EB", "#1E40AF"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.headerTitle}>Tạo tài khoản bác sĩ</Text>
          <Text style={styles.headerSubtitle}>
            Bước 1 • Thông tin & Phòng khám
          </Text>
        </View>
        <View style={{ width: 50 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.container}>
        <InputField
          label="Họ và tên *"
          icon="person"
          value={fullName}
          onChangeText={setFullName}
          placeholder="BS. Nguyễn Văn A"
        />
        <InputField
          label="Email *"
          icon="mail"
          value={email}
          onChangeText={setEmail}
          placeholder="doctor@phongkham.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <InputField
          label="Mật khẩu *"
          icon="lock-closed"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        {/* KHOA */}
        <View style={styles.section}>
          <Text style={styles.label}>Khoa làm việc *</Text>
          <TouchableOpacity
            style={[styles.selectBox, department && styles.active]}
            onPress={() => openModal("dept")}
          >
            <Ionicons
              name="business"
              size={22}
              color={department ? COLORS.primary : "#999"}
            />
            <Text style={[styles.selectText, department && styles.activeText]}>
              {department || "Chọn khoa"}
            </Text>
            <Ionicons name="chevron-down" size={22} color="#666" />
          </TouchableOpacity>
        </View>

        {/* CHUYÊN MÔN */}
        <View style={styles.section}>
          <Text style={styles.label}>Chuyên môn chính *</Text>
          <TouchableOpacity
            style={[styles.selectBox, specialization && styles.active]}
            onPress={() => openModal("spec")}
            disabled={!department}
          >
            <Ionicons
              name="medkit"
              size={22}
              color={specialization ? COLORS.success : "#999"}
            />
            <Text
              style={[styles.selectText, specialization && styles.activeText]}
              numberOfLines={2}
            >
              {specialization || "Chọn chuyên môn"}
            </Text>
            <Ionicons name="chevron-down" size={22} color="#666" />
          </TouchableOpacity>
        </View>

        {/* PHÒNG KHÁM */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Phòng khám * {roomNumber && `(${getFloor(roomNumber)})`}
          </Text>
          <TouchableOpacity
            style={[styles.selectBox, roomNumber && styles.active]}
            onPress={() => openModal("room")}
            disabled={!department}
          >
            <Ionicons
              name="home"
              size={22}
              color={roomNumber ? COLORS.primary : "#999"}
            />
            <Text style={[styles.selectText, roomNumber && styles.activeText]}>
              {roomNumber ||
                (department ? "Chọn phòng trống" : "Chọn khoa trước")}
            </Text>
            <Ionicons name="chevron-down" size={22} color="#666" />
          </TouchableOpacity>
        </View>

        <InputField
          label="Số năm kinh nghiệm *"
          icon="briefcase"
          value={experienceYears}
          onChangeText={setExperienceYears}
          placeholder="15"
          keyboardType="numeric"
        />
        <InputField
          label="Số bệnh nhân tối đa/ca"
          icon="people"
          value={maxPatients}
          onChangeText={setMaxPatients}
          placeholder="10"
          keyboardType="numeric"
        />

        <View style={styles.section}>
          <Text style={styles.label}>Giới thiệu ngắn gọn</Text>
          <View style={styles.textArea}>
            <Ionicons
              name="document-text"
              size={22}
              color={COLORS.primary}
              style={{ marginTop: 12 }}
            />
            <TextInput
              style={styles.textAreaInput}
              placeholder="Chuyên gia Tim mạch hơn 15 năm kinh nghiệm..."
              value={bio}
              onChangeText={setBio}
              multiline
            />
          </View>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <LinearGradient
            colors={GRADIENTS.primaryButton}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              Tiếp tục → Thiết lập lịch làm việc
            </Text>
            <Ionicons name="arrow-forward-circle" size={28} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL */}
      <Modal
        visible={deptModal || specModal || roomModal}
        transparent
        animationType="none"
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                {
                  translateY: modalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient colors={GRADIENTS.header} style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {deptModal
                ? "Chọn khoa"
                : specModal
                ? "Chọn chuyên môn"
                : "Chọn phòng khám"}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close-circle" size={28} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              placeholder={
                deptModal
                  ? "Tìm khoa..."
                  : specModal
                  ? "Tìm chuyên môn..."
                  : "Tìm phòng..."
              }
              value={
                deptModal ? searchDept : specModal ? searchSpec : searchRoom
              }
              onChangeText={
                deptModal
                  ? setSearchDept
                  : specModal
                  ? setSearchSpec
                  : setSearchRoom
              }
              style={styles.searchInput}
            />
          </View>

          <FlatList
            data={
              deptModal
                ? filteredDepts
                : specModal
                ? filteredSpecs
                : filteredRooms
            }
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => {
              const displayText = deptModal
                ? item
                : specModal
                ? item.name
                : `${item} (${getFloor(item)})`;

              const isSelected = deptModal
                ? department === item
                : specModal
                ? specialization === item.name
                : roomNumber === item;

              return (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    if (deptModal) {
                      setDepartment(item);
                      setSpecialization("");
                      setServiceId(null);
                    } else if (specModal) {
                      setSpecialization(item.name);
                      setServiceId(item.id);
                    } else {
                      setRoomNumber(item);
                    }
                    if (!specModal) closeModal();
                  }}
                >
                  <Text style={styles.modalItemText}>{displayText}</Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={26}
                      color={COLORS.success}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </Animated.View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// INPUT FIELD + STYLES HOÀN CHỈNH
const InputField = ({ label, icon, ...props }) => (
  <View style={styles.section}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Ionicons name={icon} size={22} color={COLORS.primary} />
      <TextInput style={styles.input} placeholderTextColor="#999" {...props} />
    </View>
  </View>
);

const styles = {
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 23, fontWeight: "bold", color: "#FFF" },
  headerSubtitle: { fontSize: 15, color: "#E0F2FE", marginTop: 4 },
  container: { padding: SPACING.xl, paddingBottom: 100 },
  section: { marginBottom: SPACING.xl },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    ...SHADOWS.medium,
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16 },
  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    ...SHADOWS.medium,
  },
  active: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: "#F0F9FF",
  },
  activeText: { color: COLORS.textPrimary, fontWeight: "600" },
  selectText: { flex: 1, marginLeft: 12, fontSize: 16, color: "#999" },
  textArea: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    minHeight: 110,
    ...SHADOWS.medium,
  },
  textAreaInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    textAlignVertical: "top",
  },
  nextButton: {
    marginTop: 30,
    borderRadius: 20,
    overflow: "hidden",
    ...SHADOWS.large,
  },
  nextButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginRight: 10,
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "85%",
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#FFF" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16 },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    marginHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalItemText: { fontSize: 17, color: COLORS.textPrimary },
};
