import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Platform } from 'react-native';

const Colors = {
  primary: '#1D4ED8',
  secondary: '#38BDF8',
  textPrimary: '#1E293B',
  textSecondary: '#6B7280',
  cardBg: '#FFFFFF',
  danger: '#DC2626',
  muted: '#9CA3AF',
  success: '#059669',
};

const AppointmentCard = React.memo(({ item, index, onCancel }) => {
  const slot = item.doctor_schedule_template || {};
  const doctor = item.doctor || {};
  const department = item.department || {};

  const timeStr = slot.start_time && slot.end_time
    ? `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`
    : '---';

  const date = item.appointment_date ? new Date(item.appointment_date) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isPast = date ? date < today : false;
  const isCancelled = item.status === 'cancelled' || item.status === 'patient_cancelled';
  const isDoctorCancelled = item.status === 'doctor_cancelled';

  let statusConfig;
  if (isDoctorCancelled) {
    statusConfig = {
      colors: ['#F59E0B', '#FBBF24'],
      text: 'Bác sĩ đã hủy',
      icon: 'alert-circle-sharp',
      reason: item.cancelled_by?.reason || 'Không có lý do',
    };
  } else if (isCancelled) {
    statusConfig = { colors: ['#DC2626', '#F87171'], text: 'Đã hủy', icon: 'close-circle-sharp' };
  } else if (isPast) {
    statusConfig = { colors: ['#6B7280', '#9CA3AF'], text: 'Hoàn thành', icon: 'checkmark-done-sharp' };
  } else {
    statusConfig = { colors: [Colors.success, '#10B981'], text: 'Đã xác nhận', icon: 'checkmark-circle-sharp' };
  }

  const dateStr = date
    ? date.toLocaleDateString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '---';

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).duration(500)}
      style={styles.cardWrapper}
    >
      <TouchableOpacity activeOpacity={0.92} disabled={isCancelled || isDoctorCancelled} style={styles.cardTouchArea}>
        <View style={[styles.card, (isCancelled || isDoctorCancelled) && styles.cancelledCard]}>
          <LinearGradient colors={[Colors.cardBg, '#F9FAFB']} style={styles.gradient}>
            <View style={styles.headerRow}>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName} numberOfLines={1}>
                  {doctor.name || `Bác sĩ (${item.doctor_id || '---'})`}
                </Text>
                <Text style={styles.deptName} numberOfLines={1}>
                  {department.name || 'Chuyên khoa (---)'}
                </Text>
              </View>
              <LinearGradient colors={statusConfig.colors} style={styles.statusBadge}>
                <Ionicons name={statusConfig.icon} size={14} color="#FFF" />
                <Text style={styles.statusText}>{statusConfig.text}</Text>
              </LinearGradient>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={18} color={(isCancelled || isDoctorCancelled) ? Colors.muted : Colors.primary} />
                <Text style={[styles.detailValue, { color: (isCancelled || isDoctorCancelled) ? Colors.muted : Colors.textPrimary }]}>
                  {dateStr}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={18} color={(isCancelled || isDoctorCancelled) ? Colors.muted : Colors.primary} />
                <Text style={[styles.detailValue, { color: (isCancelled || isDoctorCancelled) ? Colors.muted : Colors.textPrimary }]}>
                  {timeStr}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={18} color={(isCancelled || isDoctorCancelled) ? Colors.muted : Colors.primary} />
                <Text style={[styles.detailValue, { color: (isCancelled || isDoctorCancelled) ? Colors.muted : Colors.textPrimary }]}>
                  {doctor.room_number ? `P. ${doctor.room_number}` : '---'}
                </Text>
              </View>
            </View>

            <View style={styles.qrContainer}>
              <View style={styles.qrBox}>
                <QRCode value={`https://your-app.com/booking/${item.id}`} size={60} />
              </View>
              <View style={styles.qrInfo}>
                <Text style={styles.label}>Mã Phiếu Hẹn (ID)</Text>
                <Text style={styles.qrCode} numberOfLines={1} ellipsizeMode="middle">
                  {item.id}
                </Text>
              </View>
            </View>

            {isDoctorCancelled && statusConfig.reason && (
              <Text style={styles.cancelReason}>Lý do: {statusConfig.reason}</Text>
            )}

            {!isCancelled && !isDoctorCancelled && !isPast && (
              <TouchableOpacity style={styles.cancelButton} onPress={() => onCancel(item.id)} activeOpacity={0.8}>
                <LinearGradient colors={[Colors.danger, '#EF4444']} style={styles.cancelGradient}>
                  <Ionicons name="close-circle-outline" size={18} color="#FFF" />
                  <Text style={styles.cancelText}>Hủy Lịch Khám</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  cardWrapper: { marginBottom: 18 },
  cardTouchArea: { borderRadius: 18 },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.cardBg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  cancelledCard: { opacity: 0.65 },
  gradient: { padding: 18 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  doctorInfo: { flex: 1, marginRight: 15 },
  doctorName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  deptName: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, fontWeight: '500' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, gap: 4, minWidth: 100, justifyContent: 'center' },
  statusText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, marginBottom: 15 },
  detailItem: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6, justifyContent: 'flex-start' },
  detailValue: { fontSize: 13.5, fontWeight: '600', color: Colors.textPrimary },
  qrContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingVertical: 15, paddingHorizontal: 15, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  qrBox: { width: 68, height: 68, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  qrInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  label: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500', marginBottom: 2 },
  qrCode: { fontSize: 14, color: Colors.textPrimary, fontWeight: '700' },
  cancelButton: { marginTop: 15, borderRadius: 14, overflow: 'hidden' },
  cancelGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
  cancelText: { color: '#FFF', fontWeight: '700', fontSize: 14.5 },
  cancelReason: { fontSize: 12, color: Colors.danger, marginTop: 10, textAlign: 'center' },
});

export default AppointmentCard;