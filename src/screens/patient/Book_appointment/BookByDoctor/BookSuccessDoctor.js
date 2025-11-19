// src/screens/patient/Book_appointment/BookByDoctor/BookSuccessDoctor.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const Colors = {
  primary: '#1D4ED8',
  success: '#10B981',
  textPrimary: '#1E293B',
  textSecondary: '#4B5563',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  lightGreen: '#F0FDF4',
};

export default function BookSuccessDoctor() {
  const navigation = useNavigation();
  const route = useRoute();
  const { doctor, selectedDate, timeSlot, appointment } = route.params || {};

  React.useEffect(() => {
    console.log('Doctor:', doctor);
    console.log('Ngày khám:', selectedDate);
    console.log('Khung giờ:', timeSlot?.display);
    console.log('Lịch hẹn DB:', appointment);
  }, [doctor, selectedDate, timeSlot, appointment]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!doctor || !selectedDate || !timeSlot || !appointment) {
    navigation.replace('Home');
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.replace('Home')}>
          <Ionicons name="home" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Đặt lịch thành công</Text>
        <View style={{ width: 24 }} />
      </Animated.View>

      <ScrollView style={styles.content}>
        <Animated.View entering={FadeInUp.duration(600)} style={styles.successIcon}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={48} color={Colors.white} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.message}>
          <Text style={styles.successTitle}>Đặt lịch khám thành công!</Text>
          <Text style={styles.successSub}>
            Bạn đã đặt lịch khám với bác sĩ {doctor.name} thành công.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Thông tin lịch hẹn</Text>

          <View style={styles.infoRow}>
            <Ionicons name="person" size={18} color={Colors.textSecondary} />
            <Text style={styles.label}>Bác sĩ</Text>
            <Text style={styles.value}>{doctor.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="business" size={18} color={Colors.textSecondary} />
            <Text style={styles.label}>Khoa</Text>
            <Text style={styles.value}>{doctor.department_name || 'Chưa có'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={18} color={Colors.textSecondary} />
            <Text style={styles.label}>Ngày khám</Text>
            <Text style={styles.value}>{formatDate(selectedDate)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time" size={18} color={Colors.textSecondary} />
            <Text style={styles.label}>Giờ khám</Text>
            <Text style={styles.value}>{timeSlot.display}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="pricetag" size={18} color={Colors.textSecondary} />
            <Text style={styles.label}>Phí khám</Text>
            <Text style={styles.value}>150.000đ</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="barcode" size={18} color={Colors.textSecondary} />
            <Text style={styles.label}>Mã lịch hẹn</Text>
            <Text style={styles.value}>{appointment.id.slice(0, 8).toUpperCase()}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.note}>
          <Ionicons name="information-circle" size={16} color={Colors.success} />
          <Text style={styles.noteText}>
            Vui lòng đến trước 15 phút để làm thủ tục. Hủy lịch trước 2 giờ nếu không thể đến.
          </Text>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.replace('Home')}
        >
          <Text style={styles.secondaryText}>Về trang chủ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.replace('MyAppointments')}
        >
          <Ionicons name="calendar" size={18} color={Colors.white} />
          <Text style={styles.primaryText}>Xem lịch hẹn</Text>
        </TouchableOpacity>
      </Animated.View>
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
    backgroundColor: Colors.white,
    elevation: 2,
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  content: { flex: 1 },
  successIcon: {
    alignItems: 'center',
    marginTop: 32,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    alignItems: 'center',
    marginHorizontal: 32,
    marginTop: 24,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.success,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  detailCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 32,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    color: Colors.textSecondary,
    width: 90,
  },
  value: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    padding: 12,
    backgroundColor: Colors.lightGreen,
    borderRadius: 12,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: Colors.success,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.white,
    elevation: 2,
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  primaryBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});