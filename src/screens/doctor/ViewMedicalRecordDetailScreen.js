import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRoute, useNavigation } from "@react-navigation/native";
import { supabase } from "../../api/supabase";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

export default function ViewMedicalRecordDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { appointmentId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [appointmentInfo, setAppointmentInfo] = useState({});
  const [testResults, setTestResults] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [invoice, setInvoice] = useState(null);

  const containerOpacity = useSharedValue(0);
  const containerTranslateY = useSharedValue(40);

  useEffect(() => {
    if (appointmentId) {
      fetchAllData();
    } else {
      Alert.alert("Lỗi", "Không tìm thấy lịch hẹn");
      setLoading(false);
    }
  }, [appointmentId]);

  const fetchAllData = async () => {
    try {
      const { data: aptData, error: aptError } = await supabase
        .from("appointments")
        .select(
          `
          user_id,
          doctor_id,
          appointment_date,
          symptoms,
          service_id,
          services (*),
          doctors!inner (
            id,
            name,
            service_id,
            services (*)
          )
        `
        )
        .eq("id", appointmentId)
        .single();

      if (aptError) throw aptError;

      const patientId = aptData.user_id;
      const doctorName = aptData.doctors?.name || "Bác sĩ";

      let serviceName = "Khám tổng quát";
      if (aptData.service_id && aptData.services?.name)
        serviceName = aptData.services.name;
      else if (aptData.doctors?.service_id && aptData.doctors.services?.name)
        serviceName = aptData.doctors.services.name;

      setAppointmentInfo({
        appointment_date: aptData.appointment_date,
        symptoms: aptData.symptoms,
        service_name: serviceName,
        doctor_name: doctorName,
      });

      if (!patientId) throw new Error("Không tìm thấy bệnh nhân");

      const { data: patientData, error: patientError } = await supabase
        .from("user_profiles")
        .select(
          "full_name, date_of_birth, gender, phone, allergies, medical_history"
        )
        .eq("id", patientId)
        .single();
      if (patientError) throw patientError;
      setPatient(patientData);

      const { data: testsData } = await supabase
        .from("test_results")
        .select("*")
        .eq("appointment_id", appointmentId)
        .order("performed_at", { ascending: false });
      setTestResults(testsData || []);

      let presData = [];
      try {
        const { data: record } = await supabase
          .from("medical_records")
          .select("id")
          .eq("appointment_id", appointmentId)
          .single();
        if (record) {
          const { data: pres } = await supabase
            .from("prescriptions")
            .select("*")
            .eq("record_id", record.id);
          presData = pres || [];
        }
      } catch {}
      setPrescriptions(presData);

      const { data: invoiceData } = await supabase
        .from("invoices")
        .select("*")
        .eq("appointment_id", appointmentId)
        .single();
      setInvoice(invoiceData || null);
    } catch (error) {
      console.error(error);
      Alert.alert("Lỗi", error.message || "Không thể tải bệnh án");
    } finally {
      setLoading(false);

      containerOpacity.value = withTiming(1, { duration: 800 });
      containerTranslateY.value = withTiming(0, { duration: 900 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ translateY: containerTranslateY.value }],
  }));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Đang tải bệnh án...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeIn.duration(600)}>
        <LinearGradient colors={["#0066FF", "#0050CC"]} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back-ios" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Chi Tiết Bệnh Án</Text>
              <Text style={styles.headerSubtitle}>
                {patient?.full_name || "Bệnh nhân"} •{" "}
                {appointmentInfo.service_name}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={animatedStyle}>
          <Animated.View entering={FadeInUp.delay(100).springify()}>
            <Section title="Thông Tin Bệnh Nhân" icon="person-outline">
              <InfoRow
                icon="person"
                label="Họ tên"
                value={patient?.full_name || "N/A"}
              />
              <InfoRow
                icon="local-hospital"
                label="Bác sĩ khám"
                value={appointmentInfo.doctor_name}
              />
              <InfoRow
                icon="medical-services"
                label="Dịch vụ"
                value={appointmentInfo.service_name}
              />
              <InfoRow
                icon="calendar-today"
                label="Ngày khám"
                value={
                  appointmentInfo.appointment_date
                    ? new Date(
                        appointmentInfo.appointment_date
                      ).toLocaleDateString("vi-VN")
                    : "N/A"
                }
              />
              <InfoRow
                icon="cake"
                label="Ngày sinh"
                value={
                  patient?.date_of_birth
                    ? new Date(patient.date_of_birth).toLocaleDateString(
                        "vi-VN"
                      )
                    : "N/A"
                }
              />
              <InfoRow
                icon="wc"
                label="Giới tính"
                value={
                  patient?.gender
                    ? patient.gender === "male"
                      ? "Nam"
                      : "Nữ"
                    : "N/A"
                }
              />
              <InfoRow
                icon="phone"
                label="Số điện thoại"
                value={patient?.phone || "N/A"}
              />
              {appointmentInfo.symptoms && (
                <InfoRow
                  icon="note"
                  label="Triệu chứng"
                  value={appointmentInfo.symptoms}
                  multiline
                />
              )}
              {patient?.allergies && (
                <InfoRow
                  icon="warning"
                  label="Dị ứng"
                  value={patient.allergies}
                  multiline
                />
              )}
              {patient?.medical_history && (
                <InfoRow
                  icon="history"
                  label="Tiền sử bệnh"
                  value={patient.medical_history}
                  multiline
                />
              )}
            </Section>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).springify()}>
            {testResults.length > 0 ? (
              <Section title="Kết Quả Xét Nghiệm" icon="biotech">
                {testResults.map((test, index) => (
                  <Animated.View
                    key={test.id}
                    entering={FadeInUp.delay(300 + index * 80).springify()}
                  >
                    <TestCard test={test} index={index} />
                  </Animated.View>
                ))}
              </Section>
            ) : (
              <EmptySection text="Chưa có kết quả xét nghiệm" />
            )}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).springify()}>
            {prescriptions.length > 0 ? (
              <Section title="Đơn Thuốc" icon="medication">
                {prescriptions.map((p, index) => (
                  <Animated.View
                    key={p.id}
                    entering={FadeInUp.delay(400 + index * 80).springify()}
                  >
                    <PrescriptionCard prescription={p} index={index} />
                  </Animated.View>
                ))}
              </Section>
            ) : (
              <EmptySection text="Chưa kê đơn thuốc" />
            )}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).springify()}>
            {invoice ? (
              <Section title="Hóa Đơn" icon="receipt-long">
                <InfoRow
                  icon="tag"
                  label="Mã hóa đơn"
                  value={invoice.invoice_number || "N/A"}
                />
                <InfoRow
                  icon="payments"
                  label="Tổng tiền"
                  value={
                    <Text style={styles.priceText}>
                      {(invoice.total_amount || 0).toLocaleString("vi-VN")} ₫
                    </Text>
                  }
                />
                <InfoRow
                  icon="info-outline"
                  label="Trạng thái"
                  value={
                    <LinearGradient
                      colors={
                        invoice.status === "paid"
                          ? ["#10B981", "#059669"]
                          : ["#F59E0B", "#D97706"]
                      }
                      style={styles.statusBadge}
                    >
                      <Text style={styles.badgeText}>
                        {invoice.status === "paid"
                          ? "ĐÃ THANH TOÁN"
                          : "CHƯA THANH TOÁN"}
                      </Text>
                    </LinearGradient>
                  }
                />
              </Section>
            ) : (
              <EmptySection text="Chưa có hóa đơn" />
            )}
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const TestCard = ({ test, index }) => (
  <View style={styles.testCard}>
    <View style={styles.cardHeader}>
      <Text style={styles.testName}>
        {index + 1}. {test.test_name}
      </Text>
      <Text style={styles.testType}>{test.test_type.toUpperCase()}</Text>
    </View>
    <Text style={styles.resultText}>
      Kết quả: <Text style={styles.bold}>{test.result_value || "Chưa có"}</Text>{" "}
      {test.unit && `(${test.unit})`}
    </Text>
    {test.reference_range && (
      <Text style={styles.refText}>Tham chiếu: {test.reference_range}</Text>
    )}
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>Trạng thái: </Text>
      <Text
        style={[
          styles.statusValue,
          { color: test.status === "normal" ? "#10B981" : "#EF4444" },
        ]}
      >
        {test.status === "normal" ? "BÌNH THƯỜNG" : "BẤT THƯỜNG"}
      </Text>
    </View>
    {test.performed_at && (
      <Text style={styles.dateText}>
        Thực hiện: {new Date(test.performed_at).toLocaleDateString("vi-VN")}
      </Text>
    )}
    {test.note && <Text style={styles.noteText}>Ghi chú: {test.note}</Text>}
  </View>
);

