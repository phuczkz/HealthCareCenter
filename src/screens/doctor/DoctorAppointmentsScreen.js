import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { supabase } from '../../api/supabase';
import { styles } from '../../styles/doctor/DoctorAppointmentsStyles';
import { DoctorAppointmentController } from '../../controllers/doctor/doctor_appointment_controller';

export default function DoctorAppointmentsScreen() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        await DoctorAppointmentController.loadAppointments(
          setDoctorId,
          setAppointments,
          setLoading,
          setError
        );
      } catch (err) {
        setError('Có lỗi không xác định xảy ra. Vui lòng thử lại.');
        console.error('Unexpected error during load:', err);
      }
    };
    loadData();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return '#2ecc71'; // Xanh lá
      case 'pending':
        return '#f1c40f'; // Vàng
      case 'completed':
        return '#3498db'; // Xanh dương
      case 'cancelled':
        return '#e74c3c'; // Đỏ
      case 'patient_cancelled':
        return '#e67e22'; // Cam (hủy bởi bệnh nhân)
      case 'doctor_cancelled':
        return '#9b59b6'; // Tím (hủy bởi bác sĩ)
      default:
        return '#333';
    }
  };

  const confirmAppointment = async (id) => {
    if (!id) {
      Alert.alert('Lỗi', 'ID cuộc hẹn không hợp lệ.');
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      }

      const updatedAppointment = await DoctorAppointmentController.confirmAppointment(id, setAppointments, setError);
      setAppointments(prev => prev.map(app => app.id === id ? updatedAppointment : app));
      Alert.alert('Thành công', 'Đã xác nhận cuộc hẹn.');
    } catch (error) {
      console.error('Lỗi xác nhận:', error);
      Alert.alert('Lỗi', error.message || 'Không thể xác nhận cuộc hẹn.');
    }
  };

  const cancelAppointment = async (id) => {
    if (!id) {
      Alert.alert('Lỗi', 'ID cuộc hẹn không hợp lệ.');
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      }

      Alert.alert(
        'Xác nhận hủy',
        'Bạn có chắc muốn hủy cuộc hẹn này? (Lý do: Bận đột xuất)',
        [
          { text: 'Hủy bỏ', style: 'cancel' },
          {
            text: 'Xác nhận',
            onPress: async () => {
              try {
                const updatedAppointment = await DoctorAppointmentController.cancelAppointment(id, setAppointments, setError, 'doctor', 'Bận đột xuất');
                setAppointments(prev => prev.map(app => app.id === id ? updatedAppointment : app));
                Alert.alert('Thành công', 'Đã hủy cuộc hẹn.');
              } catch (error) {
                console.error('Lỗi hủy:', error);
                Alert.alert('Lỗi', error.message || 'Không thể hủy cuộc hẹn.');
              }
            },
            style: 'destructive',
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Lỗi kiểm tra phiên:', error);
      Alert.alert('Lỗi', error.message || 'Không thể kiểm tra phiên đăng nhập.');
    }
  };

  const renderItem = ({ item }) => {
    if (!item) {
      return (
        <View style={styles.card}>
          <Text style={styles.errorText}>Dữ liệu cuộc hẹn không hợp lệ</Text>
        </View>
      );
    }

    const patientName = item.patient_name || (item.patient?.full_name || 'Bệnh nhân không xác định');
    const departmentName = item.department?.name || 'Khoa không xác định';
    const slot = item.slot || {};
    const cancelledBy = item.cancelled_by?.cancelled_by || null;
    const reason = item.cancelled_by?.reason || null;

    let timeDisplay = 'Chưa có thời gian';
    if (item.appointment_date) {
      const dateObj = new Date(item.appointment_date);
      timeDisplay = !isNaN(dateObj) ? dateObj.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }) : 'Chưa có thời gian';
    } else if (slot.start_time && slot.end_time) {
      const start = new Date(slot.start_time);
      const end = new Date(slot.end_time);
      timeDisplay = !isNaN(start) && !isNaN(end) ? `${start.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })} - ${end.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })}` : 'Chưa có thời gian';
    }

    return (
      <View style={styles.card}>
        <Text style={styles.name}>{patientName}</Text>
        <Text style={styles.service}>🏢 {departmentName}</Text>
        <Text style={styles.time}>🕓 {timeDisplay}</Text>
        {item.symptoms ? (
          <Text style={styles.symptoms}>🤒 {item.symptoms}</Text>
        ) : null}
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
          Trạng thái: {item.status || 'Không xác định'}
        </Text>
        {cancelledBy && (
          <Text style={styles.cancelInfo}>
            Hủy bởi: {cancelledBy === 'doctor' ? 'Bác sĩ' : 'Bệnh nhân'}
            {reason ? ` - Lý do: ${reason}` : ''}
          </Text>
        )}
        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => confirmAppointment(item.id)}
            activeOpacity={0.7}
            disabled={!item.id}
          >
            <Text style={styles.confirmButtonText}>Xác nhận</Text>
          </TouchableOpacity>
        )}
        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => cancelAppointment(item.id)}
            activeOpacity={0.7}
            disabled={!item.id}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📅 Lịch hẹn của tôi</Text>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : appointments.length === 0 ? (
        <Text style={styles.emptyText}>Không có lịch hẹn nào.</Text>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()} // Ưu tiên item.id
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>Không có lịch hẹn nào.</Text>}
        />
      )}
    </View>
  );
}