import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Image,
  Dimensions,
  TextInput,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import { useNavigation } from "@react-navigation/native";
import Animated, { FadeInDown } from "react-native-reanimated";

const { width } = Dimensions.get("window");

export default function PendingInvoicesScreen() {
  const navigation = useNavigation();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountTendered, setAmountTendered] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const generateVietQR = (invoice) => {
    try {
      setQrCodeUrl("");
      const amount = __DEV__ ? 2000 : invoice.total;
      const orderInfo = encodeURIComponent(
        __DEV__ ? `TEST HD${invoice.id}` : `HD ${invoice.invoice_number}`
      );
      const bankCode = "970436";
      const accountNo = "1026389973";
      const accountName = encodeURIComponent("Le Nguyen Thao Quynh");

      const qrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png?amount=${amount}&addInfo=${orderInfo}&accountName=${accountName}`;
      setQrCodeUrl(qrUrl);
    } catch (err) {
      console.error("Lỗi tạo QR:", err);
      Alert.alert("Lỗi", "Không tạo được mã QR");
    }
  };

  const fetchPendingInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(
          `
          id, invoice_number, total_amount, issued_at,
          appointments!appointment_id (patient_name, user_profiles:user_id (full_name))
        `
        )
        .eq("status", "pending")
        .order("issued_at", { ascending: false });

      if (error) throw error;

      const formatted = data.map((inv) => ({
        id: inv.id,
        invoice_number: inv.invoice_number || "HD" + inv.id,
        total: Number(inv.total_amount || 0),
        date: inv.issued_at
          ? new Date(inv.issued_at).toLocaleDateString("vi-VN")
          : "",
        time: inv.issued_at
          ? new Date(inv.issued_at).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        patientName:
          inv.appointments?.user_profiles?.full_name ||
          inv.appointments?.patient_name ||
          "Khách lẻ",
      }));

      setInvoices(formatted);
    } catch (err) {
      console.error("Lỗi tải hóa đơn:", err);
      Alert.alert("Lỗi", "Không tải được danh sách hóa đơn");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingInvoices();
  }, []);

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setAmountTendered("");
    setPaymentMethod("cash");
    setQrCodeUrl("");
    setModalVisible(true);
  };

  const handlePaymentMethodPress = (method) => {
    setPaymentMethod(method);
    if (method === "vietqr" && selectedInvoice) {
      generateVietQR(selectedInvoice);
    } else {
      setQrCodeUrl("");
    }
    if (method !== "cash") {
      setAmountTendered("");
    }
  };

  const confirmPayment = async () => {
    if (!selectedInvoice) return;

    const total = selectedInvoice.total;
    let tendered = 0;

    if (paymentMethod === "cash") {
      tendered = parseFloat(amountTendered.replace(/,/g, "")) || 0;
      if (tendered === 0) {
        Alert.alert("Chưa nhập", "Vui lòng nhập số tiền khách đưa");
        return;
      }
      if (tendered < total) {
        Alert.alert(
          "Thiếu tiền",
          `Còn thiếu ${(total - tendered).toLocaleString()}₫`
        );
        return;
      }
    } else {
      tendered = total;
    }

    const change = tendered - total;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("Đang thu tiền hóa đơn:", selectedInvoice.invoice_number);
    console.log("Phương thức:", paymentMethod);

    const { data, error } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        payment_method: paymentMethod,
        actual_amount: total,
        amount_tendered: tendered,
        change_given: change,
        paid_at: new Date().toISOString(),
        paid_by: user?.id || null,
      })
      .eq("id", selectedInvoice.id);

    if (error) {
      console.error("Supabase UPDATE ERROR:", error);
      Alert.alert(
        "Lỗi cập nhật",
        error.message || "Không thể cập nhật hóa đơn"
      );
    } else if (!data || data.length === 0) {
      Alert.alert(
        "Thông báo",
        "Hóa đơn có thể đã được thu trước đó. Đang tải lại..."
      );
      fetchPendingInvoices();
    } else {
      setModalVisible(false);
      Alert.alert(
        "Thành công!",
        paymentMethod === "cash"
          ? `Đã nhận tiền mặt\nTiền thừa: ${change.toLocaleString()}₫`
          : paymentMethod === "vietqr"
          ? "Đã xác nhận thanh toán VietQR thành công"
          : "Đã xác nhận thanh toán",
        [{ text: "OK", onPress: fetchPendingInvoices }]
      );
    }
  };

  const paymentMethods = [
    { key: "cash", icon: "attach-money", label: "Tiền mặt", color: "#10b981" },
    {
      key: "bank_transfer",
      icon: "account-balance",
      label: "CK",
      color: "#3b82f6",
    },
    { key: "card", icon: "credit-card", label: "Thẻ", color: "#06b6d4" },
    { key: "vietqr", icon: "qr-code-2", label: "VietQR", color: "#dc2626" },
    { key: "momo", icon: "phone-iphone", label: "MoMo", color: "#ba2d8c" },
  ];

  const tenderedNum = parseFloat(amountTendered.replace(/,/g, "")) || 0;
  const change =
    paymentMethod === "cash"
      ? Math.max(0, tenderedNum - (selectedInvoice?.total || 0))
      : 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />

      <LinearGradient
        colors={["#1e293b", "#334155"]}
        style={{ paddingTop: 50, paddingBottom: 12 }}
      >
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
            Thu Ngân
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ alignItems: "center", marginTop: 8 }}>
          <Text style={{ fontSize: 32, fontWeight: "900", color: "#60a5fa" }}>
            {invoices.length}
          </Text>
          <Text style={{ fontSize: 13, color: "#cbd5e1" }}>Hóa đơn chờ</Text>
        </View>
      </LinearGradient>

      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchPendingInvoices}
          />
        }
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={
          !loading && (
            <View style={{ alignItems: "center", marginTop: 80 }}>
              <Ionicons name="receipt-outline" size={60} color="#94a3b8" />
              <Text style={{ marginTop: 12, fontSize: 16, color: "#64748b" }}>
                Không có hóa đơn chờ
              </Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50)}>
            <Pressable
              onPress={() => openPaymentModal(item)}
              style={({ pressed }) => [
                {
                  backgroundColor: "white",
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 8,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                  elevation: 3,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 15, fontWeight: "700", color: "#1e293b" }}
                >
                  {item.patientName}
                </Text>
                <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  {item.invoice_number} • {item.date} {item.time}
                </Text>
              </View>
              <Text
                style={{ fontSize: 18, fontWeight: "900", color: "#dc2626" }}
              >
                {item.total.toLocaleString("vi-VN")}₫
              </Text>
            </Pressable>
          </Animated.View>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "800", color: "#1e293b" }}
              >
                Thu tiền
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {selectedInvoice && (
              <>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: "900",
                    textAlign: "center",
                    color: "#dc2626",
                    marginVertical: 8,
                  }}
                >
                  {selectedInvoice.total.toLocaleString("vi-VN")} ₫
                </Text>
                <Text
                  style={{
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: 14,
                    marginBottom: 12,
                  }}
                >
                  {selectedInvoice.patientName}
                </Text>

                {paymentMethod === "vietqr" && (
                  <View style={{ alignItems: "center", marginVertical: 12 }}>
                    {qrCodeUrl ? (
                      <View
                        style={{
                          backgroundColor: "#fff",
                          padding: 10,
                          borderRadius: 16,
                          shadowOpacity: 0.1,
                          elevation: 6,
                        }}
                      >
                        <Image
                          source={{ uri: qrCodeUrl }}
                          style={{ width: width - 140, height: width - 140 }}
                          resizeMode="contain"
                        />
                      </View>
                    ) : (
                      <ActivityIndicator size="large" color="#dc2626" />
                    )}
                    <Text
                      style={{
                        marginTop: 12,
                        fontSize: 15,
                        fontWeight: "700",
                        color: "#dc2626",
                      }}
                    >
                      Quét bằng app ngân hàng
                    </Text>
                  </View>
                )}

                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 10,
                    marginVertical: 12,
                  }}
                >
                  {paymentMethods.map((m) => (
                    <TouchableOpacity
                      key={m.key}
                      onPress={() => handlePaymentMethodPress(m.key)}
                      style={{
                        padding: 10,
                        borderRadius: 14,
                        backgroundColor:
                          paymentMethod === m.key ? m.color : "#f1f5f9",
                        width: 62,
                        alignItems: "center",
                      }}
                    >
                      <MaterialIcons
                        name={m.icon}
                        size={m.key === "vietqr" ? 26 : 22}
                        color={paymentMethod === m.key ? "white" : "#475569"}
                      />
                      <Text
                        style={{
                          fontSize: 10,
                          marginTop: 4,
                          fontWeight: "600",
                          color: paymentMethod === m.key ? "white" : "#475569",
                        }}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {paymentMethod === "cash" && (
                  <View style={{ marginVertical: 12 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#1e293b",
                        marginBottom: 6,
                      }}
                    >
                      Khách đưa (₫)
                    </Text>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: "#cbd5e1",
                        borderRadius: 12,
                        padding: 12,
                        fontSize: 18,
                        fontWeight: "700",
                        textAlign: "right",
                        backgroundColor: "#f8fafc",
                      }}
                      keyboardType="numeric"
                      returnKeyType="done"
                      blurOnSubmit={true}
                      value={amountTendered}
                      onChangeText={(text) => {
                        const numeric = text.replace(/[^0-9]/g, "");
                        const formatted = numeric.replace(
                          /\B(?=(\d{3})+(?!\d))/g,
                          ","
                        );
                        setAmountTendered(formatted);
                      }}
                      placeholder="0"
                      placeholderTextColor="#94a3b8"
                    />
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "900",
                        color: "#16a34a",
                        textAlign: "center",
                        marginTop: 12,
                      }}
                    >
                      Thừa: {change.toLocaleString()}₫
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={confirmPayment}
                  style={{
                    marginTop: 16,
                    backgroundColor:
                      paymentMethod === "vietqr" ? "#dc2626" : "#10b981",
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
                  >
                    {paymentMethod === "vietqr"
                      ? "XÁC NHẬN ĐÃ NHẬN TIỀN QR"
                      : "ĐÃ NHẬN TIỀN"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
