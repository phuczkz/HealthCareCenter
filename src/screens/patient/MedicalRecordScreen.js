import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
  StatusBar,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import { useNavigation } from "@react-navigation/native";
import Animated, { FadeInDown } from "react-native-reanimated";
import theme from "../../theme/theme";

import { MedicalRecordController } from "../../controllers/patient/MedicalRecordController";
import { MedicalRecordService } from "../../services/patient/MedicalRecordService";
import { Rating } from "@kolking/react-native-rating";

const { COLORS, GRADIENTS, SPACING, BORDER_RADIUS, SHADOWS } = theme;

export default function MedicalRecordScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("records");
  const [records, setRecords] = useState([]);
  const [testGroups, setTestGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnpaidInvoice, setHasUnpaidInvoice] = useState(false);

  // State cho modal đánh giá
  const [pendingRating, setPendingRating] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [tempRating, setTempRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  // Hiện modal khi có lượt khám cần đánh giá
  useEffect(() => {
    if (pendingRating) {
      setTempRating(0);
      setReviewText("");
      const timer = setTimeout(() => {
        setShowRatingModal(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [pendingRating]);

  const fetchPatientData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập lại");
        navigation.replace("Login");
        return;
      }

      const patientId = user.id;

      await MedicalRecordController.loadData(
        patientId,
        activeTab,
        setRecords,
        setTestGroups,
        setHasUnpaidInvoice,
        () => {}, // Không dùng pendingRating toàn cục nữa
        setLoading,
        setRefreshing
      );
    } catch (err) {
      console.error("Lỗi tải bệnh án:", err);
      Alert.alert("Lỗi", "Không thể tải dữ liệu. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPatientData(true);
  };

  const openFile = (url) => {
    MedicalRecordService.openFile(url);
  };

  // Gửi đánh giá
  const submitRating = async () => {
    if (tempRating === 0) {
      Alert.alert("Chưa chọn", "Vui lòng chọn số sao để đánh giá");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("doctor_ratings").insert({
        appointment_id: pendingRating.appointmentId,
        doctor_id: pendingRating.doctorId,
        patient_id: user.id,
        rating: tempRating,
        review_text: reviewText.trim() || null,
      });

      if (error) throw error;

      Alert.alert("Cảm ơn bạn! ❤️", "Đánh giá của bạn đã được ghi nhận.");

      setShowRatingModal(false);
      setPendingRating(null);
      setTempRating(0);
      setReviewText("");

      // Reload để cập nhật nút đánh giá
      fetchPatientData(true);
    } catch (err) {
      console.error("Lỗi gửi đánh giá:", err);
      Alert.alert("Lỗi", "Không thể gửi đánh giá. Vui lòng thử lại.");
    }
  };

  // Màn hình khóa nếu còn nợ
  if (hasUnpaidInvoice) {
    return (
      <View style={styles.lockedContainer}>
        <StatusBar barStyle="dark-content" />
        <Ionicons name="lock-closed" size={90} color="#DC2626" />
        <Text style={styles.lockedTitle}>Chưa thanh toán hóa đơn</Text>
        <Text style={styles.lockedText}>
          Bạn cần hoàn tất thanh toán để xem bệnh án và kết quả xét nghiệm.
        </Text>
        <TouchableOpacity
          style={styles.paymentBtn}
          onPress={() => navigation.navigate("PaymentHistory")}
        >
          <Text style={styles.paymentBtnText}>Xem hóa đơn cần thanh toán</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary || "#0066FF"} />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary || "#0066FF"}
      />

      <LinearGradient
        colors={GRADIENTS?.header || ["#0066FF", "#0044CC"]}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Bệnh án điện tử</Text>
        <View style={{ width: 50 }} />
      </LinearGradient>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "records" && styles.activeTab]}
          onPress={() => setActiveTab("records")}
        >
          <Ionicons
            name="document-text"
            size={22}
            color={activeTab === "records" ? "#FFF" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "records" && styles.activeTabText,
            ]}
          >
            Bệnh án ({records.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "tests" && styles.activeTab]}
          onPress={() => setActiveTab("tests")}
        >
          <Ionicons
            name="flask"
            size={22}
            color={activeTab === "tests" ? "#FFF" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "tests" && styles.activeTabText,
            ]}
          >
            Xét nghiệm ({testGroups.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bệnh án – Có nút đánh giá dưới mỗi card */}
      {activeTab === "records" ? (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ padding: SPACING?.xl || 20, paddingTop: 0 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="documents-outline" size={80} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Chưa có bệnh án</Text>
              <Text style={styles.emptySubtitle}>
                Bác sĩ sẽ cập nhật sau mỗi lần khám
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 100).duration(500)}
            >
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardDate}>
                    {new Date(item.created_at).toLocaleDateString("vi-VN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                  <Ionicons
                    name="person-circle"
                    size={40}
                    color={COLORS.primary || "#0066FF"}
                  />
                </View>

                <Text style={styles.doctorName}>BS. {item.doctor_name}</Text>

                {item.diagnosis && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Chẩn đoán</Text>
                    <Text style={styles.sectionContent}>{item.diagnosis}</Text>
                  </View>
                )}

                {item.prescriptions?.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      Đơn thuốc ({item.prescriptions.length})
                    </Text>
                    {item.prescriptions.map((med, i) => (
                      <View key={i} style={styles.medItem}>
                        <Text style={styles.medName}>
                          • {med.medicine_name}
                        </Text>
                        <Text style={styles.medDetail}>
                          {med.dosage} • {med.duration}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {item.notes && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ghi chú</Text>
                    <Text style={styles.sectionContent}>{item.notes}</Text>
                  </View>
                )}

                {/* NÚT ĐÁNH GIÁ DƯỚI MỖI BỆNH ÁN */}
                {!item.hasRating && item.appointmentId && (
                  <TouchableOpacity
                    style={styles.ratingButton}
                    onPress={() => {
                      setPendingRating({
                        appointmentId: item.appointmentId,
                        doctorId: item.doctor_id, // ← DÙNG item.doctor_id (đã có từ service)
                        doctorName: item.doctor_name,
                      });
                    }}
                  >
                    <Ionicons name="star-outline" size={20} color="#F59E0B" />
                    <Text style={styles.ratingButtonText}>Đánh giá bác sĩ</Text>
                  </TouchableOpacity>
                )}

                {item.hasRating && (
                  <View style={styles.ratedContainer}>
                    <Ionicons name="star" size={18} color="#F59E0B" />
                    <Text style={styles.ratedText}>Đã đánh giá bác sĩ</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}
        />
      ) : (
        /* Tab Xét nghiệm – giữ nguyên */
        <FlatList
          data={testGroups}
          keyExtractor={(_, i) => i.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ padding: SPACING?.xl || 20, paddingTop: 0 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="flask-outline" size={80} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Chưa có kết quả xét nghiệm</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 100).duration(500)}
            >
              <TouchableOpacity
                style={styles.testCard}
                onPress={() => item.hasFile && openFile(item.fileUrl)}
                activeOpacity={item.hasFile ? 0.8 : 1}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardDate}>{item.date}</Text>
                  {item.hasFile ? (
                    <View style={styles.pdfBadge}>
                      <Ionicons
                        name="document-attach"
                        size={20}
                        color={COLORS.primary || "#0066FF"}
                      />
                      <Text style={styles.pdfText}>Có file PDF</Text>
                    </View>
                  ) : (
                    <Text style={styles.testCount}>
                      {item.tests.length} kết quả
                    </Text>
                  )}
                </View>

                {item.tests.slice(0, 3).map((t, i) => (
                  <Text key={i} style={styles.testItem}>
                    • {t.name}:{" "}
                    <Text
                      style={{
                        fontWeight: "600",
                        color: t.status === "abnormal" ? "#DC2626" : "#1E293B",
                      }}
                    >
                      {t.result} {t.unit}
                    </Text>
                  </Text>
                ))}

                {item.tests.length > 3 && (
                  <Text style={styles.moreText}>
                    + {item.tests.length - 3} kết quả khác
                  </Text>
                )}

                {item.hasFile && (
                  <Text style={styles.viewPdfText}>Nhấn để xem file PDF</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      )}

      {/* Modal đánh giá */}
      <Modal
        key={pendingRating?.appointmentId || "no-rating"}
        visible={showRatingModal}
        transparent
        animationType="fade"
      >
        <KeyboardAvoidingView
          style={styles.ratingModalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity
            style={styles.overlayTouch}
            activeOpacity={1}
            onPress={() => {
              setShowRatingModal(false);
              setPendingRating(null);
            }}
          />

          <View style={styles.ratingModal}>
            <LinearGradient
              colors={["#F0FDF4", "#BBF7D0"]}
              style={styles.ratingModalHeader}
            >
              <View style={styles.ratingModalHeaderContent}>
                <Ionicons name="star-outline" size={32} color="#F59E0B" />
                <Text style={styles.ratingModalTitle}>Đánh giá bác sĩ</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowRatingModal(false);
                    setPendingRating(null);
                  }}
                >
                  <Ionicons name="close" size={28} color="#64748B" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <Text style={styles.ratingModalSubtitle}>
                Buổi khám với{" "}
                <Text style={{ fontWeight: "bold" }}>
                  BS. {pendingRating?.doctorName || "bác sĩ"}
                </Text>{" "}
                như thế nào?
              </Text>

              <View style={styles.ratingStarsContainer}>
                <Rating
                  rating={tempRating}
                  onChange={setTempRating}
                  size={56}
                  fillColor="#F59E0B"
                  strokeColor="#FCD34D"
                  animationConfig={{ scale: 1.2 }}
                />
                <Text style={styles.ratingScoreText}>
                  {tempRating > 0 ? `${tempRating} sao` : "Chạm để chọn"}
                </Text>
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewTitle}>Nhận xét thêm (tùy chọn)</Text>
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Bạn muốn chia sẻ gì về buổi khám hôm nay?"
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={reviewText}
                  onChangeText={setReviewText}
                  maxLength={500}
                />
                <Text style={styles.charCount}>{reviewText.length}/500</Text>
              </View>

              <View style={styles.ratingInfo}>
                <Text style={styles.infoText}>
                  • Đánh giá hoàn toàn ẩn danh
                </Text>
                <Text style={styles.infoText}>
                  • Giúp bác sĩ cải thiện chất lượng khám
                </Text>
              </View>
            </ScrollView>

            <View style={styles.ratingModalFooter}>
              <TouchableOpacity
                onPress={() => {
                  setShowRatingModal(false);
                  setPendingRating(null);
                }}
                style={styles.skipBtn}
              >
                <Text style={styles.skipBtnText}>Bỏ qua</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  tempRating === 0 && styles.submitBtnDisabled,
                ]}
                onPress={submitRating}
                disabled={tempRating === 0}
              >
                <Text style={styles.submitBtnText}>
                  Gửi đánh giá {tempRating > 0 && `(${tempRating}⭐)`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// TOÀN BỘ STYLES – ĐÃ THÊM STYLE CHO NÚT ĐÁNH GIÁ
const styles = {
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontSize: 16, color: "#64748B" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: SPACING?.xl || 20,
    paddingBottom: SPACING?.lg || 20,
    borderBottomLeftRadius: BORDER_RADIUS?.xxxl || 32,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#FFF" },
  tabBar: {
    flexDirection: "row",
    margin: SPACING?.xl || 20,
    marginBottom: SPACING?.md || 12,
    backgroundColor: "#FFF",
    borderRadius: BORDER_RADIUS?.xl || 20,
    overflow: "hidden",
    ...SHADOWS?.card,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: { backgroundColor: COLORS.primary || "#0066FF" },
  tabText: { fontSize: 15, fontWeight: "600", color: "#64748B" },
  activeTabText: { color: "#FFF", fontWeight: "700" },
  card: {
    backgroundColor: "#FFF",
    borderRadius: BORDER_RADIUS?.xl || 20,
    padding: SPACING?.xl || 20,
    marginBottom: SPACING?.lg || 16,
    ...SHADOWS?.card,
  },
  testCard: {
    backgroundColor: "#FFF",
    borderRadius: BORDER_RADIUS?.xl || 20,
    padding: SPACING?.xl || 20,
    marginBottom: SPACING?.lg || 16,
    ...SHADOWS?.card,
    borderLeftWidth: 5,
    borderLeftColor: (COLORS.primary || "#0066FF") + "40",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardDate: { fontSize: 17, fontWeight: "bold", color: "#1E293B" },
  pdfBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: (COLORS.primary || "#0066FF") + "15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pdfText: {
    marginLeft: 6,
    color: COLORS.primary || "#0066FF",
    fontWeight: "600",
  },
  testCount: { fontSize: 15, color: "#64748B", fontWeight: "600" },
  doctorName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginVertical: 6,
  },
  section: { marginTop: 14 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary || "#0066FF",
  },
  sectionContent: {
    fontSize: 16,
    color: "#1E293B",
    marginTop: 8,
    lineHeight: 24,
  },
  medItem: {
    marginTop: 10,
    padding: 14,
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#22C55E",
  },
  medName: { fontSize: 16, fontWeight: "bold", color: "#1E293B" },
  medDetail: { fontSize: 15, color: "#16A34A", marginTop: 4 },
  testItem: { fontSize: 15, color: "#64748B", marginVertical: 5 },
  moreText: {
    marginTop: 10,
    color: COLORS.primary || "#0066FF",
    fontWeight: "600",
    fontStyle: "italic",
  },
  viewPdfText: {
    marginTop: 14,
    color: COLORS.primary || "#0066FF",
    fontSize: 15,
    textAlign: "center",
    fontWeight: "700",
  },
  empty: { alignItems: "center", marginTop: 120 },
  emptyTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#1E293B",
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 10,
    textAlign: "center",
  },
  lockedContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  lockedTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1E293B",
    textAlign: "center",
    marginTop: 24,
  },
  lockedText: {
    fontSize: 17,
    color: "#64748B",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 28,
  },
  paymentBtn: {
    marginTop: 36,
    backgroundColor: "#0066FF",
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 18,
    elevation: 8,
  },
  paymentBtnText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },

  // NÚT ĐÁNH GIÁ DƯỚI CARD
  ratingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: "#FEF3C7",
    borderRadius: 16,
    alignSelf: "center",
    gap: 8,
  },
  ratingButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400E",
  },
  ratedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    gap: 6,
  },
  ratedText: {
    fontSize: 15,
    color: "#64748B",
    fontStyle: "italic",
  },

  // Modal styles
  ratingModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayTouch: { position: "absolute", width: "100%", height: "100%" },
  ratingModal: {
    width: "92%",
    maxHeight: "88%",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    overflow: "hidden",
    ...SHADOWS?.modal,
  },
  ratingModalHeader: { paddingVertical: 20, paddingHorizontal: 24 },
  ratingModalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ratingModalTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#1E293B",
    flex: 1,
    marginLeft: 12,
  },
  ratingModalSubtitle: {
    fontSize: 17,
    color: "#475569",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 32,
  },
  ratingStarsContainer: { alignItems: "center", marginBottom: 36 },
  ratingScoreText: {
    marginTop: 20,
    fontSize: 19,
    fontWeight: "700",
    color: "#1E293B",
  },
  reviewSection: { marginBottom: 28 },
  reviewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
  },
  reviewInput: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#F8FAFC",
    minHeight: 120,
    textAlignVertical: "top",
    fontSize: 16,
  },
  charCount: {
    alignSelf: "flex-end",
    marginTop: 8,
    fontSize: 14,
    color: "#94A3B8",
  },
  ratingInfo: { marginBottom: 20 },
  infoText: {
    fontSize: 15,
    color: "#64748B",
    marginBottom: 10,
    paddingLeft: 8,
  },
  ratingModalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FAFAFA",
  },
  skipBtn: { paddingHorizontal: 20, paddingVertical: 12 },
  skipBtnText: { fontSize: 17, color: "#64748B", fontWeight: "600" },
  submitBtn: {
    backgroundColor: "#10B981",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  submitBtnDisabled: { backgroundColor: "#94A3B8" },
  submitBtnText: { color: "#FFFFFF", fontSize: 17, fontWeight: "bold" },
};