const PrescriptionCard = ({ prescription, index }) => (
  <View style={styles.prescriptionCard}>
    <Text style={styles.medicineName}>
      {index + 1}. {prescription.medicine_name}
    </Text>
    <Text style={styles.dosageText}>
      Liều dùng: {prescription.dosage || "Theo chỉ định bác sĩ"}
    </Text>
    <Text style={styles.detailText}>
      Thời gian: {prescription.duration || "Không xác định"}
    </Text>
    <Text style={styles.detailText}>
      Uống: Sáng <Text style={styles.bold}>{prescription.morning || 0}</Text> •
      Trưa <Text style={styles.bold}>{prescription.noon || 0}</Text> • Chiều{" "}
      <Text style={styles.bold}>{prescription.afternoon || 0}</Text> • Tối{" "}
      <Text style={styles.bold}>{prescription.evening || 0}</Text>
    </Text>
    <Text style={styles.detailText}>
      Mỗi lần:{" "}
      <Text style={styles.bold}>{prescription.quantity_per_dose || 1}</Text>{" "}
      viên | Tổng:{" "}
      <Text style={styles.bold}>{prescription.total_quantity}</Text> viên
    </Text>
  </View>
);

const Section = ({ title, icon, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <MaterialIcons name={icon} size={24} color="#0066FF" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

const InfoRow = ({ icon, label, value, multiline }) => (
  <View style={styles.infoRow}>
    <View style={styles.labelContainer}>
      <MaterialIcons name={icon} size={20} color="#64748B" />
      <Text style={styles.label}>{label}</Text>
    </View>
    {typeof value === "object" ? (
      value
    ) : (
      <Text style={[styles.value, multiline && styles.multilineValue]}>
        {value}
      </Text>
    )}
  </View>
);

const EmptySection = ({ text }) => (
  <View style={styles.emptyCard}>
    <MaterialCommunityIcons
      name="file-document-outline"
      size={48}
      color="#CBD5E1"
    />
    <Text style={styles.emptyText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  loadingText: { marginTop: 12, color: "#64748B", fontSize: 16 },

  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: { flexDirection: "row", alignItems: "center" },
  backButton: { padding: 8, marginRight: 12 },
  headerTextContainer: { flex: 1 },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 16, color: "#E0F2FE", opacity: 0.9 },

  scrollContent: { padding: 20, paddingTop: 10 },

  section: {
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#1E293B" },
  sectionContent: { gap: 14 },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 6,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 140,
    gap: 8,
  },
  label: { fontSize: 15.5, color: "#475569", fontWeight: "600" },
  value: { flex: 1, fontSize: 15.5, color: "#1E293B", fontWeight: "600" },
  multilineValue: { lineHeight: 24 },
  bold: { fontWeight: "800", color: "#1E293B" },

  testCard: {
    backgroundColor: "#FFFBEB",
    padding: 18,
    borderRadius: 16,
    borderLeftWidth: 6,
    borderLeftColor: "#F59E0B",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  testName: { fontSize: 17, fontWeight: "800", color: "#1E293B", flex: 1 },
  testType: {
    fontSize: 13,
    color: "#F59E0B",
    fontWeight: "700",
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultText: { fontSize: 16, color: "#475569", marginBottom: 6 },
  refText: {
    fontSize: 15,
    color: "#64748B",
    fontStyle: "italic",
    marginBottom: 6,
  },
  statusRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  statusLabel: { fontSize: 15, color: "#475569" },
  statusValue: { fontSize: 16, fontWeight: "800" },
  dateText: { fontSize: 14, color: "#64748B", marginTop: 4 },
  noteText: {
    fontSize: 14,
    color: "#DC2626",
    fontStyle: "italic",
    marginTop: 8,
  },

  prescriptionCard: {
    backgroundColor: "#F0F9FF",
    padding: 18,
    borderRadius: 16,
    borderLeftWidth: 6,
    borderLeftColor: "#0066FF",
  },
  medicineName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 10,
  },
  dosageText: {
    fontSize: 16,
    color: "#0066FF",
    fontWeight: "700",
    marginBottom: 6,
  },
  detailText: { fontSize: 15, color: "#475569", marginBottom: 4 },

  priceText: { fontSize: 20, fontWeight: "800", color: "#059669" },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    alignSelf: "flex-start",
  },
  badgeText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },

  emptyCard: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    marginBottom: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#94A3B8",
    fontStyle: "italic",
  },
});
