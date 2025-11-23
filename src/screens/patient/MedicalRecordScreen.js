import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Linking,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import { useNavigation } from "@react-navigation/native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import theme from "../../theme/theme";

const { COLORS, GRADIENTS, SPACING, BORDER_RADIUS, SHADOWS } = theme;

export default function MedicalRecordScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("records");
  const [records, setRecords] = useState([]);
  const [testGroups, setTestGroups] = useState([]); // Đã gộp theo lần khám
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPatientData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const patientId = user.id;

      if (activeTab === "records") {
        console.log("Đang tải bệnh án...");
        const { data, error } = await supabase
          .from("medical_records")
          .select(`
            id,
            created_at,
            diagnosis,
            treatment,
            notes,
            doctor:doctors!doctor_id (
              name,
              user_profiles!id (full_name)
            ),
            prescriptions (
              medicine_name,
              dosage,
              duration
            ),
            appointments!appointment_id (date)
          `)
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const formatted = (data || []).map(record => ({
          ...record,
          doctor_name: record.doctor?.user_profiles?.full_name || record.doctor?.name || "Bác sĩ chưa xác định",
          prescriptions: record.prescriptions || []
        }));

        setRecords(formatted);
        console.log("Tải bệnh án thành công:", formatted.length);
      } else {
        console.log("Đang tải và gộp kết quả xét nghiệm theo lần khám...");
        const { data, error } = await supabase
          .from("test_results")
          .select(`
            id,
            test_name,
            result_value,
            unit,
            reference_range,
            note,
            status,
            performed_at,
            file_url,
            appointment_id,
            appointments!appointment_id (appointment_date)
          `)
          .eq("patient_id", patientId)
          .not("performed_at", "is", null)
          .order("performed_at", { ascending: false });

        if (error) throw error;

        // GỘP THEO performed_at (ngày làm) HOẶC appointment_id
        const grouped = data.reduce((acc, item) => {
          const key = item.performed_at
            ? new Date(item.performed_at).toLocaleDateString("vi-VN")
            : item.appointment_id || item.id;

          if (!acc[key]) {
            acc[key] = {
              date: item.performed_at
                ? new Date(item.performed_at).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Chưa xác định",
              rawDate: item.performed_at || item.appointments?.appointment_date,
              tests: [],
              hasFile: !!item.file_url,
              fileUrl: item.file_url,
            };
          }

          acc[key].tests.push({
            name: item.test_name,
            result: item.result_value,
            unit: item.unit,
            range: item.reference_range,
            note: item.note,
            status: item.status,
          });

          // Nếu có file → ưu tiên dùng file
          if (item.file_url) {
            acc[key].hasFile = true;
            acc[key].fileUrl = item.file_url;
          }

          return acc;
        }, {});

        const result = Object.values(grouped).sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
        setTestGroups(result);
        console.log("Đã gộp thành công:", result.length, "lần làm xét nghiệm");
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPatientData(true);
  };

  const openFile = async (url) => {
  if (!url) {
    Alert.alert("Thông báo", "Chưa có file kết quả");
    return;
  }

  console.log("Đang mở file xét nghiệm:", url);

  try {
    // BƯỚC 1: Kiểm tra xem có thể mở trực tiếp bằng app PDF không (nhanh nhất)
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      console.log("Mở bằng app PDF thành công");
      return;
    }

    // BƯỚC 2: Nếu không mở được → tải về + chia sẻ (cho Android + iOS cũ)
    console.log("Không mở trực tiếp được → tải về thiết bị...");
    const filename = url.split("/").pop() || `ketqua_${Date.now()}.pdf`;
    const localUri = `${FileSystem.documentDirectory}${filename}`;

    const downloadRes = await FileSystem.downloadAsync(url, localUri);
    console.log("Tải về thành công:", downloadRes.uri);

    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("Lỗi", "Thiết bị không hỗ trợ chia sẻ file");
      return;
    }

    await Sharing.shareAsync(downloadRes.uri, {
      mimeType: "application/pdf",
      dialogTitle: "Kết quả xét nghiệm",
      UTI: "com.adobe.pdf", // cho iOS
    });

    console.log("Chia sẻ file thành công");
  } catch (error) {
    console.error("Lỗi mở file:", error);
    Alert.alert("Lỗi", "Không thể mở file. Vui lòng thử lại sau.");
  }
};

  if (loading && !refreshing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Bệnh án điện tử</Text>
        <View style={{ width: 50 }} />
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "records" && styles.tabActive]}
          onPress={() => setActiveTab("records")}
        >
          <Ionicons name="document-text" size={20} color={activeTab === "records" ? "#FFF" : "#64748B"} />
          <Text style={[styles.tabText, activeTab === "records" && styles.tabTextActive]}>
            Bệnh án ({records.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "tests" && styles.tabActive]}
          onPress={() => setActiveTab("tests")}
        >
          <Ionicons name="flask" size={20} color={activeTab === "tests" ? "#FFF" : "#64748B"} />
          <Text style={[styles.tabText, activeTab === "tests" && styles.tabTextActive]}>
            Xét nghiệm ({testGroups.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "records" ? (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="documents-outline" size={70} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Chưa có bệnh án</Text>
              <Text style={styles.emptySub}>Bác sĩ sẽ cập nhật sau mỗi lần khám</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.date}>
                    {new Date(item.created_at).toLocaleDateString("vi-VN", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric"
                    })}
                  </Text>
                  <Ionicons name="person-circle" size={38} color={COLORS.primary} />
                </View>

                <Text style={styles.doctor}>BS. {item.doctor_name}</Text>

                {item.diagnosis && (
                  <View style={styles.section}>
                    <Text style={styles.label}>Chẩn đoán</Text>
                    <Text style={styles.text}>{item.diagnosis}</Text>
                  </View>
                )}

                {item.prescriptions?.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.label}>Đơn thuốc ({item.prescriptions.length} thuốc)</Text>
                    {item.prescriptions.map((med, i) => (
                      <View key={i} style={styles.medicineItem}>
                        <Text style={styles.medicineName}>• {med.medicine_name}</Text>
                        <Text style={styles.medicineDetail}>{med.dosage} • {med.duration}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {item.notes && (
                  <View style={styles.section}>
                    <Text style={styles.label}>Ghi chú</Text>
                    <Text style={styles.text}>{item.notes}</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}
        />
      ) : (
        <FlatList
          data={testGroups}
          keyExtractor={(item, i) => i.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="flask-outline" size={70} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Chưa có kết quả xét nghiệm</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
              <TouchableOpacity
                style={styles.testGroupCard}
                onPress={() => item.hasFile && openFile(item.fileUrl)}
                activeOpacity={item.hasFile ? 0.8 : 1}
              >
                <View style={styles.testGroupHeader}>
                  <Text style={styles.testGroupDate}>{item.date}</Text>
                  {item.hasFile ? (
                    <View style={styles.fileBadge}>
                      <Ionicons name="document-attach" size={20} color={COLORS.primary} />
                      <Text style={styles.fileBadgeText}>Có file PDF</Text>
                    </View>
                  ) : (
                    <Text style={styles.testCount}>{item.tests.length} kết quả</Text>
                  )}
                </View>

                <View style={styles.testList}>
                  {item.tests.slice(0, 3).map((t, i) => (
                    <Text key={i} style={styles.testItem}>
                      • {t.name}: <Text style={{ fontWeight: "600", color: t.status === "abnormal" ? COLORS.warning : COLORS.textPrimary }}>
                        {t.result} {t.unit}
                      </Text>
                    </Text>
                  ))}
                  {item.tests.length > 3 && (
                    <Text style={styles.moreTests}>+ {item.tests.length - 3} kết quả khác</Text>
                  )}
                </View>

                {item.hasFile && (
                  <Text style={styles.tapToView}>Nhấn để xem file PDF</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}

// Thêm style cho nhóm xét nghiệm
const styles = {
  // ... giữ nguyên tất cả style cũ, chỉ bổ sung thêm:
  testGroupCard: {
    backgroundColor: "#FFF",
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary + "40",
  },
  testGroupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  testGroupDate: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  testCount: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  fileBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.lg,
  },
  fileBadgeText: {
    marginLeft: 6,
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  testList: {
    marginTop: 8,
  },
  testItem: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginVertical: 4,
  },
  moreTests: {
    marginTop: 8,
    color: COLORS.primary,
    fontWeight: "600",
    fontStyle: "italic",
  },
  tapToView: {
    marginTop: 12,
    color: COLORS.primary,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
  // ... các style cũ giữ nguyên
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: Platform.OS === "ios" ? 60 : 40, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg, borderBottomLeftRadius: BORDER_RADIUS.xxxl },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.25)", justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", color: "#FFF" },
  tabs: { flexDirection: "row", margin: SPACING.xl, marginBottom: SPACING.md, backgroundColor: "#FFF", borderRadius: BORDER_RADIUS.xl, overflow: "hidden", ...SHADOWS.card },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 8 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 15, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "#FFF" },
  list: { padding: SPACING.xl, paddingTop: 0 },
  card: { backgroundColor: "#FFF", borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING.lg, ...SHADOWS.card },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  date: { fontSize: 15, fontWeight: "600", color: COLORS.primary },
  doctor: { fontSize: 18, fontWeight: "bold", color: COLORS.textPrimary, marginVertical: 8 },
  section: { marginTop: 16 },
  label: { fontSize: 15, fontWeight: "700", color: COLORS.primary },
  text: { fontSize: 16, color: COLORS.textPrimary, marginTop: 6, lineHeight: 23 },
  medicineItem: { marginTop: 10, padding: 12, backgroundColor: "#F0FDF4", borderRadius: BORDER_RADIUS.lg, borderLeftWidth: 4, borderLeftColor: COLORS.success },
  medicineName: { fontSize: 16, fontWeight: "bold", color: COLORS.textPrimary },
  medicineDetail: { fontSize: 15, color: "#16A34A", marginTop: 4 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.textSecondary },
  empty: { alignItems: "center", marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 15, color: COLORS.textSecondary, marginTop: 8, textAlign: "center" },
};