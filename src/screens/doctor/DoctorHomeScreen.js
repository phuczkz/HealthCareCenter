import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../api/supabase";
import { getUserProfile } from "../../controllers/patient/userController";

export default function DoctorHomeScreen() {
  const navigation = useNavigation();
  const [displayName, setDisplayName] = useState("Bác sĩ");
  const [stats, setStats] = useState({
    todayAppointments: 0,
    monthPatients: 0,
    averageRating: "0.0",
    totalRatings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Lấy tên bác sĩ
        const profile = await getUserProfile(user.id);
        setDisplayName(
          profile?.full_name ||
            profile?.name ||
            user.email.split("@")[0] ||
            "Bác sĩ"
        );

        // 2. Lấy lịch khám hôm nay & tháng này
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        const { data: appointments } = await supabase
          .from("appointments")
          .select("status, appointment_date, created_at")
          .eq("doctor_id", user.id);

        const todayCount = (appointments || []).filter((a) => {
          if (!a.appointment_date) return false;
          const d = new Date(a.appointment_date);
          return (
            d.toDateString() === today.toDateString() &&
            ![
              "completed",
              "cancelled",
              "patient_cancelled",
              "doctor_cancelled",
            ].includes(a.status)
          );
        }).length;

        const monthCount = (appointments || []).filter((a) => {
          if (!a.created_at) return false;
          return new Date(a.created_at) >= monthStart;
        }).length;

        // 3. Lấy đánh giá trung bình và tổng lượt đánh giá
        const { data: ratingsData, error: ratingsError } = await supabase
          .from("doctor_ratings")
          .select("rating")
          .eq("doctor_id", user.id);

        let averageRating = "0.0";
        let totalRatings = 0;

        if (!ratingsError && ratingsData && ratingsData.length > 0) {
          totalRatings = ratingsData.length;
          const sum = ratingsData.reduce((acc, curr) => acc + curr.rating, 0);
          averageRating = (sum / totalRatings).toFixed(1); // Làm tròn 1 chữ số thập phân
        }

        setStats({
          todayAppointments: todayCount,
          monthPatients: monthCount,
          averageRating,
          totalRatings,
        });
      } catch (err) {
        console.error("Lỗi tải dữ liệu home bác sĩ:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const menu = [
    {
      title: "Lịch khám",
      icon: "calendar",
      screen: "DoctorAppointments",
      color: "#3B82F6",
    },
    {
      title: "Hồ sơ",
      icon: "person",
      screen: "DoctorProfile",
      color: "#8B5CF6",
    },
    {
      title: "Lịch làm việc",
      icon: "time",
      screen: "DoctorWorkSchedule",
      color: "#10B981",
    },
    {
      title: "Thống kê",
      icon: "bar-chart",
      screen: "PatientStatistics",
      color: "#F59E0B",
    },
  ];

  const scales = menu.map(() => new Animated.Value(1));
  const animatePress = (i) => {
    Animated.sequence([
      Animated.timing(scales[i], {
        toValue: 0.94,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scales[i], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F8FAFC",
        }}
      >
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 16, fontSize: 16, color: "#64748B" }}>
          Đang tải...
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
        {/* HEADER SIÊU NHỎ – SIÊU SANG */}
        <LinearGradient colors={["#1E3A8A", "#1D4ED8"]} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcome}>Xin chào,</Text>
              <Text style={styles.name}>{displayName}</Text>
            </View>
            <View style={styles.todayBadge}>
              <Ionicons name="sunny" size={16} color="#FEF08A" />
              <Text style={styles.todayText}>
                {stats.todayAppointments} bệnh nhân hôm nay
              </Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          style={{ flex: 1, marginTop: -40 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* CARD CHÀO MỪNG */}
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>
              Chúc bạn ngày làm việc thật hiệu quả
            </Text>
            <Ionicons
              name="sparkles"
              size={28}
              color="#FCD34D"
              style={{ marginTop: 8 }}
            />
          </View>

          {/* MENU 4 Ô */}
          <View style={styles.menuGrid}>
            {menu.map((item, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.85}
                onPress={() => {
                  animatePress(i);
                  setTimeout(() => navigation.navigate(item.screen), 180);
                }}
                style={styles.menuTouch}
              >
                <Animated.View
                  style={[
                    styles.menuBox,
                    { transform: [{ scale: scales[i] }] },
                  ]}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: item.color + "22" },
                    ]}
                  >
                    <View
                      style={[
                        styles.iconInner,
                        { backgroundColor: item.color },
                      ]}
                    >
                      <Ionicons name={item.icon} size={32} color="#FFF" />
                    </View>
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                </Animated.View>
              </TouchableOpacity>
            ))}
          </View>

          {/* 3 Ô THỐNG KÊ – ĐÃ CẬP NHẬT ĐÁNH GIÁ THỰC TẾ */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statBig}>{stats.todayAppointments}</Text>
              <Text style={styles.statSmall}>Lịch hôm nay</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBig}>{stats.monthPatients}</Text>
              <Text style={styles.statSmall}>Tháng này</Text>
            </View>
            <View style={styles.statBox}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text style={styles.statBig}>{stats.averageRating}</Text>
                <Ionicons name="star" size={28} color="#FCD34D" />
              </View>
              <Text style={styles.statSmall}>
                {stats.totalRatings > 0
                  ? `${stats.totalRatings} lượt đánh giá`
                  : "Chưa có đánh giá"}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

// STYLES ĐẸP NHẤT 2025
const styles = {
  header: {
    paddingTop: Platform.OS === "ios" ? 55 : 40,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  welcome: { fontSize: 17, color: "#BFDBFE", fontWeight: "500" },
  name: { fontSize: 32, fontWeight: "900", color: "#FFFFFF", marginLeft: 12 },
  todayBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  todayText: { fontSize: 14, color: "#FEFCE8", fontWeight: "600" },

  welcomeCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
  },

  menuGrid: {
    paddingHorizontal: 20,
    marginTop: 32,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  menuTouch: { width: "48%", marginBottom: 20 },
  menuBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingVertical: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 15,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  iconInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTitle: { fontSize: 17, fontWeight: "700", color: "#1E293B" },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 16,
  },
  statBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  statBig: { fontSize: 34, fontWeight: "900", color: "#1D4ED8" },
  statSmall: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 6,
    fontWeight: "600",
  },
};
