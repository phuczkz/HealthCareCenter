// src/screens/patient/Book_appointment/BookByDoctor/SelectDate.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const Colors = {
  primary: '#1D4ED8',
  textPrimary: '#1E293B',
  textSecondary: '#4B5563',
  bg: '#F8FAFC',
  available: '#1D4ED8',
  today: '#DBEAFE',
  disabled: '#F3F4F6',
  white: '#FFFFFF',
};

export default function SelectDate() {
  const navigation = useNavigation();
  const route = useRoute();
  const { doctor } = route.params || {};

  React.useEffect(() => {
    if (!doctor?.id || !doctor?.name) {
      Alert.alert('Lỗi', 'Thiếu thông tin bác sĩ.');
      navigation.goBack();
    }
  }, [doctor, navigation]);

  // Today in local timezone (Vietnam +07), set to 00:00
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Display November 2025
  const currentYear = 2025;
  const currentMonth = 10; // 0-based: 10 = November

  // Doctor available on Monday (dayOfWeek: 1)
  const doctorSchedule = [{ dayOfWeek: 1 }]; // Changed to Monday to match 17/11/2025

  // Generate list of available dates in 'YYYY-MM-DD' format
  const generateAvailableDates = () => {
    const dates = [];
    const start = new Date(today);
    start.setDate(start.getDate() + 1); // Start from tomorrow (14/11/2025)

    for (let i = 0; i < 60; i++) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

      if (doctorSchedule.some(s => s.dayOfWeek === dayOfWeek)) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        dates.push({
          date: `${y}-${m}-${d}`,
          dayOfWeek,
        });
      }
    }
    return dates;
  };

  const availableDates = React.useMemo(() => generateAvailableDates(), [doctorSchedule]);

  const handleSelect = (dateStr) => {
    const parts = dateStr.split('-').map(Number);
    const selected = new Date(parts[0], parts[1] - 1, parts[2]);
    selected.setHours(0, 0, 0, 0);

    if (selected < today) {
      Alert.alert('Không thể chọn', 'Ngày đã qua không thể đặt lịch.');
      return;
    }
    navigation.navigate('SelectTimeSlotDoctor', {
      doctor,
      selectedDate: dateStr,
    });
  };

  const getFirstDayOfMonth = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    return firstDay.getDay(); // 0=Sun, 1=Mon, ...
  };

  const firstDayOffset = getFirstDayOfMonth();

  const renderDay = (index) => {
    const dayInMonth = index - firstDayOffset + 1;
    const daysInThisMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    if (dayInMonth < 1 || dayInMonth > daysInThisMonth) {
      return <View key={`empty-${index}`} style={styles.emptyDay} />;
    }

    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayInMonth).padStart(2, '0')}`;
    const dateObj = new Date(currentYear, currentMonth, dayInMonth);
    dateObj.setHours(0, 0, 0, 0);

    const isPast = dateObj < today;
    const isAvailable = availableDates.some(d => d.date === dateStr);
    const isToday = dateObj.toDateString() === today.toDateString();

    if (isPast) {
      return (
        <View key={`past-${dateStr}`} style={[styles.day, styles.disabled]}>
          <Text style={styles.disabledText}>{dayInMonth}</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={`day-${dateStr}`} // Unique key for each day
        style={StyleSheet.flatten([
          styles.day,
          isToday && styles.today,
          isAvailable && styles.available,
          !isAvailable && styles.disabled,
        ])}
        onPress={() => isAvailable && handleSelect(dateStr)}
        disabled={!isAvailable}
        activeOpacity={0.8}
      >
        <Text
          style={StyleSheet.flatten([
            styles.dayText,
            isToday && styles.todayText,
            isAvailable && styles.availableText,
            !isAvailable && styles.disabledText,
          ])}
        >
          {dayInMonth}
        </Text>
        {isToday && <Text style={styles.todayLabel}>Hôm nay</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Chọn ngày khám</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home" size={24} color={Colors.white} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.content}>
        <View style={styles.calendar}>
          <View style={styles.monthHeader}>
            <Text style={styles.month}>Tháng 11 - 2025</Text>
          </View>

          <View style={styles.weekdays}>
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d) => (
              <Text key={d} style={styles.weekday}>{d}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {Array.from({ length: 42 }, (_, i) => renderDay(i))}
          </View>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: Colors.available }]} />
            <Text style={styles.legendText}>Có lịch trống</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: Colors.disabled }]} />
            <Text style={styles.legendText}>Không khả dụng</Text>
          </View>
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle" size={16} color={Colors.primary} />
          <Text style={styles.noteText}>
            Chỉ hiển thị các ngày bác sĩ có lịch và chưa qua.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: Colors.primary,
    elevation: 2,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.white },
  content: { flex: 1 },
  calendar: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    margin: 16,
    padding: 16,
    elevation: 2,
  },
  monthHeader: { alignItems: 'center', marginBottom: 12 },
  month: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  weekdays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyDay: {
    width: `${100 / 7 - 1.5}%`,
    aspectRatio: 1,
  },
  day: {
    width: `${100 / 7 - 1.5}%`,
    aspectRatio: 1,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
  },
  today: {
    backgroundColor: Colors.today,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  available: {
    backgroundColor: Colors.available,
  },
  disabled: {
    backgroundColor: Colors.disabled,
  },
  dayText: { fontSize: 14, color: Colors.textPrimary },
  todayText: { color: Colors.primary, fontWeight: '700' },
  availableText: { color: Colors.white, fontWeight: '700' },
  disabledText: { color: '#9CA3AF' },
  todayLabel: { fontSize: 9, color: Colors.primary, marginTop: 2 },
  legend: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: { fontSize: 13, color: Colors.textSecondary, marginLeft: 8 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary,
    lineHeight: 20,
    marginLeft: 8,
  },
});