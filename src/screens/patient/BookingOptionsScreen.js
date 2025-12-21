import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import theme from "../../theme/theme";

const { COLORS, GRADIENTS, SPACING, BORDER_RADIUS } = theme;

export default function BookingOptionsScreen() {
  const navigation = useNavigation();

  const options = [
    {
      title: "Theo Bác sĩ",
      subtitle: "Chọn bác sĩ bạn muốn khám",
      icon: "person-outline",
      screen: "BookByDoctor",
      gradient: ["#7C3AED", "#A78BFA"],
      badge: "PHỔ BIẾN",
    },
    {
      title: "Theo Ngày",
      subtitle: "Chọn ngày và khung giờ phù hợp",
      icon: "calendar-outline",
      screen: "BookByDate",
      gradient: GRADIENTS.primaryButton,
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.titleWrapper}>
          <Text style={styles.headerTitle}>Đặt lịch khám</Text>
          <Text style={styles.headerSubtitle}>
            Chọn cách đặt lịch phù hợp với bạn
          </Text>
        </View>

        <View style={{ width: 48 }} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {options.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => navigation.navigate(item.screen)}
          >
            <LinearGradient
              colors={item.gradient}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.icon}>
                <Ionicons name={item.icon} size={28} color="#FFF" />
              </View>

              <View style={styles.text}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </View>

              <View style={styles.right}>
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={26} color="#FFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}

        <View style={styles.note}>
          <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
          <Text style={styles.noteText}>
            Thông tin của bạn được bảo mật 100% theo tiêu chuẩn HIPAA
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 45,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xxxl,
    borderBottomRightRadius: BORDER_RADIUS.xxxl,
  },

  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  titleWrapper: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
  },

  headerTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#FFF",
  },

  headerSubtitle: {
    fontSize: 14.5,
    color: "rgba(255,255,255,0.9)",
    marginTop: 6,
  },

  content: {
    padding: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: 100,
  },

  card: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    overflow: "hidden",
  },

  gradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.xl,
    minHeight: 100,
  },

  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.lg,
  },

  text: {
    flex: 1,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },

  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },

  right: {
    alignItems: "flex-end",
  },

  badge: {
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#7C3AED",
  },

  note: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    marginTop: SPACING.xl,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
  },

  noteText: {
    marginLeft: SPACING.lg,
    fontSize: 15,
    color: COLORS.primary,
    flex: 1,
    lineHeight: 22,
  },
});
