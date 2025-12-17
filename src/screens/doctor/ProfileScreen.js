import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  Alert,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../api/supabase";

const fetchDoctorProfile = async (userId) => {
  const { data: doctorData, error: doctorError } = await supabase
    .from("doctors")
    .select(
      `
      id,
      name,
      avatar_url,
      specialization,
      experience_years,
      room_number,
      department_name,
      bio,
      services:service_id (
        name,
        price
      )
    `
    )
    .eq("id", userId)
    .single();

  if (doctorError) throw doctorError;

  const { data: ratingsData, error: ratingsError } = await supabase
    .from("doctor_ratings")
    .select("rating")
    .eq("doctor_id", userId);

  if (ratingsError && ratingsError.code !== "PGRST116") {
    console.error("Lỗi lấy rating:", ratingsError);
  }

  let averageRating = 0;
  let totalRatings = 0;

  if (ratingsData && ratingsData.length > 0) {
    totalRatings = ratingsData.length;
    const sum = ratingsData.reduce((acc, curr) => acc + curr.rating, 0);
    averageRating = Math.round((sum / totalRatings) * 10) / 10;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email || "Chưa cập nhật";
  const phone = user?.user_metadata?.phone || "Chưa cập nhật";

  return {
    ...doctorData,
    email,
    phone,
    averageRating,
    totalRatings,
  };
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const loadProfile = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Không tìm thấy người dùng");

      const data = await fetchDoctorProfile(user.id);
      setProfile(data);
    } catch (err) {
      Alert.alert("Lỗi", err.message || "Không thể tải hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={s.loadingText}>Đang tải hồ sơ...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={s.loadingContainer}>
        <Ionicons name="person-circle-outline" size={100} color="#94A3B8" />
        <Text style={s.errorText}>Không tìm thấy hồ sơ bác sĩ</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* HEADER SIÊU SANG */}
      <LinearGradient colors={["#1E3A8A", "#1D4ED8"]} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>

        <View style={s.avatarWrapper}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={s.avatar} />
          ) : (
            <View style={s.avatarPlaceholder}>
              <Ionicons name="person" size={70} color="#FFF" />
            </View>
          )}
          <View style={s.onlineBadge} />
        </View>

        <Text style={s.name}>BS. {profile.name}</Text>
        <Text style={s.specialty}>
          {profile.specialization || "Bác sĩ đa khoa"}
        </Text>
        {profile.department_name && (
          <View style={s.departmentTag}>
            <Text style={s.departmentText}>{profile.department_name}</Text>
          </View>
        )}

        {/* PHẦN ĐÁNH GIÁ SAO TRUNG BÌNH */}
        <View style={s.ratingContainer}>
          <View style={s.ratingStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={
                  star <= Math.floor(profile.averageRating)
                    ? "star"
                    : star - 0.5 <= profile.averageRating
                    ? "star-half-outline"
                    : "star-outline"
                }
                size={24}
                color="#FCD34D"
              />
            ))}
          </View>
          <Text style={s.ratingText}>
            {profile.averageRating > 0 ? profile.averageRating : "Chưa có"} sao
          </Text>
          {profile.totalRatings > 0 && (
            <Text style={s.ratingCount}>({profile.totalRatings} lượt)</Text>
          )}
        </View>
      </LinearGradient>

      {/* NỘI DUNG */}
      <View style={s.content}>
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="medkit" size={24} color="#3B82F6" />
            <Text style={s.cardTitle}>Chuyên môn</Text>
          </View>

          <View style={s.infoGrid}>
            <InfoItem
              icon="briefcase"
              label="Kinh nghiệm"
              value={`${profile.experience_years || 0} năm`}
            />
            <InfoItem
              icon="business"
              label="Phòng khám"
              value={profile.room_number || "Chưa có"}
            />
            <InfoItem
              icon="heart"
              label="Dịch vụ"
              value={profile.services?.name || "Khám tổng quát"}
            />
            <InfoItem
              icon="pricetag"
              label="Giá khám"
              value={
                profile.services?.price
                  ? `${Number(profile.services.price).toLocaleString()}₫`
                  : "Liên hệ"
              }
            />
          </View>

          {profile.bio && (
            <View style={s.bioSection}>
              <Text style={s.bioTitle}>Giới thiệu bản thân</Text>
              <Text style={s.bio}>{profile.bio}</Text>
            </View>
          )}
        </View>

        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="call" size={24} color="#10B981" />
            <Text style={s.cardTitle}>Liên hệ</Text>
          </View>
          <InfoItem icon="mail" label="Email" value={profile.email} />
          <InfoItem icon="call" label="Điện thoại" value={profile.phone} />
        </View>

        <TouchableOpacity
          style={s.editBtn}
          onPress={() => navigation.navigate("EditDoctorProfile")}
        >
          <LinearGradient
            colors={["#3B82F6", "#1D4ED8"]}
            style={s.editGradient}
          >
            <Ionicons name="create" size={26} color="#FFF" />
            <Text style={s.editText}>Chỉnh sửa hồ sơ</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.logoutBtn}
          onPress={() => {
            Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
              { text: "Hủy", style: "cancel" },
              {
                text: "Đăng xuất",
                style: "destructive",
                onPress: async () => {
                  await supabase.auth.signOut();
                  navigation.replace("Auth");
                },
              },
            ]);
          }}
        >
          <LinearGradient
            colors={["#DC2626", "#EF4444"]}
            style={s.editGradient}
          >
            <Ionicons name="log-out" size={26} color="#FFF" />
            <Text style={s.editText}>Đăng xuất</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </View>
    </ScrollView>
  );
}

