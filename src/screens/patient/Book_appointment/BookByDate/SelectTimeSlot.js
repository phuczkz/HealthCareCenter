import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";

import { useBookingFlow } from "../../../../controllers/patient/bookingController";
import {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  SHADOWS,
} from "../../../../theme/theme";
import { supabase } from "../../../../api/supabase";

const { width } = Dimensions.get("window");
const SLOT_WIDTH = (width - SPACING.xl * 2 - SPACING.md) / 2;

export default function SelectTimeSlot() {
  const navigation = useNavigation();
  const route = useRoute();
  const { date, specialization, price = 180000 } = route.params || {};

  const { doctorsWithSlots, loadingSlots, loadSlots } = useBookingFlow();
  const [doctorsWithRating, setDoctorsWithRating] = useState([]);

  useFocusEffect(
    useCallback(() => {
      if (date && specialization) {
        loadSlots(date, specialization);
      }
    }, [date, specialization, loadSlots])
  );

  useEffect(() => {
    const fetchRatings = async () => {
      if (!doctorsWithSlots?.length) {
        setDoctorsWithRating([]);
        return;
      }

      const enriched = await Promise.all(
        doctorsWithSlots.map(async (item) => {
          const { data } = await supabase
            .from("doctor_ratings")
            .select("rating")
            .eq("doctor_id", item.doctor.id);

          let avg = 0;
          let total = 0;

          if (data?.length) {
            total = data.length;
            avg =
              Math.round(
                (data.reduce((a, b) => a + b.rating, 0) / total) * 10
              ) / 10;
          }

          return { ...item, averageRating: avg, totalRatings: total };
        })
      );

      setDoctorsWithRating(enriched);
    };

    fetchRatings();
  }, [doctorsWithSlots]);

  const headerDate = useMemo(
    () =>
      new Date(date).toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [date]
  );

  const handleSlotPress = (slot, doctor) => {
    navigation.navigate("ConfirmBooking", {
      date,
      specialization,
      price,
      doctor,
      slot,
    });
  };

  const renderSlot = useCallback((slot, doctor) => {
    if (slot.available <= 0) return null;

    const critical = slot.available === 1;
    const low = slot.available <= 2;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleSlotPress(slot, doctor)}
        style={[
          styles.slot,
          low && styles.slotLow,
          critical && styles.slotCritical,
        ]}
      >
        <Ionicons name="time-outline" size={18} color="#065F46" />
        <Text style={styles.slotTime}>{slot.display}</Text>
        <Text style={[styles.slotAvailable, critical && styles.criticalText]}>
          Còn {slot.available} chỗ
        </Text>
      </TouchableOpacity>
    );
  }, []);

  const renderDoctor = useCallback(
    ({ item }) => {
      const { doctor, slots, averageRating, totalRatings } = item;

      return (
        <View style={styles.doctorCard}>
          <View style={styles.doctorHeader}>
            {/* AVATAR + RING (ĐỀU NHAU – ĐỒNG TÂM) */}
            <LinearGradient
              colors={["#22C55E", "#16A34A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRing}
            >
              {doctor.avatar_url ? (
                <Image
                  source={{ uri: doctor.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>
                    {doctor.name?.charAt(0).toUpperCase() || "B"}
                  </Text>
                </View>
              )}
            </LinearGradient>

            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>BS. {doctor.name}</Text>
              <Text style={styles.specialization}>
                {doctor.specializationText}
              </Text>

              {(doctor.experience_years || doctor.room_number) && (
                <Text style={styles.experience}>
                  {doctor.experience_years &&
                    `${doctor.experience_years} năm kinh nghiệm`}
                  {doctor.experience_years && doctor.room_number && " • "}
                  {doctor.room_number && `Phòng ${doctor.room_number}`}
                </Text>
              )}

              {averageRating > 0 ? (
                <View style={styles.ratingBadge}>
                  <Ionicons name="shield-checkmark" size={16} color="#047857" />
                  <Text style={styles.ratingNumber}>{averageRating}</Text>
                  <Text style={styles.ratingLabel}>Được đánh giá cao</Text>
                  <Text style={styles.ratingCountText}>({totalRatings})</Text>
                </View>
              ) : (
                <Text style={styles.noRatingText}>Chưa có đánh giá</Text>
              )}
            </View>
          </View>

          <Text style={styles.slotLabel}>Chọn khung giờ</Text>

          <View style={styles.slotsGrid}>
            {slots.map((slot) => (
              <View key={slot.id} style={styles.slotWrapper}>
                {renderSlot(slot, doctor)}
              </View>
            ))}
          </View>
        </View>
      );
    },
    [renderSlot]
  );

  const onRefresh = useCallback(
    () => loadSlots(date, specialization),
    [date, specialization, loadSlots]
  );

  if (loadingSlots) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tìm bác sĩ phù hợp...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Chọn khung giờ</Text>
          <Text style={styles.headerSubtitle}>{specialization}</Text>
        </View>

        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.infoCard}>
        <View>
          <Text style={styles.infoLabel}>Ngày khám</Text>
          <Text style={styles.infoValue}>{headerDate}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Phí khám</Text>
          <Text style={styles.priceValue}>
            {price.toLocaleString("vi-VN")}đ
          </Text>
        </View>
      </View>

      <FlatList
        data={doctorsWithRating}
        renderItem={renderDoctor}
        keyExtractor={(item) => item.doctor.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loadingSlots} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

/* ======================= STYLES ======================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
  },
  headerCenter: { alignItems: "center" },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFF",
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: "#E0F2FE",
    fontWeight: "600",
    marginTop: 2,
  },

  infoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    margin: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.card,
  },

  infoLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  infoValue: {
    fontSize: FONT_SIZE.base,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 4,
  },

  priceContainer: { alignItems: "flex-end" },
  priceLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  priceValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
    color: COLORS.primary,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: SPACING.lg,
    color: COLORS.textSecondary,
  },

  doctorCard: {
    marginHorizontal: SPACING.xl,
    marginVertical: SPACING.lg,
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...SHADOWS.card,
  },

  doctorHeader: { flexDirection: "row", marginBottom: SPACING.lg },

  /* AVATAR – KHUNG & ẢNH ĐỀU NHAU */
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2,
    marginRight: SPACING.lg,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFF",
  },

  doctorInfo: { flex: 1 },
  doctorName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  specialization: {
    marginTop: 4,
    fontWeight: "700",
    color: COLORS.primary,
  },
  experience: {
    marginTop: 6,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },

  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ratingNumber: {
    fontWeight: "800",
    color: "#065F46",
  },
  ratingLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: "#047857",
  },
  ratingCountText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  noRatingText: {
    marginTop: 10,
    fontSize: FONT_SIZE.sm,
    fontStyle: "italic",
    color: COLORS.textSecondary,
  },

  slotLabel: {
    marginBottom: SPACING.md,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },
  slotWrapper: { width: SLOT_WIDTH },

  slot: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: "#ECFDF5",
    borderWidth: 2,
    borderColor: "#86EFAC",
    gap: 4,
  },
  slotLow: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FED7AA",
  },
  slotCritical: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  slotTime: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: "#065F46",
  },
  slotAvailable: {
    fontSize: 12,
    fontWeight: "700",
    color: "#065F46",
  },
  criticalText: { color: "#B91C1C" },

  list: { paddingBottom: 120 },
});
