import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  setNote,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { supabase } from "../../api/supabase";

export default function OrderTestsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    appointmentId,
    patientId,
    patientName = "Bệnh nhân",
  } = route.params || {};

  const [initialNote, setInitialNote] = useState("");
  const [selectedTests, setSelectedTests] = useState([]);
  const [customTest, setCustomTest] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  const commonTests = [
    { name: "Công thức máu", price: 120000 },
    { name: "Đường huyết", price: 50000 },
    { name: "Chức năng gan", price: 250000 },
    { name: "Chức năng thận", price: 120000 },
    { name: "CRP", price: 150000 },
    { name: "Nước tiểu 10 thông số", price: 80000 },
    { name: "Siêu âm bụng", price: 300000 },
    { name: "X-Quang ngực", price: 150000 },
    { name: "Điện tâm đồ", price: 120000 },
    { name: "HBsAg", price: 120000 },
    { name: "Anti-HCV", price: 200000 },
    { name: "HIV Combo", price: 300000 },
    { name: "Siêu âm tuyến giáp", price: 250000 },
  ];

  const toggleTest = (test) => {
    setSelectedTests((prev) => {
      const exists = prev.find((t) => t.name === test.name);
      return exists
        ? prev.filter((t) => t.name !== test.name)
        : [...prev, test];
    });
  };

  const addCustomTest = () => {
    const name = customTest.trim();
    const priceStr = customPrice.replace(/[^0-9]/g, "");
    if (!name) return Alert.alert("Lỗi", "Vui lòng nhập tên xét nghiệm");
    if (!priceStr || parseInt(priceStr) <= 0)
      return Alert.alert("Lỗi", "Giá phải lớn hơn 0");

    const price = parseInt(priceStr) * 1000;
    if (selectedTests.some((t) => t.name === name))
      return Alert.alert("Lỗi", "Xét nghiệm đã tồn tại");

    setSelectedTests((prev) => [...prev, { name, price }]);
    setCustomTest("");
    setCustomPrice("");
  };

  const totalPrice = selectedTests.reduce((sum, t) => sum + t.price, 0);

  const sendTests = async () => {
    if (selectedTests.length === 0) {
      return Alert.alert("Chưa chọn", "Vui lòng chọn ít nhất 1 xét nghiệm");
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Tạo bệnh án tạm
      await supabase.from("medical_records").insert({
        patient_id: patientId,
        doctor_id: user.id,
        appointment_id: appointmentId,
        diagnosis: "Đang chờ kết quả xét nghiệm cận lâm sàng",
        notes: initialNote.trim() || null,
      });

      await supabase.from("test_results").insert(
        selectedTests.map((t) => ({
          patient_id: patientId,
          appointment_id: appointmentId,
          test_type: "lab",
          test_name: t.name,
          price: t.price,
          total_price: totalPrice,
          status: "pending",
          ordered_at: new Date().toISOString(),
        }))
      );

      await supabase
        .from("appointments")
        .update({ status: "waiting_results" })
        .eq("id", appointmentId);

      Alert.alert(
        "Thành công!",
        `${
          selectedTests.length
        } xét nghiệm đã được gửi\nTổng: ${totalPrice.toLocaleString(
          "vi-VN"
        )} ₫`,
        [
          {
            text: "OK",
            onPress: () => navigation.replace("DoctorAppointments"),
          },
        ]
      );
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", err.message || "Không thể gửi chỉ định");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      <LinearGradient
        colors={["#3B82F6", "#1D4ED8"]}
        style={{ paddingTop: 48, paddingBottom: 18 }}
      >
        <View
          style={{
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              padding: 8,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 12,
            }}
          >
            <Icon name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={{ marginLeft: 14 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#FFF" }}>
              Chỉ định xét nghiệm
            </Text>
            <Text style={{ fontSize: 14, color: "#E0E7FF", marginTop: 2 }}>
              {patientName}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={styles.card}>
              <Text style={styles.label}>Triệu chứng</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Nhập triệu chứng..."
                placeholderTextColor="#94A3B8"
                value={initialNote}
                onChangeText={setNote}
                multiline
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(100)}>
            <View style={styles.card}>
              <Text style={styles.label}>Chọn xét nghiệm</Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  marginTop: 10,
                }}
              >
                {commonTests.map((test, i) => {
                  const selected = selectedTests.some(
                    (t) => t.name === test.name
                  );
                  return (
                    <Animated.View
                      key={i}
                      entering={FadeInDown.delay(i * 40)}
                      style={{ width: "48%", marginBottom: 12 }}
                    >
                      <TouchableOpacity
                        onPress={() => toggleTest(test)}
                        style={[
                          styles.testCard,
                          selected && styles.testCardSelected,
                        ]}
                      >
                        <Icon
                          name="flask"
                          size={22}
                          color={selected ? "#FFF" : "#1E293B"}
                        />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text
                            style={[
                              styles.testName,
                              selected && styles.testNameSelected,
                            ]}
                          >
                            {test.name}
                          </Text>
                          <Text
                            style={[
                              styles.testPrice,
                              selected && styles.testPriceSelected,
                            ]}
                          >
                            {test.price.toLocaleString()}đ
                          </Text>
                        </View>
                        {selected && (
                          <Icon
                            name="checkmark"
                            size={18}
                            color="#FFF"
                            style={{ position: "absolute", top: 8, right: 8 }}
                          />
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)}>
            <View style={styles.card}>
              <View
                style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}
              >
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder="Tên xét nghiệm"
                  placeholderTextColor="#94A3B8"
                  value={customTest}
                  onChangeText={setCustomTest}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Giá (nghìn ₫)"
                  placeholderTextColor="#94A3B8"
                  value={customPrice}
                  onChangeText={setCustomPrice}
                  keyboardType="numeric"
                />
                <TouchableOpacity onPress={addCustomTest}>
                  <Icon name="add-circle" size={42} color="#10B981" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {selectedTests.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300)}>
              <View style={styles.card}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "800",
                    color: "#1E293B",
                    marginBottom: 10,
                  }}
                >
                  Đã chọn ({selectedTests.length})
                </Text>
                {selectedTests.map((t, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderColor: "#E2E8F0",
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 15.5,
                        color: "#1E293B",
                        fontWeight: "600",
                      }}
                    >
                      {t.name}
                    </Text>
                    <Text
                      style={{
                        fontWeight: "700",
                        color: "#059669",
                        fontSize: 16,
                      }}
                    >
                      {t.price.toLocaleString()}đ
                    </Text>
                    <TouchableOpacity
                      onPress={() => toggleTest(t)}
                      style={{ marginLeft: 12 }}
                    >
                      <Icon name="close-circle" size={26} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                <View
                  style={{
                    marginTop: 16,
                    padding: 16,
                    backgroundColor: "#10B981",
                    borderRadius: 16,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: "#FFF", fontSize: 17, fontWeight: "700" }}
                  >
                    TỔNG TIỀN
                  </Text>
                  <Text
                    style={{ color: "#FFF", fontSize: 28, fontWeight: "900" }}
                  >
                    {totalPrice.toLocaleString("vi-VN")} ₫
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(500)}>
            <TouchableOpacity onPress={sendTests} style={{ marginTop: 20 }}>
              <LinearGradient
                colors={["#10B981", "#059669"]}
                style={styles.sendBtn}
              >
                <Icon name="paper-plane" size={22} color="#FFF" />
                <Text
                  style={{
                    color: "#FFF",
                    fontSize: 17,
                    fontWeight: "800",
                    marginLeft: 10,
                  }}
                >
                  GỬI CHỈ ĐỊNH
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = {
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontSize: 16.5,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 10,
  },
  textArea: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 90,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    color: "#1E293B",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    color: "#1E293B",
  },
  testCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  testCardSelected: {
    backgroundColor: "#3B82F6",
    borderColor: "#2563EB",
  },
  testName: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#1E293B",
  },
  testNameSelected: {
    color: "#FFFFFF",
  },
  testPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 2,
  },
  testPriceSelected: {
    color: "#FFFFFF",
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
};
