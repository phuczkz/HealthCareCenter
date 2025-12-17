import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../api/supabase";

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 40;

const RANGES = [
  { key: "today", label: "Hôm nay" },
  { key: "7day", label: "7 ngày" },
  { key: "30day", label: "30 ngày" },
  { key: "90day", label: "3 tháng" },
  { key: "1year", label: "1 năm" },
  { key: "all", label: "Toàn bộ" },
];

export default function PatientStatisticsScreen() {
  const navigation = useNavigation();
  const [doctorId, setDoctorId] = useState(null);
  const [range, setRange] = useState("30day");
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setDoctorId(user.id);
    })();
  }, []);

  const startDate = useMemo(() => {
    const r = RANGES.find((x) => x.key === range);
    const d = new Date();
    if (r.key === "all") d.setFullYear(2020);
    else {
      const days =
        r.key === "today"
          ? 0
          : r.key === "7day"
          ? 6
          : r.key === "30day"
          ? 29
          : r.key === "90day"
          ? 89
          : 364;
      d.setDate(d.getDate() - days);
    }
    d.setHours(0, 0, 0, 0);
    return d;
  }, [range]);

  useEffect(() => {
    if (!doctorId || !startDate) return;

    const fetch = async () => {
      setLoading(true);
      try {
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
          .from("appointments")
          .select("appointment_date")
          .eq("doctor_id", doctorId)
          .eq("status", "completed")
          .gte("appointment_date", startDate.toISOString())
          .lte("appointment_date", end.toISOString());

        if (error) throw error;

        const map = {};
        data?.forEach((a) => {
          const day = new Date(a.appointment_date).toLocaleDateString("vi-VN");
          map[day] = (map[day] || 0) + 1;
        });

        const labels = [];
        const values = [];
        let cur = new Date(startDate);
        while (cur <= end) {
          const k = cur.toLocaleDateString("vi-VN");
          labels.push(cur.getDate() + "/" + (cur.getMonth() + 1));
          values.push(map[k] || 0);
          cur.setDate(cur.getDate() + 1);
        }

        const totalPatients = values.reduce((a, b) => a + b, 0);

        const step = Math.max(1, Math.ceil(values.length / 8));
        const finalLabels = [];
        const finalValues = [];
        for (let i = 0; i < values.length; i += step) {
          finalLabels.push(labels[i]);
          finalValues.push(values[i]);
        }
        if (values.length > 1) {
          finalLabels.push(labels[labels.length - 1]);
          finalValues.push(values[values.length - 1]);
        }

        setTotal(totalPatients);
        setChartData({
          labels: finalLabels.length ? finalLabels : ["Hôm nay"],
          datasets: [{ data: finalValues.length ? finalValues : [0] }],
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [doctorId, startDate]);

  const currentRange = RANGES.find((r) => r.key === range) || RANGES[2];

  return (
    <View style={styles.container}>
      {/* HEADER NHỎ */}
      <LinearGradient colors={["#1E40AF", "#1D4ED8"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Thống kê</Text>
        <TouchableOpacity
          style={styles.rangeBtn}
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.rangeText}>{currentRange.label}</Text>
          <Ionicons name="chevron-down" size={16} color="#60A5FA" />
        </TouchableOpacity>
      </LinearGradient>

      {/* DÀN ĐỀU XUỐNG DƯỚI – CỰC THOÁNG */}
      <View style={styles.content}>
        {/* CARD TỔNG QUAN */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{total.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>bệnh nhân đã khám</Text>
          <Text style={styles.summaryPeriod}>{currentRange.label}</Text>
        </View>

        {/* BIỂU ĐỒ */}
        <View style={styles.chartCard}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color="#3B82F6"
              style={{ marginTop: 30 }}
            />
          ) : total === 0 ? (
            <Text style={styles.empty}>Chưa có dữ liệu</Text>
          ) : (
            <LineChart
              data={chartData}
              width={CHART_WIDTH}
              height={210}
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: "#fff",
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                decimalPlaces: 0,
                color: () => "#3B82F6",
                labelColor: () => "#64748b",
                propsForDots: { r: "4", strokeWidth: "2", stroke: "#3B82F6" },
              }}
              bezier
              fromZero
              style={{ borderRadius: 16 }}
            />
          )}
        </View>

        {/* KHOẢNG CÁCH ĐỀU ĐỂ DÀN XUỐNG DƯỚI */}
        <View style={{ flex: 1 }} />
      </View>

      {/* MODAL NHỎ Ở GIỮA */}
      <Modal visible={showPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.picker}>
            {RANGES.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.pickerItem,
                  range === item.key && styles.pickerActive,
                ]}
                onPress={() => {
                  setRange(item.key);
                  setShowPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerText,
                    range === item.key && styles.pickerTextActive,
                  ]}
                >
                  {item.label}
                </Text>
                {range === item.key && (
                  <Ionicons name="checkmark" size={20} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// STYLES DÀN ĐỀU – CỰC THOÁNG – CỰC ĐẸP
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 45,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  back: { padding: 6 },
  title: { fontSize: 22, fontWeight: "800", color: "#FFF" },
  rangeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  rangeText: { color: "#60A5FA", fontSize: 14, fontWeight: "600" },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "flex-start", // bắt đầu từ trên
    gap: 24, // khoảng cách đều nhau
    paddingTop: 30,
  },

  summaryCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingVertical: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  summaryNumber: { fontSize: 52, fontWeight: "900", color: "#1D4ED8" },
  summaryLabel: { fontSize: 16, color: "#64748B", marginTop: 6 },
  summaryPeriod: {
    fontSize: 15,
    color: "#3B82F6",
    marginTop: 4,
    fontWeight: "600",
  },

  chartCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  empty: { fontSize: 16, color: "#94A3B8", marginTop: 30 },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  picker: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 8,
    width: width * 0.7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  pickerActive: { backgroundColor: "#EFF6FF", borderRadius: 12 },
  pickerText: { fontSize: 16, color: "#1E293B" },
  pickerTextActive: { color: "#3B82F6", fontWeight: "700" },
});
