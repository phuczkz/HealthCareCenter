import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp, FadeInDown, ZoomIn } from "react-native-reanimated";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../api/supabase";
import { getUserProfile } from "../../controllers/patient/userController";
import { useUserStore } from "../../store/useUserStore";
import { formatDate, formatGender, formatRole } from "../../utils/formatters";
import styles, { Colors } from "../../styles/patient/profileStyles";

// === TẠO CHỮ CÁI ĐẦU (FALLBACK) ===
const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const { clearUser } = useUserStore();
  const navigation = useNavigation();

  // === LẤY HỒ SƠ ===
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Không tìm thấy người dùng.");

      const profileData = await getUserProfile(user.id);
      setProfile(profileData);
    } catch (error) {
      console.error("Lỗi khi tải hồ sơ:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải hồ sơ.", [
        { text: "Thử lại", onPress: fetchProfile },
        { text: "OK", style: "cancel" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // === ĐĂNG XUẤT ===
  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: performLogout },
    ]);
  };

  const performLogout = async () => {
    try {
      setLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      clearUser();
      navigation.reset({
        index: 0,
        routes: [{ name: "Auth" }],
      });
    } catch (error) {
      Alert.alert("Lỗi", error.message || "Không thể đăng xuất.");
    } finally {
      setLoggingOut(false);
    }
  };

  // === TẢI LẠI KHI TRỞ VỀ TỪ EDIT PROFILE ===
  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [])
  );

  const goBackHome = () => navigation.navigate("HomeScreen");

  // === LOADING ===
  if (loading) {
    return (
      <View style={styles.loadingBg}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
      </View>
    );
  }

  // === KHÔNG CÓ HỒ SƠ ===
  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không tìm thấy hồ sơ.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={styles.retryGradient}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  // === RENDER CHÍNH ===
  return (
    <LinearGradient
      colors={[Colors.primary + "CC", Colors.secondary + "B3"]}
      style={styles.overlay}
    >
      {/* HEADER */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={goBackHome}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Hồ sơ cá nhân</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* AVATAR – ẢNH THẬT HOẶC CHỮ CÁI ĐẦU */}
        <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
          <Animated.View entering={ZoomIn.duration(600)} style={styles.avatarContainer}>
            <LinearGradient
              colors={[Colors.iconBgStart, Colors.iconBgEnd]}
              style={styles.avatarGradient}
            >
              {profile.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url + `?t=${Date.now()}` }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                  onError={(e) =>
                    console.log("Lỗi tải ảnh:", e.nativeEvent.error)
                  }
                />
              ) : (
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarText}>
                    {getInitials(profile.name)}
                  </Text>
                </View>
              )}
            </LinearGradient>
            <View style={styles.avatarRing} />
          </Animated.View>

          <Animated.Text
            entering={FadeInUp.delay(300).duration(600)}
            style={styles.name}
          >
            {profile.name}
          </Animated.Text>

          
        </Animated.View>

        {/* THÔNG TIN CÁ NHÂN */}
        <Animated.View entering={FadeInUp.delay(600).duration(800)} style={styles.card}>
          <View style={styles.cardInner}>
            <View style={styles.infoContainer}>
              <InfoItem icon="email" label="Email" value={profile.email} delay={100} />
              {profile.phone && (
                <InfoItem icon="phone" label="Số điện thoại" value={profile.phone} delay={200} />
              )}
              <InfoItem
                icon="human-male-female"
                label="Giới tính"
                value={formatGender(profile.gender)}
                delay={300}
              />
              <InfoItem
                icon="cake"
                label="Ngày sinh"
                value={formatDate(profile.date_of_birth)}
                delay={400}
              />
            </View>

            {/* NÚT CHỈNH SỬA */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate("EditProfile")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.editButtonGradient}
              >
                <MaterialCommunityIcons name="pencil-outline" size={22} color="#FFF" />
                <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* NÚT ĐĂNG XUẤT */}
        <Animated.View entering={FadeInUp.delay(800).duration(800)} style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutButtonMain}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            <LinearGradient
              colors={["#DC2626", "#EF4444"]}
              style={styles.logoutButtonGradient}
            >
              {loggingOut ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="logout" size={22} color="#FFF" />
                  <Text style={styles.logoutButtonText}>Đăng xuất</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

// === INFO ITEM COMPONENT ===
const InfoItem = ({ icon, label, value, delay }) => (
  <Animated.View entering={FadeInUp.delay(delay).duration(500)} style={styles.infoItem}>
    <View style={styles.iconContainer}>
      <MaterialCommunityIcons name={icon} size={26} color={Colors.primary} />
    </View>



    <View style={styles.infoText}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "—"}</Text>
    </View>
  </Animated.View>
);