// src/screens/patient/Book_appointment/BookByDoctor/ConfirmBookingDoctor.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../../../api/supabase';
import Animated, { FadeInDown } from 'react-native-reanimated';

const Colors = {
  primary: '#1D4ED8',
  success: '#10B981',
  textPrimary: '#1E293B',
  textSecondary: '#4B5563',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  lightBlue: '#EFF6FF',
};

export default function ConfirmBookingDoctor() {
  const navigation = useNavigation();
  const route = useRoute();
  const { doctor, selectedDate, timeSlot } = route.params || {};

  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    console.log('========== CONFIRM BOOKING ==========');
    console.log('Doctor:', doctor);
    console.log('department_id:', doctor?.department_id);
    console.log('Ngày khám:', selectedDate);
    console.log('Khung giờ:', timeSlot?.display, '| slot_id:', timeSlot?.slot_id);
    console.log('=====================================');

    if (!doctor?.id || !selectedDate || !timeSlot?.slot_id || !doctor?.department_id) {
      Alert.alert('Lỗi', 'Thiếu thông tin đặt lịch');
      navigation.goBack();
    }
  }, [doctor, selectedDate, timeSlot, navigation]);

  const handleConfirm = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Không tìm thấy người dùng');

      console.log('User ID:', user.id);

      const appointmentData = {
        user_id: user.id,
        doctor_id: doctor.id,
        appointment_date: new Date(`${selectedDate}T${timeSlot.start}:00`).toISOString(),
        date: selectedDate,
        slot_id: timeSlot.slot_id,
        department_id: doctor.department_id,
        status: 'pending',
        patient_name: doctor.name,
        patient_phone: '0123456789',
      };

      console.log('Dữ liệu gửi lên DB:', appointmentData);

      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (error) throw error;

      console.log('Đặt lịch thành công:', data);

      // VỀ TRANG HOME NGAY LẬP TỨC
      navigation.replace('HomeScreen');

    } catch (err) {
      console.error('Lỗi đặt lịch:', err);
      Alert.alert('Lỗi', err.message || 'Không thể đặt lịch. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (!doctor || !selectedDate || !timeSlot) return null;

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Xác nhận đặt lịch</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Thông tin bác sĩ</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{doctor.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="medkit" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{doctor.specialization || 'Chưa có'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="business" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoText}>Khoa: {doctor.department_name || 'Chưa có'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoText}>Phòng {doctor.room_number || 'Chưa có'}</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Thời gian khám</Text>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{formatDate(selectedDate)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{timeSlot.display}</Text>
          </View>
        </View>

        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>Phí khám</Text>
          <Text style={styles.price}>150.000đ</Text>
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle" size={16} color={Colors.primary} />
          <Text style={styles.noteText}>
            Vui lòng đến trước 15 phút để làm thủ tục. Hủy lịch trước 2 giờ nếu không thể đến.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.cancelBtn, loading && styles.disabledBtn]}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelText}>Hủy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmBtn, loading && styles.disabledBtn]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={Colors.white} />
              <Text style={styles.confirmText}>Xác nhận đặt lịch</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    elevation: 2,
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  content: { flex: 1 },
  summaryCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  priceCard: {
    backgroundColor: Colors.lightBlue,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: { fontSize: 16, color: Colors.primary },
  price: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.white,
    elevation: 2,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  confirmBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  disabledBtn: {
    opacity: 0.6,
  },
});