// COMPONENT INFO ITEM
const InfoItem = ({ icon, label, value }) => (
  <View style={s.infoItem}>
    <View style={s.infoIcon}>
      <Ionicons name={icon} size={22} color="#3B82F6" />
    </View>
    <View>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  </View>
);

// STYLES ĐẸP NHẤT 2025 – ĐÃ THÊM PHẦN RATING
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: { marginTop: 20, fontSize: 18, color: "#64748B" },
  errorText: {
    marginTop: 20,
    fontSize: 20,
    color: "#1E293B",
    fontWeight: "600",
  },

  header: {
    paddingTop: Platform.OS === "ios" ? 70 : 50,
    paddingBottom: 40,
    alignItems: "center",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 20,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.25)",
    padding: 12,
    borderRadius: 50,
  },
  avatarWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFF",
    padding: 6,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  avatar: { width: "100%", height: "100%", borderRadius: 64 },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  onlineBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 32,
    height: 32,
    backgroundColor: "#10B981",
    borderRadius: 16,
    borderWidth: 4,
    borderColor: "#FFF",
  },

  name: { fontSize: 32, fontWeight: "900", color: "#FFF", marginTop: 20 },
  specialty: {
    fontSize: 19,
    color: "#DBEAFE",
    marginTop: 6,
    textAlign: "center",
    fontWeight: "600",
  },
  departmentTag: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  departmentText: { color: "#FFF", fontWeight: "700", fontSize: 15 },

  // PHẦN ĐÁNH GIÁ SAO
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
    gap: 10,
  },
  ratingStars: {
    flexDirection: "row",
    gap: 4,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  ratingCount: {
    fontSize: 16,
    color: "#DBEAFE",
    fontWeight: "500",
  },

  content: { marginTop: -40, paddingHorizontal: 20 },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 21, fontWeight: "800", color: "#1E293B" },

  infoGrid: { gap: 18 },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  infoLabel: { fontSize: 15, color: "#64748B" },
  infoValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 4,
  },

  bioSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
  },
  bioTitle: { fontSize: 16, color: "#64748B", marginBottom: 8 },
  bio: { fontSize: 16.5, color: "#1E293B", lineHeight: 26 },

  editBtn: { marginTop: 10 },
  editGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 20,
    gap: 12,
  },
  editText: { fontSize: 18, fontWeight: "bold", color: "#FFF" },

  logoutBtn: { marginTop: 12 },
});
