import { View, Text, TouchableOpacity, Alert } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { supabase } from "../api/supabase";

export default function DoctorAppointmentCard({
  item,
  isHighlighted,
  onPressMain,
  onCancel,
  GRADIENTS,
}) {
  const patientName =
    item.patient?.full_name || item.patient_name || "Bệnh nhân";
  const roomNumber = item.doctor_room_number || "Chưa có phòng";
  const specialization = item.service_name || "Khám tổng quát";
  const date = new Date(item.appointment_date);
  const timeStr = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const getStatusConfig = (status) => {
    switch (status) {
      case "pending":
        return { label: "CHỜ XÁC NHẬN", colors: ["#FF9F0A", "#FFB84D"] };
      case "confirmed":
        return {
          label: "SẴN SÀNG KHÁM",
          colors: GRADIENTS?.appointmentCard || ["#3B82F6", "#1D4ED8"],
        };
      case "waiting_results":
        return { label: "CHỜ KẾT QUẢ", colors: ["#FDB813", "#F59E0B"] };
      case "completed":
        return {
          label: "ĐÃ HOÀN TẤT",
          colors: GRADIENTS?.successButton || ["#10B981", "#059669"],
        };
      case "cancelled":
      case "patient_cancelled":
      case "doctor_cancelled":
        return { label: "ĐÃ HỦY", colors: ["#EF4444", "#DC2626"] };
      default:
        return { label: "KHÁC", colors: ["#94A3B8", "#64748B"] };
    }
  };
  const { label: statusLabel, colors } = getStatusConfig(item.status);
  const mainActions = {
    pending: {
      text: "XÁC NHẬN / HỦY",
      icon: "checkmark-circle",
      colors: ["#F59E0B", "#FDB813"],
    },
    confirmed: {
      text:
        new Date(item.appointment_date).toDateString() ===
        new Date().toDateString()
          ? "CHỈ ĐỊNH XN"
          : "CHỜ NGÀY KHÁM",
      icon:
        new Date(item.appointment_date).toDateString() ===
        new Date().toDateString()
          ? "flask"
          : "calendar",
      colors:
        new Date(item.appointment_date).toDateString() ===
        new Date().toDateString()
          ? ["#3B82F6", "#1D4ED8"]
          : ["#94A3B8", "#64748B"],
    },
    waiting_results: {
      text: "HOÀN TẤT BỆNH ÁN",
      icon: "document-text",
      colors: ["#10B981", "#059669"],
    },
    completed: {
      text: "XEM BỆNH ÁN",
      icon: "eye",
      colors: ["#6B7280", "#4B5563"],
    },
  };

  const action = mainActions[item.status];

  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <View
        style={[
          {
            padding: 18,
            marginVertical: 8,
            marginHorizontal: 16,
            backgroundColor: "#FFF",
            borderRadius: 20,
            elevation: 8,
          },
          isHighlighted && {
            backgroundColor: "#EBF8FF",
            borderLeftWidth: 5,
            borderLeftColor: "#0066FF",
          },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <Text style={{ fontSize: 21, fontWeight: "800", color: "#1E293B" }}>
            {patientName}
          </Text>
          <LinearGradient
            colors={colors}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "700" }}>
              {statusLabel}
            </Text>
          </LinearGradient>
        </View>
        <View style={{ gap: 14 }}>
          <InfoRow icon="calendar-outline" label="Ngày khám" value={dateStr} />
          <InfoRow icon="time-outline" label="Giờ khám" value={timeStr} bold />
          <InfoRow
            icon="medkit-outline"
            label="Chuyên khoa"
            value={specialization}
          />
          <InfoRow
            icon="business-outline"
            label="Phòng khám"
            value={roomNumber}
          />
        </View>
        {item.symptoms && (
          <View
            style={{
              marginTop: 16,
              padding: 14,
              backgroundColor: "#F8FAFC",
              borderRadius: 14,
              borderLeftWidth: 4,
              borderLeftColor: "#3B82F6",
            }}
          >
            <Text
              style={{ fontSize: 15.5, color: "#475569", fontStyle: "italic" }}
            >
              Triệu chứng: {item.symptoms}
            </Text>
          </View>
        )}
        {action && (
          <View style={{ marginTop: 18, flexDirection: "row", gap: 12 }}>
            <TouchableOpacity onPress={onPressMain} style={{ flex: 1 }}>
              <LinearGradient
                colors={action.colors}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Icon name={action.icon} size={24} color="#FFF" />
                <Text
                  style={{ color: "#FFF", fontSize: 16.5, fontWeight: "700" }}
                >
                  {action.text}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {(item.status === "pending" ||
              (item.status === "confirmed" &&
                new Date(item.appointment_date).toDateString() ===
                  new Date().toDateString())) &&
              onCancel && (
                <TouchableOpacity
                  onPress={onCancel}
                  style={{
                    padding: 16,
                    backgroundColor: "#FEF2F2",
                    borderRadius: 16,
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#DC2626",
                      fontWeight: "700",
                      textAlign: "center",
                    }}
                  >
                    Hủy lịch
                  </Text>
                </TouchableOpacity>
              )}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const InfoRow = ({ icon, label, value, bold }) => (
  <View style={{ flexDirection: "row", alignItems: "center" }}>
    <Icon name={icon} size={22} color="#0066FF" />
    <Text style={{ marginLeft: 14, fontSize: 16, color: "#475569" }}>
      {label}:{" "}
      <Text
        style={{
          fontWeight: bold ? "900" : "700",
          color: bold ? "#0066FF" : "#1E293B",
          fontSize: bold ? 18 : 16,
        }}
      >
        {value}
      </Text>
    </Text>
  </View>
);
