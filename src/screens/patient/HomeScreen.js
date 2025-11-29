import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../api/supabase";
import { getUserProfile } from "../../controllers/patient/userController";
import theme from "../../theme/theme";

const { SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } = theme;

export default function HomeScreen() {
  const navigation = useNavigation();
  const [displayName, setDisplayName] = useState("Bạn");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (user?.id) setUserId(user.id);
      } catch (err) {
        console.error("Lỗi lấy user:", err.message);
      }
    };
    fetch();
  }, []);

  // LẤY TÊN THẬT KHI CÓ userId
  useEffect(() => {
    if (!userId) return;

    const loadProfile = async () => {
      try {
        const profile = await getUserProfile(userId);
        const name = profile?.full_name || profile?.name || "Bạn";
        setDisplayName(name);
      } catch (err) {
        console.log("Lỗi lấy profile → dùng email làm tên");
        const { data: { user } } = await supabase.auth.getUser();
        const fallback = user?.email?.split("@")[0] || "Bạn";
        setDisplayName(fallback);
      }
    };
    loadProfile();
  }, [userId]);

  // MENU CHÍNH – ĐÃ THÊM "BỆNH ÁN"
  const menuItems = [
    { title: "Đặt khám",        icon: "calendar-outline",    screen: "BookingOptionsScreen",   color: ["#E0F2FE", "#BFDBFE"] },
    { title: "Lịch sử",         icon: "time-outline",        screen: "HistoryScreen",          color: ["#FEF3C7", "#FDE68A"] },
    { title: "Bệnh án",         icon: "document-text-outline", screen: "MedicalRecordScreen",  color: ["#DCFCE7", "#BBF7D0"] }, // MỚI
    { title: "Hồ sơ",           icon: "person-outline",      screen: "ProfileScreen",          color: ["#E0E7FF", "#C7D2FE"] },
    { title: "Theo dõi",        icon: "pulse-outline",       screen: null,                     color: ["#FCE7F3", "#FBCFE8"] },
    { title: "Cộng đồng",       icon: "people-outline",      screen: null,                     color: ["#F3E8FF", "#E9D5FF"] },
  ];

  const scales = useRef(menu.map(() => new Animated.Value(1))).current;

  const animatePress = (index) => {
    Animated.sequence([
      Animated.timing(scales[index], { toValue: 0.94, duration: 100, useNativeDriver: true }),
      Animated.spring(scales[index], { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
    ]).start(() => {
      if (screen) navigation.navigate(screen);
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header xanh dương sạch */}
      <LinearGradient colors={["#2563EB", "#3B82F6"]} style={styles.header}>
        <Text style={styles.greeting}>Xin chào,</Text>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.subtitle}>Chăm sóc sức khỏe của bạn hôm nay</Text>
      </LinearGradient>

      {/* INFO BOX – LỊCH KHÁM SẮP TỚI */}
      <TouchableWithoutFeedback onPress={() => navigation.navigate("HistoryScreen")}>
        <View style={styles.infoBox}>
          <Ionicons name="medkit-outline" size={26} color="#059669" />
          <Text style={styles.infoText}>Bạn có lịch khám sắp tới • Xem ngay</Text>
          <Ionicons name="arrow-forward-circle" size={28} color="#3B82F6" />
        </View>
      </TouchableWithoutFeedback>

      {/* Grid menu – nhỏ gọn, chỉ 1 màu icon + nền trắng */}
      <View style={styles.grid}>
        {menu.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.menuItem}
            onPress={() => {
              animatePress(i);
              item.screen && navigation.navigate(item.screen);
            }}
            disabled={!item.screen}
            activeOpacity={0.85}
          >
            <Animated.View style={[styles.itemInner, { transform: [{ scale: scales[i] }] }]}>
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon} size={28} color="#2563EB" />
              </View>
              <Text style={styles.itemText}>{item.title}</Text>
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tin tức – đơn giản, sạch */}
      <View style={styles.newsSection}>
        <Text style={styles.newsTitle}>Tin tức sức khỏe</Text>
        <TouchableOpacity style={styles.newsCard}>
          <Ionicons name="heart" size={26} color="#EF4444" />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.newsHeadline}>10 mẹo giữ sức khỏe mùa đông</Text>
            <Text style={styles.newsDate}>18/11/2025</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.newsHeadline}>10 mẹo giữ sức khỏe mùa đông từ chuyên gia</Text>
            <Text style={styles.newsDate}>17/11/2025 • 5 phút đọc</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
        </View>
      </View>
    </ScrollView>
  );
}

// STYLES ĐẸP NHƯ APP CAO CẤP
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    paddingTop: theme.headerPaddingTop || 60,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  greeting: { fontSize: 18, color: "#DBEAFE", fontWeight: "600" },
  name: { fontSize: 38, fontWeight: "900", color: "#FFFFFF", marginTop: 6, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: "#E0F2FE", marginTop: 10, lineHeight: 22 },

  infoBox: {
    marginHorizontal: SPACING.xl,
    marginTop: -28,
    backgroundColor: "#FFFFFF",
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  infoText: { fontSize: 15, fontWeight: "700", color: "#1E293B", flex: 1, marginLeft: 14 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xxl,
  },
  menuItem: {
    width: "30%",
    marginBottom: SPACING.xl,
  },
  itemInner: {
    backgroundColor: "#FFFFFF",
    paddingVertical: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: "center",
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EBF5FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  disabled: { opacity: 0.5 },
  iconWrapper: { borderRadius: 48, padding: 20, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: "800", color: "#1E293B", textAlign: "center" },

  newsSection: { paddingHorizontal: 24, marginTop: 20 },
  newsTitle: { fontSize: 20, fontWeight: "800", color: "#1E293B", marginBottom: 16 },
  newsCard: {
    backgroundColor: "#FFFFFF",
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  newsIcon: { backgroundColor: "#FEE2E2", padding: 12, borderRadius: 20, marginRight: 16 },
  newsHeadline: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  newsDate: { fontSize: 13, color: "#94A3B8", marginTop: 4 },
});
