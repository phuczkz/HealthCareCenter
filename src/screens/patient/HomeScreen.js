// src/screens/patient/HomeScreen.js
import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  useWindowDimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// IMPORT ĐÚNG
import { supabase } from "../../api/supabase";
import { getUserProfile } from "../../controllers/patient/userController";

export default function HomeScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isSmall = width < 400;

  const [displayName, setDisplayName] = useState("Bạn");
  const [userId, setUserId] = useState(null);

  // LẤY USER ID TỪ SUPABASE
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) throw error;
        if (user?.id) setUserId(user.id);
      } catch (err) {
        console.error("Lỗi lấy user:", err.message);
      }
    };
    fetchUser();
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
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const fallback = user?.email?.split("@")[0] || "Bạn";
        setDisplayName(fallback);
      }
    };
    loadProfile();
  }, [userId]);

  // MENU CHÍNH – ĐÃ THÊM "BỆNH ÁN"
  const menuItems = [
    {
      title: "Đặt khám",
      icon: "calendar-outline",
      screen: "BookingOptionsScreen",
      color: ["#E0F2FE", "#BFDBFE"],
    },
    {
      title: "Lịch sử",
      icon: "time-outline",
      screen: "HistoryScreen",
      color: ["#FEF3C7", "#FDE68A"],
    },
    {
      title: "Bệnh án",
      icon: "document-text-outline",
      screen: "MedicalRecordScreen",
      color: ["#DCFCE7", "#BBF7D0"],
    }, // MỚI
    {
      title: "Hồ sơ",
      icon: "person-outline",
      screen: "ProfileScreen",
      color: ["#E0E7FF", "#C7D2FE"],
    },
    {
      title: "Theo dõi",
      icon: "pulse-outline",
      screen: null,
      color: ["#FCE7F3", "#FBCFE8"],
    },
    {
      title: "Cộng đồng",
      icon: "people-outline",
      screen: null,
      color: ["#F3E8FF", "#E9D5FF"],
    },
  ];

  const scales = useRef(menuItems.map(() => new Animated.Value(0.7))).current;

  useEffect(() => {
    const animations = scales.map((scale, i) =>
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 120,
        delay: i * 80,
        useNativeDriver: true,
      })
    );
    Animated.stagger(80, animations).start();
  }, []);

  const handlePress = (index, screen) => {
    Animated.sequence([
      Animated.timing(scales[index], {
        toValue: 0.94,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scales[index], {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (screen) navigation.navigate(screen);
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* HEADER */}
      <LinearGradient colors={["#1D4ED8", "#38BDF8"]} style={styles.header}>
        <Text style={styles.greeting}>Chào mừng trở lại,</Text>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.subtitle}>
          Hôm nay bạn cảm thấy thế nào? Hãy bắt đầu chăm sóc sức khỏe ngay!
        </Text>
      </LinearGradient>

      {/* INFO BOX – LỊCH KHÁM SẮP TỚI */}
      <TouchableWithoutFeedback
        onPress={() => navigation.navigate("HistoryScreen")}
      >
        <View style={styles.infoBox}>
          <Ionicons name="medkit-outline" size={26} color="#059669" />
          <Text style={styles.infoText}>
            Bạn có lịch khám sắp tới • Xem ngay
          </Text>
          <Ionicons name="arrow-forward-circle" size={28} color="#3B82F6" />
        </View>
      </TouchableWithoutFeedback>

      {/* GRID MENU – 6 Ô ĐẸP */}
      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableWithoutFeedback
            key={item.title}
            onPress={() => handlePress(index, item.screen)}
            disabled={!item.screen}
          >
            <Animated.View
              style={[
                styles.card,
                { transform: [{ scale: scales[index] }] },
                !item.screen && styles.disabled,
              ]}
            >
              <LinearGradient
                colors={item.color || ["#E0E7FF", "#C7D2FE"]}
                style={styles.iconWrapper}
              >
                <Ionicons name={item.icon} size={32} color="#1E3A8A" />
              </LinearGradient>
              <Text style={styles.title}>{item.title}</Text>
            </Animated.View>
          </TouchableWithoutFeedback>
        ))}
      </View>

      {/* TIN TỨC SỨC KHỎE */}
      <View style={styles.newsSection}>
        <Text style={styles.newsTitle}>Tin tức sức khỏe hôm nay</Text>
        <View style={styles.newsCard}>
          <View style={styles.newsIcon}>
            <Ionicons name="heart" size={28} color="#DC2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.newsHeadline}>
              10 mẹo giữ sức khỏe mùa đông từ chuyên gia
            </Text>
            <Text style={styles.newsDate}>17/11/2025 • 5 phút đọc</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
        </View>
      </View>
    </ScrollView>
  );
}

// === STYLES (GIỮ NGUYÊN) ===
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { paddingBottom: 100 },
  header: {
    paddingTop: Platform.OS === "ios" ? 70 : 50,
    paddingHorizontal: 28,
    paddingBottom: 48,
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  greeting: { fontSize: 18, color: "#DBEAFE", fontWeight: "600" },
  name: {
    fontSize: 38,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 6,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 16, color: "#E0F2FE", marginTop: 10, lineHeight: 22 },

  infoBox: {
    marginHorizontal: 24,
    marginTop: -28,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#1D4ED8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: "#DBEAFE",
  },
  infoText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
    marginLeft: 14,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    justifyContent: "space-between",
    marginTop: 36,
  },
  card: {
    width: "47%",
    aspectRatio: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  // marginRight: { marginRight: 8 },
  // marginLeft: { marginLeft: 8 },
  disabled: { opacity: 0.4, backgroundColor: "#F1F5F9" },
  iconWrapper: { borderRadius: 40, padding: 12, marginBottom: 6 },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    paddingHorizontal: 4,
  },
  secondaryContent: { paddingHorizontal: 24, marginTop: 0 },
  secondaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 15,
  },
  newsCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  newsIcon: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 20,
    marginRight: 16,
  },
  newsHeadline: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  newsDate: { fontSize: 13, color: "#94A3B8", marginTop: 4 },
});
