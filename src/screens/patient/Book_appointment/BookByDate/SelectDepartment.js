import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useCallback } from "react";

import { useBookingFlow } from "../../../../controllers/patient/bookingController";
import {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  SHADOWS,
} from "../../../../theme/theme";

export default function SelectDepartment() {
  const navigation = useNavigation();
  const route = useRoute();
  const { date } = route.params || {};

  const { specializations, loadingSpecs, loadSpecializations, selectedDate } =
    useBookingFlow();

  const [search, setSearch] = useState("");

  // Load chuyên khoa khi vào màn hình hoặc quay lại
  useFocusEffect(
    useCallback(() => {
      if (date && (specializations.length === 0 || date !== selectedDate)) {
        loadSpecializations(date);
      }
    }, [date, selectedDate, specializations.length, loadSpecializations])
  );

  // Format ngày hiển thị
  const headerDate = useMemo(() => {
    return new Date(date).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [date]);

  // Tìm kiếm realtime
  const filtered = useMemo(() => {
    if (!search.trim()) return specializations;
    const q = search.toLowerCase();
    return specializations.filter((item) =>
      item.name.toLowerCase().includes(q)
    );
  }, [specializations, search]);

  const renderItem = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.item}
        onPress={() =>
          navigation.navigate("SelectTimeSlot", {
            date,
            specialization: item.name,
            price: item.price, // GIÁ THẬT TỪ BẢNG SERVICES
          })
        }
        activeOpacity={0.8}
      >
        <View style={styles.left}>
          <View style={styles.icon}>
            <Ionicons name="medical-outline" size={28} color="#FFF" />
          </View>
          <View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.count}>{item.doctorCount} bác sĩ có lịch</Text>
          </View>
        </View>

        <View style={styles.right}>
          <Text style={styles.price}>
            {item.price.toLocaleString("vi-VN")}đ
          </Text>
          <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
        </View>
      </TouchableOpacity>
    ),
    [navigation, date]
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.title}>Chọn chuyên khoa</Text>
          <Text style={styles.date}>{headerDate}</Text>
        </View>

        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* SEARCH BAR */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={22} color="#64748B" />
          <TextInput
            placeholder="Tìm chuyên khoa..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholderTextColor="#94A3B8"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={22} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* DANH SÁCH */}
      {loadingSpecs ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            Đang tải danh sách chuyên khoa...
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="briefcase-outline" size={90} color="#CBD5E1" />
          <Text style={styles.emptyText}>
            {search
              ? "Không tìm thấy chuyên khoa"
              : "Không có lịch khám ngày này"}
          </Text>
          {search && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={styles.clearText}>Xóa bộ lọc tìm kiếm</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
  headerContent: {
    alignItems: "center",
    flex: 1,
    marginRight: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFF",
  },
  date: {
    fontSize: FONT_SIZE.sm,
    color: "#FFFFFFCC",
    marginTop: 6,
    fontWeight: "600",
  },
  searchWrapper: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: SPACING.xl,
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.card,
    gap: SPACING.md,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.card,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.lg,
  },
  name: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  count: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  right: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
    color: COLORS.primary,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: SPACING.xl,
    fontSize: FONT_SIZE.xl,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  clearText: {
    marginTop: SPACING.lg,
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: FONT_SIZE.base,
  },
  loadingText: {
    marginTop: SPACING.lg,
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
  },
  list: {
    paddingTop: SPACING.md,
    paddingBottom: 100,
  },
});
