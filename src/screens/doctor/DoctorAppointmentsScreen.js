import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";

import DoctorAppointmentCard from "../../components/DoctorAppointmentCard";
import { DoctorAppointmentController } from "../../controllers/doctor/doctor_appointment_controller";
import { supabase } from "../../api/supabase";

import styles from "./DoctorAppointmentsScreen.styles";

const TABS = [
  { key: "today", title: "Hôm nay" },
  { key: "pending", title: "Chờ xác nhận" },
  { key: "confirmed", title: "Đã xác nhận" },
  { key: "waiting_results", title: "Chờ kết quả" },
  { key: "completed", title: "Đã khám xong" },
  { key: "cancelled", title: "Đã hủy" },
];

export default function DoctorAppointmentsScreen() {
  const navigation = useNavigation();
  const flatListRef = useRef(null);

  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeTab, setActiveTab] = useState("today");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const loadAppointments = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setRefreshing(isRefresh);

    try {
      await DoctorAppointmentController.loadAppointments({ setAppointments });
    } catch (err) {
      console.error("Lỗi tải lịch:", err);
      Alert.alert("Lỗi", "Không thể tải lịch khám. Vui lòng thử lại.");
    } finally {
      setRefreshing(false);
      if (!isRefresh) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => loadAppointments(), 300);
      return () => clearTimeout(timer);
    }, [loadAppointments])
  );

  useEffect(() => {
    let result = [...appointments];

    const isTodayDate = (date) => {
      const d = new Date(date);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    };

    if (activeTab === "today") {
      result = result.filter(
        (app) =>
          isTodayDate(app.appointment_date) &&
          ![
            "completed",
            "cancelled",
            "patient_cancelled",
            "doctor_cancelled",
          ].includes(app.status)
      );
    } else if (activeTab === "pending")
      result = result.filter((a) => a.status === "pending");
    else if (activeTab === "confirmed")
      result = result.filter((a) => a.status === "confirmed");
    else if (activeTab === "waiting_results")
      result = result.filter((a) => a.status === "waiting_results");
    else if (activeTab === "completed")
      result = result.filter((a) => a.status === "completed");
    else if (activeTab === "cancelled")
      result = result.filter((a) =>
        ["cancelled", "patient_cancelled", "doctor_cancelled"].includes(
          a.status
        )
      );

    result.sort(
      (a, b) => new Date(a.appointment_date) - new Date(b.appointment_date)
    );
    setFiltered(result);
  }, [appointments, activeTab]);

  useEffect(() => {
    if (!highlightedId || filtered.length === 0) return;
    const idx = filtered.findIndex((a) => a.id === highlightedId);
    if (idx === -1) return;

    requestAnimationFrame(() => {
      flatListRef.current?.scrollToIndex({
        index: idx,
        animated: true,
        viewPosition: 0.5,
      });
    });

    const timer = setTimeout(() => setHighlightedId(null), 2200);
    return () => clearTimeout(timer);
  }, [filtered, highlightedId]);

  const onRefresh = useCallback(
    () => loadAppointments(true),
    [loadAppointments]
  );

  // ĐÃ SỬA 100% SUPABASE V2 – DÙNG AWAIT + XỬ LÝ ERROR
  const updateAppointmentStatus = async (id, status) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);

    if (error) {
      Alert.alert("Lỗi", error.message || "Không thể cập nhật trạng thái");
      return false;
    }
    return true;
  };

  const startExamination = async (item) => {
    const patientName =
      item.patient?.full_name || item.patient_name || "Bệnh nhân";
    const apptDate = new Date(item.appointment_date);
    const isToday = apptDate.toDateString() === new Date().toDateString();

    if (item.status === "pending") {
      Alert.alert(
        "Xác nhận lịch hẹn",
        `Bệnh nhân: ${patientName}\nThời gian: ${apptDate.toLocaleString(
          "vi-VN"
        )}`,
        [
          {
            text: "Hủy lịch",
            style: "destructive",
            onPress: async () => {
              const success = await updateAppointmentStatus(
                item.id,
                "doctor_cancelled"
              );
              if (success) loadAppointments();
            },
          },
          { text: "Để sau", style: "cancel" },
          {
            text: "Xác nhận khám",
            onPress: async () => {
              const success = await updateAppointmentStatus(
                item.id,
                "confirmed"
              );
              if (success) {
                setActiveTab("confirmed");
                setHighlightedId(item.id);
                loadAppointments();
              }
            },
          },
        ]
      );
      return;
    }

    if (item.status === "confirmed" && isToday) {
      navigation.navigate("OrderTests", {
        appointmentId: item.id,
        patientId: item.user_id,
        patientName,
      });
    } else if (item.status === "confirmed" && !isToday) {
      Alert.alert(
        "Chưa đến ngày",
        "Chỉ có thể chỉ định xét nghiệm vào đúng ngày khám."
      );
    }

    if (item.status === "waiting_results" && isToday) {
      const { data, error } = await supabase
        .from("test_results")
        .select("status")
        .eq("appointment_id", item.id);

      if (error) {
        Alert.alert("Lỗi", "Không thể kiểm tra kết quả xét nghiệm");
        return;
      }

      const allDone =
        data.length > 0 &&
        data.every((t) => !["pending", "in_progress"].includes(t.status));
      if (!allDone) {
        Alert.alert(
          "Chưa đủ kết quả",
          "Vui lòng đợi tất cả xét nghiệm hoàn tất"
        );
        return;
      }

      navigation.navigate("FinalizeRecord", {
        appointmentId: item.id,
        patientId: item.user_id,
        patientName,
      });
    }

    if (item.status === "completed") {
      navigation.navigate("ViewMedicalRecord", { appointmentId: item.id });
    }
  };

  const handleCancel = async (id) => {
    Alert.alert("Hủy lịch hẹn", "Bạn có chắc chắn muốn hủy lịch này?", [
      { text: "Không", style: "cancel" },
      {
        text: "Hủy",
        style: "destructive",
        onPress: async () => {
          const success = await updateAppointmentStatus(id, "doctor_cancelled");
          if (success) loadAppointments();
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <DoctorAppointmentCard
      item={item}
      isHighlighted={highlightedId === item.id}
      onPressMain={() => startExamination(item)}
      onCancel={() => handleCancel(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />

      <LinearGradient colors={["#3B82F6", "#1D4ED8"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lịch Khám Của Tôi</Text>
          <View style={{ width: 28 }} />
        </View>
      </LinearGradient>

      <View style={styles.tabBarContainer}>
        <FlatList
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveTab(item.key)}
              style={styles.tabItem(activeTab === item.key)}
            >
              <Text style={styles.tabText(activeTab === item.key)}>
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Đang tải lịch khám...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Icon name="calendar-clear-outline" size={100} color="#94A3B8" />
          <Text style={styles.emptyText}>
            {activeTab === "today"
              ? "Hôm nay chưa có lịch khám"
              : "Không tìm thấy lịch hẹn"}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3B82F6"]}
            />
          }
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={15}
          removeClippedSubviews={true}
        />
      )}
    </View>
  );
}
