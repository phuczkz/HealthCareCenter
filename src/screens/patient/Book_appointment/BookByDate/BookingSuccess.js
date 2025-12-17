import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
  Dimensions,
} from "react-native";
import { StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import { useNavigation, useRoute } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function BookingSuccess() {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    appointment_id = "000000",
    doctor_name = "Bác sĩ",
    specialization = "Chưa xác định",
    time = "08:00 - 09:00",
    date = "Chưa xác định",
    room = "Chưa xác định",
    price = "180.000đ",
  } = route.params || {};

  const qrLink = `https://yourclinic.com/ticket/${appointment_id}`;

  // TỰ ĐỘNG CHUYỂN VỀ HistoryScreen SAU 3 GIÂY
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("HistoryScreen"); // hoặc "PatientHistory" tùy tên bạn đặt
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  const handleShare = async () => {
    try {
      const message =
        `PHIẾU ĐẶT LỊCH KHÁM BỆNH\n\n` +
        `Mã phiếu: #${String(appointment_id).padStart(6, "0")}\n` +
        `Bác sĩ: ${doctor_name}\n` +
        `Chuyên khoa: ${specialization}\n` +
        `Thời gian: ${time}\n` +
        `Ngày khám: ${date}\n` +
        `Phòng khám: ${room}\n` +
        `Phí khám: ${price}\n\n` +
        `Xem chi tiết: ${qrLink}`;

      await Share.share({ message, url: qrLink, title: "Phiếu đặt lịch khám" });
    } catch (err) {
      Alert.alert("Lỗi", "Không thể chia sẻ phiếu khám");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER THÀNH CÔNG */}
      <LinearGradient colors={["#10B981", "#059669"]} style={styles.header}>
        <Ionicons name="checkmark-circle" size={80} color="#FFF" />
        <Text style={styles.title}>Đặt lịch thành công!</Text>
        <Text style={styles.subtitle}>Đang chuyển về lịch sử...</Text>
        <Text style={styles.countdown}>3 giây</Text>
      </LinearGradient>

      {/* PHIẾU ĐẸP */}
      <View style={styles.ticket}>
        <View style={styles.qrSection}>
          <View style={styles.qrWrapper}>
            <QRCode
              value={qrLink}
              size={180}
              color="#1F2937"
              backgroundColor="#FFF"
            />
          </View>
          <Text style={styles.qrText}>Quét mã tại quầy để xác nhận</Text>
        </View>

        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Mã phiếu khám</Text>
          <Text style={styles.codeNumber}>
            #{String(appointment_id).padStart(6, "0")}
          </Text>
        </View>

        <View style={styles.infoList}>
          <InfoItem icon="person" label="Bác sĩ" value={doctor_name} />
          <InfoItem
            icon="medkit"
            label="Chuyên khoa"
            value={specialization}
            bold
          />
          <InfoItem icon="time" label="Giờ khám" value={time} />
          <InfoItem icon="calendar" label="Ngày khám" value={date} />
          <InfoItem icon="location" label="Phòng khám" value={room} />
          <InfoItem
            icon="cash"
            label="Phí khám"
            value={price}
            color="#DC2626"
            bold
          />
        </View>
      </View>

      {/* CHỈ GIỮ 2 NÚT: CHIA SẺ + VỀ TRANG CHỦ */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-social" size={24} color="#FFF" />
          <Text style={styles.shareText}>Chia sẻ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.replace("PatientHome")}
        >
          <Ionicons name="home" size={24} color="#FFF" />
          <Text style={styles.homeText}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Cảm ơn bạn đã sử dụng dịch vụ!</Text>
    </View>
  );
}

const InfoItem = ({ icon, label, value, color, bold }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={22} color="#4B5563" />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, bold && styles.bold, color && { color }]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0FDF4" },
  header: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 80 : 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  title: { fontSize: 32, fontWeight: "900", color: "#FFF", marginTop: 16 },
  subtitle: { fontSize: 17, color: "#D1FAE5", marginTop: 8, fontWeight: "600" },
  countdown: {
    fontSize: 15,
    color: "#FFF",
    marginTop: 12,
    fontStyle: "italic",
  },
  ticket: {
    marginHorizontal: 20,
    marginTop: -50,
    backgroundColor: "#FFF",
    borderRadius: 32,
    padding: 32,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  qrSection: { alignItems: "center", marginBottom: 32 },
  qrWrapper: {
    padding: 20,
    backgroundColor: "#FFF",
    borderRadius: 24,
    elevation: 10,
    borderWidth: 3,
    borderColor: "#E5E7EB",
  },
  qrText: { marginTop: 16, fontSize: 16, fontWeight: "700", color: "#059669" },
  codeBox: {
    backgroundColor: "#ECFDF5",
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 3,
    borderColor: "#10B981",
  },
  codeLabel: { fontSize: 16, color: "#059669", fontWeight: "700" },
  codeNumber: {
    fontSize: 40,
    fontWeight: "900",
    color: "#065F46",
    marginTop: 8,
    letterSpacing: 4,
  },
  infoList: { gap: 16 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLabel: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: "#4B5563",
    fontWeight: "600",
  },
  infoValue: { fontSize: 17, color: "#1F2937", fontWeight: "600" },
  bold: { fontWeight: "900", fontSize: 18, color: "#065F46" },
  actions: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 32,
    gap: 16,
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#6366F1",
    paddingVertical: 18,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },
  shareText: { color: "#FFF", fontSize: 17, fontWeight: "800", marginLeft: 10 },
  homeBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#10B981",
    paddingVertical: 18,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },
  homeText: { color: "#FFF", fontSize: 17, fontWeight: "800", marginLeft: 10 },
  footer: {
    textAlign: "center",
    marginTop: 40,
    marginBottom: 40,
    fontSize: 16,
    color: "#059669",
    fontWeight: "600",
    fontStyle: "italic",
  },
});
