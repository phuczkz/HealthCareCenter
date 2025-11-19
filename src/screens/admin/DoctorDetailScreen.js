// src/screens/admin/DoctorDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../api/supabase';
import { deleteDoctorService } from '../../services/doctor/doctorService';
import { styles } from '../../styles/admin/DoctorDetailStyles';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function DoctorDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { doctorId } = route.params;

  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDoctorDetail = async () => {
    setLoading(true);
    console.log('Fetching doctor with ID:', doctorId); // DEBUG

    try {
      // LẤY BÁC SĨ
      const { data: doc, error: docError } = await supabase
        .from('doctors')
        .select(`
          id,
          name,
          specialization,
          experience_years,
          room_number,
          max_patients_per_slot,
          bio,
          departments!inner(name),
          user_profiles!inner(avatar_url, full_name)
        `)
        .eq('id', doctorId)
        .single();

      if (docError) {
        console.error('Lỗi lấy bác sĩ:', docError);
        throw docError;
      }

      console.log('Doctor data:', doc); // DEBUG

      // LẤY LỊCH
      const { data: sched, error: schedError } = await supabase
        .from('doctor_schedule_template')
        .select('day_of_week, start_time, end_time, max_patients_per_slot')
        .eq('doctor_id', doctorId);

      if (schedError) {
        console.error('Lỗi lấy lịch:', schedError);
        throw schedError;
      }

      console.log('Raw schedule data:', sched); // DEBUG

      setDoctor(doc);
      setSchedules(sched || []);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải thông tin bác sĩ: ' + error.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorDetail();
  }, [doctorId]);

  const handleDelete = () => {
    Alert.alert(
      'Xóa bác sĩ',
      `Bạn có chắc muốn xóa bác sĩ **${doctor?.user_profiles?.full_name || doctor?.name}**?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await deleteDoctorService(doctorId);
              if (result.success) {
                Alert.alert('Thành công', result.message);
                navigation.navigate('Bác sĩ');
              } else {
                Alert.alert('Lỗi', result.message);
              }
            } catch {
              Alert.alert('Lỗi', 'Xóa thất bại');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!doctor) return null;

  // MAP CẢ 'T2' VÀ 'Thứ 2'
  const dayMap = {
    'T2': 'Thứ 2', 'Thứ 2': 'Thứ 2',
    'T3': 'Thứ 3', 'Thứ 3': 'Thứ 3',
    'T4': 'Thứ 4', 'Thứ 4': 'Thứ 4',
    'T5': 'Thứ 5', 'Thứ 5': 'Thứ 5',
    'T6': 'Thứ 6', 'Thứ 6': 'Thứ 6',
    'T7': 'Thứ 7', 'Thứ 7': 'Thứ 7',
    'CN': 'Chủ nhật', 'Chủ nhật': 'Chủ nhật',
  };

  const weekDays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

  const scheduleByDay = schedules.reduce((acc, s) => {
    const rawDay = s.day_of_week?.trim();
    const dayName = dayMap[rawDay];
    if (!dayName) {
      console.warn('Ngày không hợp lệ:', rawDay); // DEBUG
      return acc;
    }
    if (!acc[dayName]) acc[dayName] = [];
    const start = s.start_time?.slice(0, 5) || '';
    const end = s.end_time?.slice(0, 5) || '';
    acc[dayName].push(`${start}-${end}`);
    return acc;
  }, {});

  const fullName = doctor.user_profiles?.full_name || doctor.name || 'Bác sĩ';
  const avatarLetter = fullName.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />

      {/* HEADER */}
      <LinearGradient colors={['#1E40AF', '#3B82F6']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết bác sĩ</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AdminHome')} style={styles.homeButton}>
          <Icon name="home" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* AVATAR */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {doctor.user_profiles?.avatar_url ? (
              <Image source={{ uri: doctor.user_profiles.avatar_url }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.avatarGradient}>
                <Text style={styles.avatarText}>{avatarLetter}</Text>
              </LinearGradient>
            )}
          </View>
          <Text style={styles.doctorName}>{fullName}</Text>
          <Text style={styles.department}>{doctor.departments?.name || 'Chưa có khoa'}</Text>
        </View>

        {/* INFO GRID */}
        <View style={styles.infoGrid}>
          <LinearGradient colors={['#EBF8FF', '#DBF0FF']} style={styles.infoCard}>
            <Icon name="medkit" size={28} color="#0EA5E9" />
            <Text style={styles.infoLabel}>Chuyên môn</Text>
            <Text style={styles.infoValue}>{doctor.specialization || 'Chưa cập nhật'}</Text>
          </LinearGradient>

          <LinearGradient colors={['#FFFBEB', '#FEF3C7']} style={styles.infoCard}>
            <Icon name="time" size={28} color="#F59E0B" />
            <Text style={styles.infoLabel}>Kinh nghiệm</Text>
            <Text style={styles.infoValue}>{doctor.experience_years || 0} năm</Text>
          </LinearGradient>

          <LinearGradient colors={['#F0FDF4', '#DCFCE7']} style={styles.infoCard}>
            <Icon name="home" size={28} color="#10B981" />
            <Text style={styles.infoLabel}>Phòng khám</Text>
            <Text style={styles.infoValue}>{doctor.room_number || 'Chưa có'}</Text>
          </LinearGradient>

          <LinearGradient colors={['#FDF2F8', '#FCE7F3']} style={styles.infoCard}>
            <Icon name="people" size={28} color="#EC4899" />
            <Text style={styles.infoLabel}>Số bệnh nhân/ca</Text>
            <Text style={styles.infoValue}>{doctor.max_patients_per_slot || 5}</Text>
          </LinearGradient>
        </View>

        {/* LỊCH LÀM VIỆC */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <Icon name="calendar" size={22} color="#8B5CF6" />
            <Text style={styles.scheduleTitle}>Lịch làm việc</Text>
          </View>

          {schedules.length === 0 ? (
            <View style={styles.emptySchedule}>
              <Text style={styles.emptyText}>Chưa có lịch làm việc</Text>
            </View>
          ) : (
            weekDays.map((day) => {
              const slots = scheduleByDay[day] || [];
              const isWorking = slots.length > 0;
              return (
                <View key={day} style={styles.scheduleRow}>
                  <Text style={[styles.dayName, isWorking && styles.dayNameActive]}>
                    {day}
                  </Text>
                  <Text style={[styles.daySlots, isWorking ? styles.daySlotsActive : styles.daySlotsOff]}>
                    {isWorking ? slots.join(' • ') : 'Nghỉ'}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* NÚT */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('Sửa bác sĩ', { doctorId })}
          >
            <Icon name="pencil" size={22} color="#fff" />
            <Text style={styles.editButtonText}>Sửa thông tin</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Icon name="trash" size={22} color="#fff" />
            <Text style={styles.deleteButtonText}>Xóa bác sĩ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}