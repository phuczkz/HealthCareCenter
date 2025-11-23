// src/screens/patient/Book_appointment/ConfirmBooking/ConfirmBooking.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../../../api/supabase';
import { LinearGradient } from 'expo-linear-gradient';

// Helper lấy tên ngày tiếng Việt (đúng với dữ liệu trong DB)
const getVietnameseDayName = (dateString) => {
  const date = new Date(dateString);
  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return dayNames[date.getDay()];
};

export default function ConfirmBooking() {
  const navigation = useNavigation();
  const route = useRoute();
  const { date, department, slot, doctor, price: initialPrice } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [servicePrice, setServicePrice] = useState('150.000đ');

  // Kiểm tra tham số đầu vào
  useEffect(() => {
    if (!date || !department || !slot || !doctor) {
      Alert.alert('Lỗi', 'Thiếu thông tin đặt lịch');
      navigation.goBack();
    }
  }, [date, department, slot, doctor, navigation]);

  // Lấy thông tin bệnh nhân + giá dịch vụ
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single();

        if (profile) {
          setPatientName(profile.full_name || '');
          setPatientPhone(profile.phone || '');
        }

        // Hiển thị giá (nếu có truyền từ trước thì dùng, không thì lấy từ services)
        if (initialPrice) {
          setServicePrice(Number(initialPrice).toLocaleString('vi-VN') + 'đ');
        } else {
          const { data: svc } = await supabase
            .from('services')
            .select('price')
            .eq('department_id', department.id)
            .single();
          if (svc?.price) {
            setServicePrice(Number(svc.price).toLocaleString('vi-VN') + 'đ');
          }
        }
      } catch (e) {
        console.warn('Lỗi lấy thông tin:', e);
      }
    };
    fetchInfo();
  }, []);

  const handleBooking = async () => {
    if (!patientName.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
    if (!patientPhone.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
    const cleanPhone = patientPhone.replace(/\D/g, '');
    if (!/^\d{10,11}$/.test(cleanPhone))
      return Alert.alert('Lỗi', 'Số điện thoại không hợp lệ');


    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Chưa đăng nhập');

      const dayOfWeekString = getVietnameseDayName(date);

      // 1. Tìm template → lấy slot_id + max_patients_per_slot
      const { data: template, error: tempErr } = await supabase
        .from('doctor_schedule_template')
        .select('id, max_patients_per_slot')
        .eq('doctor_id', doctor.id)
        .eq('day_of_week', dayOfWeekString)
        .lte('start_time', slot.start_time)
        .gte('end_time', slot.end_time || slot.start_time)
        .single();

      if (tempErr || !template) {
        throw new Error('Khung giờ này không khả dụng. Vui lòng chọn lại!');
      }

      // 2. Kiểm tra còn chỗ không
      const { count } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('date', date)
        .eq('slot_id', template.id)
        .in('status', ['pending', 'confirmed']);

      if (count >= (template.max_patients_per_slot || 10)) {
        Alert.alert('Hết chỗ', 'Ca khám này đã đầy. Vui lòng chọn ca khác!');
        setLoading(false);
        return;
      }

      // 3. INSERT đúng schema (chỉ dùng các cột có thật)
      const { data: newAppointment, error: insertErr } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          doctor_id: doctor.id,
          department_id: department.id,
          patient_name: patientName.trim(),
          patient_phone: cleanPhone,
          date: date,               // cột date (kiểu date)
          slot_id: template.id,     // RẤT QUAN TRỌNG
          status: 'pending',
        })
        .select()
        .single();

      if (insertErr || !newAppointment) {
        throw insertErr || new Error('Không thể tạo lịch hẹn');
      }

      // Hiển thị đẹp
      const dateDisplay = new Date(date).toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const timeDisplay = `${slot.start_time?.slice(0, 5) || '08:00'} - ${
        slot.end_time?.slice(0, 5) || '09:00'
      }`;

      Alert.alert(
        'Đặt lịch thành công!',
        `Mã lịch: #${newAppointment.id}\nBác sĩ: ${doctor.name}\nThời gian: ${timeDisplay}\nNgày: ${dateDisplay}`,
        [
          {
            text: 'Xem vé ngay',
            onPress: () =>
              navigation.replace('BookingSuccess', {
                appointment_id: newAppointment.id,
                doctor_name: doctor.name,
                time: timeDisplay,
                date: dateDisplay,
                department: department.name,
                room: doctor.room_number || '—',
                price: servicePrice,
              }),
          },
          { text: 'Về trang chủ', onPress: () => navigation.replace('HomeScreen') },
        ]
      );
    } catch (err) {
      console.error('Lỗi đặt lịch:', err);
      Alert.alert('Đặt lịch thất bại', err.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị giờ cho UI
  const timeDisplay = `${slot?.start_time?.slice(0, 5) || '08:00'} - ${
    slot?.end_time?.slice(0, 5) || '09:00'
  }`;
  const dateDisplay = new Date(date).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Xác nhận đặt lịch</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Chi tiết lịch khám */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Chi tiết lịch khám</Text>
          <View style={styles.divider} />
          <InfoRow icon="calendar-outline" label="Ngày khám" value={dateDisplay} />
          <InfoRow icon="time-outline" label="Giờ khám" value={timeDisplay} />
          <InfoRow icon="business-outline" label="Chuyên khoa" value={department?.name || '—'} />
          <InfoRow icon="person-outline" label="Bác sĩ" value={doctor?.name || '—'} />
          {doctor?.room_number && <InfoRow icon="location-outline" label="Phòng khám" value={doctor.room_number} />}
        </View>

        {/* Thông tin bệnh nhân */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin bệnh nhân</Text>
          <View style={styles.divider} />
          <InputGroup
            icon="person-outline"
            placeholder="Họ và tên bệnh nhân"
            value={patientName}
            onChangeText={setPatientName}
            autoCapitalize="words"
          />
          <InputGroup
            icon="call-outline"
            placeholder="Số điện thoại"
            value={patientPhone}
            onChangeText={setPatientPhone}
            keyboardType="phone-pad"
            maxLength={11}
          />
        </View>

        {/* Giá */}
        <View style={styles.priceCardContainer}>
          <LinearGradient colors={['#10B981', '#059669']} style={styles.priceCard}>
            <Text style={styles.priceLabel}>Phí khám dự kiến</Text>
            <Text style={styles.priceValue}>{servicePrice}</Text>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Nút đặt lịch */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleBooking} disabled={loading}>
          <LinearGradient
            colors={loading ? ['#9CA3AF', '#9CA3AF'] : ['#3B82F6', '#1E40AF']}
            style={styles.gradientButton}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.confirmText}>Đặt lịch ngay</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Component nhỏ
const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={20} color="#4B5563" />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const InputGroup = ({ icon, placeholder, value, onChangeText, ...props }) => (
  <View style={styles.inputContainer}>
    <Ionicons name={icon} size={20} color="#6B7280" style={styles.inputIcon} />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      value={value}
      onChangeText={onChangeText}
      {...props}
    />
  </View>
);

// Styles (giữ nguyên giao diện đẹp của bạn)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 18,
    paddingBottom: 18,
    backgroundColor: '#fff',
    elevation: 6,
  },
  backButton: { padding: 8, marginRight: 8 },
  title: { fontSize: 23, fontWeight: '800', color: '#1F2937' },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 18,
    marginTop: 18,
    padding: 22,
    borderRadius: 20,
    elevation: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: { fontSize: 19, fontWeight: '800', color: '#1F2937', marginBottom: 14 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  infoLabel: { flex: 1, marginLeft: 16, color: '#4B5563', fontSize: 15.5, fontWeight: '600' },
  infoValue: { fontWeight: '700', color: '#1F2937', fontSize: 15.5 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1F2937', paddingVertical: 14 },
  priceCardContainer: { marginHorizontal: 18, marginTop: 18, marginBottom: 20, borderRadius: 18, overflow: 'hidden', elevation: 12 },
  priceCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 22 },
  priceLabel: { fontSize: 17, color: '#fff', fontWeight: '700' },
  priceValue: { fontSize: 26, fontWeight: '900', color: '#fff' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 18,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 15,
  },
  confirmButton: { borderRadius: 18, overflow: 'hidden', elevation: 12 },
  gradientButton: { padding: 18, alignItems: 'center' },
  confirmText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});