import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import WorkSchedule from "../../screens/doctor/WorkSchedule";

export default function DoctorWorkScheduleScreen() {
  const navigation = useNavigation();

  const [doctorId, setDoctorId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        console.log("✅ Doctor ID lấy từ auth:", user.id);
        setDoctorId(user.id);
      }

      setLoading(false);
    };

    fetchDoctorId();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      <LinearGradient colors={["#1E3A8A", "#2563EB"]} style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back-ios-new" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Lịch làm việc</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <WorkSchedule doctorId={doctorId} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
