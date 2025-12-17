import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import theme from "../../../theme/theme";

const { SPACING } = theme;
const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - SPACING.xl * 2 - 32) / 3; // 3 cái 1 hàng, có khoảng cách

const guides = [
  {
    id: "booking",
    title: "Đặt lịch khám",
    icon: "calendar-outline",
    color: "#3B82F6",
  },
  {
    id: "process",
    title: "Quy trình khám",
    icon: "git-network-outline",
    color: "#8B5CF6",
  },
  {
    id: "payment",
    title: "Thanh toán",
    icon: "card-outline",
    color: "#10B981",
  },
  {
    id: "test",
    title: "Lấy mẫu xét nghiệm",
    icon: "flask-outline",
    color: "#F59E0B",
  },
  {
    id: "result",
    title: "Xem kết quả",
    icon: "document-text-outline",
    color: "#EF4444",
  },
  {
    id: "faq",
    title: "Hỏi đáp",
    icon: "help-circle-outline",
    color: "#0D6EFD",
  },
];

export default function CustomerGuideScreen({ navigation }) {
  const [activeId, setActiveId] = useState(null);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const toggleSection = (id) => {
    setActiveId(activeId === id ? null : id);
    if (
      activeId !== id &&
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 500, animated: true });
      }, 300)
    );
  };

  const currentItem = guides.find((g) => g.id === activeId);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#1D4ED8", "#3B82F6"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hướng dẫn sử dụng</Text>
        <View style={{ width: 28 }} />
      </LinearGradient>

      <Animated.ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        style={{ opacity: fadeAnim }}
      >
        <View style={styles.hero}>
          <View style={styles.heartCircle}>
            <Ionicons name="heart" size={48} color="#3B82F6" />
          </View>
          <Text style={styles.heroTitle}>Hỗ trợ bạn</Text>
          <Text style={styles.heroSubtitle}>từng bước một cách dễ dàng</Text>
        </View>

        {/* 3 cái trên 1 hàng ngang */}
        <View style={styles.grid}>
          {guides.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              style={[
                styles.gridItem,
                activeId === item.id && styles.activeGridItem,
              ]}
              onPress={() => toggleSection(item.id)}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: item.color + "18" },
                ]}
              >
                <Ionicons name={item.icon} size={32} color={item.color} />
              </View>
              <Text style={styles.gridTitle}>{item.title}</Text>
              <Ionicons
                name={activeId === item.id ? "chevron-up" : "chevron-down"}
                size={20}
                color="#64748B"
                style={{ marginTop: 8 }}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Phần chi tiết khi bấm */}
        {activeId && currentItem && (
          <View style={styles.detailCard}>
            <LinearGradient
              colors={[currentItem.color, currentItem.color + "DD"]}
              style={styles.detailHeader}
            >
              <Ionicons name={currentItem.icon} size={32} color="#FFF" />
              <Text style={styles.detailTitle}>{currentItem.title}</Text>
            </LinearGradient>

            <View style={styles.detailBody}>
              {activeId === "booking" && (
                <>
                  <Step text="1. Trang chủ → Bấm nút Đặt khám ngay" />
                  <Step text="2. Chọn chuyên khoa → bác sĩ → ngày giờ phù hợp" />
                  <Step text="3. Xác nhận → nhận mã đặt lịch qua SMS" />
                  <Text style={styles.successText}>
                    Hoàn thành chỉ trong 30 giây!
                  </Text>
                </>
              )}
              {activeId === "process" && (
                <>
                  <Step text="1. Đăng ký tại quầy tiếp nhận" />
                  <Step text="2. Khám lâm sàng với bác sĩ chuyên khoa" />
                  <Step text="3. Thực hiện xét nghiệm / chẩn đoán hình ảnh (nếu có)" />
                  <Step text="4. Nhận kết quả & tư vấn phác đồ điều trị" />
                </>
              )}
              {activeId === "payment" && (
                <>
                  <Step text="• Thanh toán: Tiền mặt, thẻ, chuyển khoản, QR Code" />
                  <Step text="• Hỗ trợ BHYT + mọi loại bảo hiểm tư nhân" />
                  <Step text="• In hóa đơn điện tử ngay lập tức" />
                </>
              )}
              {activeId === "test" && (
                <>
                  <Step text="• Nhịn ăn 6-8h nếu làm xét nghiệm máu" />
                  <Step text="• Mang CMND/CCCD + mã đặt lịch" />
                  <Step text="• Lấy mẫu tại Tầng 1 – Khu xét nghiệm" />
                </>
              )}
              {activeId === "result" && (
                <>
                  <Step text="• Vào app → mục Bệnh án" />
                  <Step text="• Xem ngay kết quả xét nghiệm, X-quang, siêu âm..." />
                  <Step text="• Tải PDF miễn phí, chia sẻ dễ dàng" />
                </>
              )}
              {activeId === "faq" && (
                <>
                  <Step text="• Đặt lịch có mất phí không? → Hoàn toàn miễn phí" />
                  <Step text="• Có hủy lịch được không? → Được, trước 2h" />
                  <Step text="• Mang gì khi đi khám? → CMND + Mã đặt lịch" />
                </>
              )}
            </View>
          </View>
        )}
      </Animated.ScrollView>

      {/* Nút hotline nổi */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.9}
        onPress={() => Linking.openURL("tel:0854776885")}
      >
        <LinearGradient
          colors={["#10B981", "#059669"]}
          style={styles.fabGradient}
        >
          <Ionicons name="call" size={28} color="#FFF" />
          <View style={styles.supportBadge}>
            <Text style={styles.supportText}>24/7</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const Step = ({ text }) => (
  <View style={styles.stepRow}>
    <View style={styles.bullet} />
    <Text style={styles.stepText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: SPACING.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#FFF" },

  hero: {
    alignItems: "center",
    marginHorizontal: SPACING.xl,
    marginTop: 20,
    paddingVertical: 40,
    backgroundColor: "#EFF6FF",
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
  },
  heartCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroTitle: { fontSize: 30, fontWeight: "900", color: "#1E40AF" },
  heroSubtitle: { fontSize: 17, color: "#64748B", marginTop: 6 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    marginTop: 24,
  },
  gridItem: {
    width: ITEM_WIDTH,
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  activeGridItem: {
    borderColor: "#3B82F6",
    backgroundColor: "#F0F7FF",
    borderWidth: 2.5,
    transform: [{ scale: 1.05 }],
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
    lineHeight: 20,
  },

  detailCard: {
    marginHorizontal: SPACING.xl,
    marginTop: 32,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  detailHeader: {
    padding: 28,
    flexDirection: "row",
    alignItems: "center",
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
    marginLeft: 18,
  },
  detailBody: { backgroundColor: "#FFF", padding: 28 },
  stepRow: { flexDirection: "row", marginBottom: 16, alignItems: "flex-start" },
  bullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3B82F6",
    marginTop: 6,
    marginRight: 14,
  },
  stepText: { flex: 1, fontSize: 16.5, color: "#334155", lineHeight: 26 },
  successText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#10B981",
    marginTop: 20,
    textAlign: "center",
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "#FFF",
    overflow: "hidden",
  },
  fabGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  supportBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#FF3B30",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  supportText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
});
