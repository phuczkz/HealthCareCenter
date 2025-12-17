import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Image,
  Platform,
  TouchableOpacity,
} from "react-native";
import { supabase } from "../../api/supabase";
import theme from "../../theme/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { COLORS, SPACING, SHADOWS, GRADIENTS } = theme;

export default function TopDoctorsScreen() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("top");
  const [topDoctors, setTopDoctors] = useState([]);
  const [ratingDoctors, setRatingDoctors] = useState([]);

  const loadTopDoctors = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        doctor_id,
        doctor:doctors!inner (
          id,
          name,
          avatar_url,
          department_name
        )
      `
      )
      .in("status", ["confirmed", "completed", "paid", "waiting_results"]);

    if (error) {
      console.error("❌ loadTopDoctors:", error);
      return [];
    }

    const stats = {};

    data.forEach((appt) => {
      const doc = appt.doctor;
      if (!doc) return;

      if (!stats[doc.id]) {
        stats[doc.id] = {
          id: doc.id,
          name: doc.name,
          avatar_url: doc.avatar_url,
          department_name: doc.department_name,
          bookings: 0,
        };
      }
      stats[doc.id].bookings += 1;
    });

    return Object.values(stats)
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 20);
  };

  const loadRatingDoctors = async () => {
    const { data, error } = await supabase
      .from("doctor_average_ratings")
      .select(
        `
        doctor_id,
        rating_count,
        average_rating,
        doctor:doctors!inner (
          id,
          name,
          avatar_url,
          department_name
        )
      `
      )
      .order("average_rating", { ascending: false })
      .limit(20);

    if (error) {
      console.error("❌ loadRatingDoctors:", error);
      return [];
    }

    return data.map((row) => ({
      id: row.doctor.id,
      name: row.doctor.name,
      avatar_url: row.doctor.avatar_url,
      department_name: row.doctor.department_name,
      count: row.rating_count,
      avg: row.average_rating,
    }));
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [top, rating] = await Promise.all([
        loadTopDoctors(),
        loadRatingDoctors(),
      ]);
      setTopDoctors(top);
      setRatingDoctors(rating);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const RankBadge = ({ rank }) => {
    const colors = ["#FACC15", "#CBD5E1", "#FB923C"];
    const bg = rank <= 3 ? colors[rank - 1] : COLORS.primary;

    return (
      <View style={[styles.rankBadge, { backgroundColor: bg }]}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>
    );
  };

  const DoctorCard = ({ item, index }) => {
    const isTop = activeTab === "top";

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.row}>
            <RankBadge rank={index + 1} />

            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={18} color="#64748B" />
              </View>
            )}

            <View>
              <Text style={styles.name}>{item.name}</Text>
              {!!item.department_name && (
                <Text style={styles.subDepartment}>{item.department_name}</Text>
              )}
              <Text style={styles.sub}>
                {isTop
                  ? `${item.bookings} lượt đặt lịch`
                  : `${item.count} lượt đánh giá`}
              </Text>
            </View>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {isTop ? item.bookings : `⭐ ${item.avg}`}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const data = activeTab === "top" ? topDoctors : ratingDoctors;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <LinearGradient colors={["#2563EB", "#1E40AF"]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerIcon}
          >
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Bác sĩ nổi bật</Text>

          <View style={styles.headerIcon} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải thống kê...</Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="medal-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>
            {activeTab === "top"
              ? "Chưa có lượt đặt lịch"
              : "Chưa có đánh giá nào"}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: SPACING.md }}>
          {data.map((item, index) => (
            <DoctorCard key={item.id} item={item} index={index} />
          ))}
        </ScrollView>
      )}

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "top" && styles.tabActive]}
          onPress={() => setActiveTab("top")}
        >
          <Ionicons
            name="trending-up-outline"
            size={20}
            color={activeTab === "top" ? "#FFF" : "#64748B"}
          />
          <Text
            style={[styles.tabText, activeTab === "top" && { color: "#FFF" }]}
          >
            Lượt đặt
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "rating" && styles.tabActive]}
          onPress={() => setActiveTab("rating")}
        >
          <Ionicons
            name="star"
            size={20}
            color={activeTab === "rating" ? "#FFF" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "rating" && { color: "#FFF" },
            ]}
          >
            Đánh giá
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 100,
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    justifyContent: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerIcon: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
  },

  card: {
    backgroundColor: "#FFF",
    padding: SPACING.md,
    borderRadius: 16,
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  rankText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
  },
  subDepartment: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  sub: {
    fontSize: 12,
    color: "#64748B",
  },

  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    minWidth: 56,
    alignItems: "center",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
  },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 8,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 14,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
});
