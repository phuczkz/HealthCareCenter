import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";
import { supabase } from "../../api/supabase";

const DAYS_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAYS_VI_HEADER = {
  Sunday: "CN",
  Monday: "T2",
  Tuesday: "T3",
  Wednesday: "T4",
  Thursday: "T5",
  Friday: "T6",
  Saturday: "T7",
};

const VIETNAMESE_TO_ENGLISH = {
  "Thứ 2": "Monday",
  "Thứ 3": "Tuesday",
  "Thứ 4": "Wednesday",
  "Thứ 5": "Thursday",
  "Thứ 6": "Friday",
  "Thứ 7": "Saturday",
  "Chủ nhật": "Sunday",
  "Chủ Nhật": "Sunday",

  "Thứ Hai": "Monday",
  "Thứ Ba": "Tuesday",
  "Thứ Tư": "Wednesday",
  "Thứ Năm": "Thursday",
  "Thứ Sáu": "Friday",
  "Thứ Bảy": "Saturday",
  "Chủ Nhật": "Sunday",

  T2: "Monday",
  T3: "Tuesday",
  T4: "Wednesday",
  T5: "Thursday",
  T6: "Friday",
  T7: "Saturday",
  CN: "Sunday",
};

export default function WorkSchedule({ doctorId }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const playEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const formatTime = (time) => {
    if (!time) return "--:--";
    const [h, m = "00"] = time.split(":");
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
  };

  const normalizeDay = (vietDay) => {
    if (!vietDay) return null;
    const trimmed = vietDay.trim();
    return VIETNAMESE_TO_ENGLISH[trimmed] || null;
  };

  const fetchSchedule = useCallback(async () => {
    if (!doctorId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("doctor_schedule_template")
        .select("day_of_week, start_time, end_time, max_patients_per_slot")
        .eq("doctor_id", doctorId)
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Lỗi tải lịch:", error);
        setSchedule([]);
      } else {
        setSchedule(data || []);
        playEntrance();
      }
    } catch (err) {
      console.error("Lỗi bất ngờ:", err);
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const workingDaysSet = useMemo(() => {
    const set = new Set();
    schedule.forEach((item) => {
      const enDay = normalizeDay(item.day_of_week);
      if (enDay) set.add(enDay);
    });
    return set;
  }, [schedule]);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const days = [];

    const startingDayIndex = firstDayOfMonth.getDay();
    for (let i = 0; i < startingDayIndex; i++) {
      days.push(null);
    }

    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }, [year, month]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Đang tải lịch làm việc...</Text>
      </View>
    );
  }

  const hasSchedule = schedule.length > 0;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Text style={styles.title}>
        Lịch làm việc tháng {month + 1}/{year}
      </Text>

      <View style={styles.calendarGrid}>
        {DAYS_EN.map((day) => (
          <Text key={day} style={styles.weekHeader}>
            {DAYS_VI_HEADER[day]}
          </Text>
        ))}

        {calendarDays.map((date, index) => {
          if (!date) {
            return <View key={`empty-${index}`} style={styles.emptyCell} />;
          }

          const dayEn = DAYS_EN[date.getDay()];
          const isWorkingDay = workingDaysSet.has(dayEn);
          const isToday = date.toDateString() === today.toDateString();

          return (
            <View
              key={date.toISOString()}
              style={[styles.dayCell, isToday && styles.todayCell]}
            >
              <Text
                style={[
                  styles.dayNumber,
                  isWorkingDay && styles.workingDayText,
                  isToday && styles.todayText,
                ]}
              >
                {date.getDate()}
              </Text>
            </View>
          );
        })}
      </View>

      {hasSchedule ? (
        <View style={styles.slotsSection}>
          <Text style={styles.slotsTitle}>Các ca làm việc cố định</Text>
          {schedule.map((slot, idx) => (
            <View key={idx} style={styles.slotCard}>
              <Text style={styles.slotDay}>{slot.day_of_week}</Text>
              <Text style={styles.slotTime}>
                {formatTime(slot.start_time)} → {formatTime(slot.end_time)}
              </Text>
              <Text style={styles.slotCapacity}>
                Tối đa {slot.max_patients_per_slot || 5} bệnh nhân/ca
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Bác sĩ chưa thiết lập lịch làm việc cố định.
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 16,
  },

  container: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 28,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 20,
    textAlign: "center",
  },

  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
  },

  weekHeader: {
    width: "14.2857%",
    textAlign: "center",
    fontWeight: "700",
    color: "#64748B",
    fontSize: 14,
    marginBottom: 10,
  },

  emptyCell: {
    width: "14.2857%",
    height: 50,
  },

  dayCell: {
    width: "14.2857%",
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    marginBottom: 8,
  },

  todayCell: {
    borderWidth: 2.5,
    borderColor: "#2563EB",
  },

  dayNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
  },

  workingDayText: {
    color: "#2563EB",
    fontWeight: "800",
  },

  todayText: {
    color: "#2563EB",
    fontWeight: "900",
  },

  slotsSection: {
    marginTop: 8,
  },

  slotsTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },

  slotCard: {
    backgroundColor: "#F0F9FF",
    borderLeftWidth: 5,
    borderLeftColor: "#2563EB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },

  slotDay: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2563EB",
  },

  slotTime: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 6,
  },

  slotCapacity: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
    fontStyle: "italic",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 30,
  },

  emptyText: {
    fontSize: 16,
    color: "#94A3B8",
    textAlign: "center",
    fontStyle: "italic",
  },
});
