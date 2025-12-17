import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Platform,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LineChart } from "react-native-chart-kit";
import { supabase } from "../../api/supabase";
import { useNavigation } from "@react-navigation/native";
import theme from "../../theme/theme";

const { COLORS, SPACING } = theme;
const screenWidth = Dimensions.get("window").width;

/* ================= KPI ================= */
const KPI = ({ title, value, icon, color }) => (
  <View style={styles.kpiCard}>
    <View style={[styles.kpiIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.kpiTitle}>{title}</Text>
    <Text style={[styles.kpiValue, { color }]}>{value.toLocaleString()}đ</Text>
  </View>
);

/* ================= BILL ITEM ================= */
const BillItem = ({ item }) => (
  <View style={styles.billCard}>
    <View style={{ flex: 1 }}>
      <Text style={styles.billCode}>{item.invoice_number}</Text>
      <Text style={styles.billDate}>
        {new Date(item.issued_at).toLocaleString("vi-VN")}
      </Text>
    </View>

    <View style={{ alignItems: "flex-end" }}>
      <Text style={styles.billAmount}>
        {Number(item.total_amount).toLocaleString()}đ
      </Text>
      <Text
        style={[
          styles.billStatus,
          {
            color: item.status === "paid" ? COLORS.success : COLORS.warning,
          },
        ]}
      >
        {item.status === "paid" ? "Đã thu" : "Chưa thu"}
      </Text>
    </View>
  </View>
);

export default function RevenueStatsScreen() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState("day"); // day | month | year
  const [activeTab, setActiveTab] = useState("chart"); // chart | bill

  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [pickerType, setPickerType] = useState(null);

  const [chartData, setChartData] = useState({
    labels: [],
    total: [],
    paid: [],
  });

  const [summary, setSummary] = useState({
    total: 0,
    paid: 0,
    pending: 0,
  });

  const [bills, setBills] = useState([]);

  /* ================= LOAD DATA ================= */
  const loadRevenue = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("invoices")
        .select("*")
        .order("issued_at", { ascending: false });

      if (filterMode === "day") {
        query = query
          .gte("issued_at", fromDate.toISOString())
          .lte("issued_at", toDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      setBills(data || []);

      let grouped = {};
      let total = 0;
      let paid = 0;
      let pending = 0;

      data.forEach((inv) => {
        const date = new Date(inv.issued_at);
        let key = "";

        if (filterMode === "day") key = date.toLocaleDateString("vi-VN");
        else if (filterMode === "month")
          key = `${date.getMonth() + 1}/${date.getFullYear()}`;
        else key = `${date.getFullYear()}`;

        if (!grouped[key]) grouped[key] = { total: 0, paid: 0 };

        grouped[key].total += Number(inv.total_amount);
        total += Number(inv.total_amount);

        if (inv.status === "paid") {
          grouped[key].paid += Number(inv.total_amount);
          paid += Number(inv.total_amount);
        } else {
          pending += Number(inv.total_amount);
        }
      });

      const labels = Object.keys(grouped);
      setChartData({
        labels,
        total: labels.map((k) => grouped[k].total),
        paid: labels.map((k) => grouped[k].paid),
      });

      setSummary({ total, paid, pending });
    } catch (e) {
      console.log("Load revenue error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevenue();
  }, [filterMode, fromDate, toDate]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* HEADER */}
      <LinearGradient colors={["#2563EB", "#1E40AF"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={30} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thống kê doanh thu</Text>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 90 }}
          >
            {/* FILTER */}
            <View style={styles.filterRow}>
              {["day", "month", "year"].map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setFilterMode(m)}
                  style={[
                    styles.filterBtn,
                    filterMode === m && styles.filterActive,
                  ]}
                >
                  <Text
                    style={{
                      color: filterMode === m ? "#FFF" : "#475569",
                      fontWeight: "600",
                    }}
                  >
                    {m === "day" ? "Ngày" : m === "month" ? "Tháng" : "Năm"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* DATE */}
            {filterMode === "day" && (
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={styles.dateBox}
                  onPress={() => setPickerType("from")}
                >
                  <Ionicons name="calendar-outline" size={18} />
                  <Text style={styles.dateText}>
                    Từ: {fromDate.toLocaleDateString("vi-VN")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateBox}
                  onPress={() => setPickerType("to")}
                >
                  <Ionicons name="calendar-outline" size={18} />
                  <Text style={styles.dateText}>
                    Đến: {toDate.toLocaleDateString("vi-VN")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* KPI */}
            <View style={styles.kpiRow}>
              <KPI
                title="Tổng"
                value={summary.total}
                icon="cash-outline"
                color={COLORS.primary}
              />
              <KPI
                title="Đã thu"
                value={summary.paid}
                icon="checkmark-circle-outline"
                color={COLORS.success}
              />
              <KPI
                title="Chưa thu"
                value={summary.pending}
                icon="time-outline"
                color={COLORS.warning}
              />
            </View>

            {/* CONTENT */}
            {activeTab === "chart" ? (
              chartData.labels.length > 0 ? (
                <LineChart
                  data={{
                    labels: chartData.labels,
                    datasets: [
                      { data: chartData.total },
                      { data: chartData.paid },
                    ],
                    legend: ["Tổng", "Đã thu"],
                  }}
                  width={screenWidth - SPACING.lg * 2}
                  height={260}
                  chartConfig={{
                    backgroundGradientFrom: "#fff",
                    backgroundGradientTo: "#fff",
                    color: () => COLORS.primary,
                    labelColor: () => "#334155",
                    decimalPlaces: 0,
                  }}
                  style={{ borderRadius: 20 }}
                />
              ) : (
                <Text style={{ textAlign: "center", color: "#64748B" }}>
                  Không có dữ liệu
                </Text>
              )
            ) : (
              <FlatList
                data={bills}
                keyExtractor={(i) => i.id}
                renderItem={BillItem}
                scrollEnabled={false}
              />
            )}
          </ScrollView>

          {/* ===== BOTTOM TAB ===== */}
          <View style={styles.bottomTab}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "chart" && styles.tabActive]}
              onPress={() => setActiveTab("chart")}
            >
              <Ionicons
                name="analytics-outline"
                size={22}
                color={activeTab === "chart" ? "#FFF" : "#64748B"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "chart" && { color: "#FFF" },
                ]}
              >
                Biểu đồ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "bill" && styles.tabActive]}
              onPress={() => setActiveTab("bill")}
            >
              <Ionicons
                name="receipt-outline"
                size={22}
                color={activeTab === "bill" ? "#FFF" : "#64748B"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "bill" && { color: "#FFF" },
                ]}
              >
                Hóa đơn
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* DATE PICKER */}
      {pickerType && (
        <DateTimePicker
          value={pickerType === "from" ? fromDate : toDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(e, d) => {
            setPickerType(null);
            if (!d) return;
            pickerType === "from" ? setFromDate(d) : setToDate(d);
          }}
        />
      )}
    </View>
  );
}

/* ================= STYLES ================= */
const styles = {
  header: {
    height: 120,
    paddingTop: Platform.OS === "ios" ? 65 : 40,
    justifyContent: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backBtn: {
    position: "absolute",
    left: 20,
    top: Platform.OS === "ios" ? 60 : 40,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },

  filterRow: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderRadius: 14,
    marginBottom: 16,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 14,
  },
  filterActive: {
    backgroundColor: COLORS.primary,
  },

  dateRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  dateBox: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: { fontWeight: "600", color: "#334155" },

  kpiRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  kpiCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    elevation: 3,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  kpiTitle: { fontSize: 13, color: "#64748B" },
  kpiValue: { fontSize: 18, fontWeight: "800" },

  billCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
  },
  billCode: { fontWeight: "800", fontSize: 14 },
  billDate: { color: "#64748B", fontSize: 12, marginTop: 4 },
  billAmount: { fontWeight: "800", fontSize: 15 },
  billStatus: { fontSize: 12, marginTop: 4 },

  bottomTab: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#FFF",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 12,
    borderRadius: 14,
  },
  tabText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
};
