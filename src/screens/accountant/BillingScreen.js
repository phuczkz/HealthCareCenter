import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const COLORS = {
  primary: "#0066FF",
  success: "#00C853",
  warning: "#FB8C00",
  danger: "#E53935",
  bg: "#F8FAFF",
  card: "#FFFFFF",
  text: "#1E293B",
  textLight: "#64748B",
};

export default function BillingScreen() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  const loadInvoices = async () => {
    setLoading(true);

    let query = supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (selectedDate) {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);

      query = query
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());
    }

    const { data, error } = await query;

    if (!error) setInvoices(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadInvoices();
  }, [status, selectedDate]);

  const totalPaid = useMemo(() => {
    return invoices.reduce((sum, i) => {
      if (i.status !== "paid") return sum;
      return sum + Number(i.actual_amount || i.total_amount || 0);
    }, 0);
  }, [invoices]);

  const totalPending = useMemo(() => {
    return invoices.reduce((sum, i) => {
      if (i.status !== "pending") return sum;
      return sum + Number(i.total_amount || 0);
    }, 0);
  }, [invoices]);

  const renderTotal = () => {
    if (status === "paid") return formatMoney(totalPaid);
    if (status === "pending") return formatMoney(totalPending);
    return formatMoney(totalPaid);
  };

  const formatMoney = (n) => Number(n || 0).toLocaleString("vi-VN") + "đ";

  const formatDate = (d) => new Date(d).toLocaleDateString("vi-VN");

  const renderItem = ({ item }) => {
    const color =
      item.status === "paid"
        ? COLORS.success
        : item.status === "pending"
        ? COLORS.warning
        : COLORS.textLight;

    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.invoiceNumber}>{item.invoice_number}</Text>
          <Text style={[styles.status, { color }]}>
            {item.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
          </Text>
        </View>

        <Text style={styles.date}>Ngày tạo: {formatDate(item.created_at)}</Text>

        <View style={styles.rowBetween}>
          <Text style={styles.amountLabel}>Tổng tiền</Text>
          <Text style={styles.amount}>{formatMoney(item.total_amount)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0066FF", "#00D4FF"]} style={styles.header}>
        <Text style={styles.headerTitle}>Hóa đơn</Text>
        <Text style={styles.headerAmount}>{renderTotal()}</Text>
      </LinearGradient>

      <View style={styles.filterRow}>
        {["all", "paid", "pending"].map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatus(s)}
            style={[styles.filterBtn, status === s && styles.filterActive]}
          >
            <Text
              style={[
                styles.filterText,
                status === s && styles.filterTextActive,
              ]}
            >
              {s === "all"
                ? "Tất cả"
                : s === "paid"
                ? "Đã thanh toán"
                : "Chưa thanh toán"}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          style={styles.calendarBtn}
        >
          <Ionicons name="calendar" size={22} color="#0066FF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Không có hóa đơn</Text>
          }
        />
      )}

      <DateTimePickerModal
        isVisible={showPicker}
        mode="date"
        onConfirm={(date) => {
          setSelectedDate(date);
          setShowPicker(false);
        }}
        onCancel={() => setShowPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 26,
    fontWeight: "900",
  },
  headerAmount: {
    color: "#FFF",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 8,
  },

  filterRow: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
    gap: 8,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
  },
  filterActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textLight,
    fontWeight: "700",
  },
  filterTextActive: {
    color: "#FFF",
  },
  calendarBtn: {
    marginLeft: "auto",
    padding: 8,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 6,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  invoiceNumber: {
    fontWeight: "900",
    fontSize: 16,
    color: COLORS.text,
  },
  status: {
    fontWeight: "800",
  },
  date: {
    marginTop: 6,
    color: COLORS.textLight,
  },
  amountLabel: {
    marginTop: 12,
    color: COLORS.textLight,
  },
  amount: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
  },
  empty: {
    textAlign: "center",
    marginTop: 60,
    color: COLORS.textLight,
  },
});
