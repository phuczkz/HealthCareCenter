// src/screens/doctor/ProfileScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../api/supabase';
import theme from '../../theme/theme';

const {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  FONT_SIZE,
  FONT_WEIGHT,
} = theme;

export default function ProfileScreen() {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departmentName, setDepartmentName] = useState('Đang tải...');

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('doctors')
        .select('*, departments!department_id (name)')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setDoctor(data);
      setDepartmentName(data.departments?.name || 'Chưa xác định');
    } catch (err) {
      console.log('Lỗi tải hồ sơ:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <Text style={{ fontSize: 16, color: COLORS.textSecondary }}>Không tìm thấy hồ sơ bác sĩ</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }}>
        
        {/* HEADER NHỎ GỌN */}
        <LinearGradient colors={GRADIENTS.header} style={{ paddingTop: theme.headerPaddingTop, paddingBottom: SPACING.xl }}>
          <View style={{ alignItems: 'center' }}>
            {/* Avatar nhỏ gọn */}
            <View style={{
              width: 90,
              height: 90,
              borderRadius: 45,
              backgroundColor: '#fff',
              padding: 4,
              ...SHADOWS.small,
            }}>
              <View style={{
                width: '100%',
                height: '100%',
                borderRadius: 41,
                backgroundColor: COLORS.primaryLight + '50',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Ionicons name="person" size={44} color="#fff" />
              </View>
            </View>

            <Text style={{
              fontSize: FONT_SIZE.xxl,
              fontWeight: FONT_WEIGHT.bold,
              color: '#fff',
              marginTop: SPACING.sm,
            }}>
              BS. {doctor.name || 'Bác sĩ'}
            </Text>
            <Text style={{
              fontSize: FONT_SIZE.md,
              color: '#fff',
              opacity: 0.9,
              marginTop: 4,
            }}>
              {doctor.specialization || 'Chuyên khoa'}
            </Text>
          </View>
        </LinearGradient>

        <View style={{ marginTop: -30, paddingHorizontal: SPACING.xl }}>

          {/* CARD THÔNG TIN */}
          <View style={s.card}>
            <Text style={s.title}>Thông tin chuyên môn</Text>

            <View style={s.row}>
              <Ionicons name="business-outline" size={20} color={COLORS.primary} />
              <View style={{ marginLeft: SPACING.lg }}>
                <Text style={s.label}>Khoa</Text>
                <Text style={s.value}>{departmentName}</Text>
              </View>
            </View>

            <View style={s.row}>
              <Ionicons name="medkit-outline" size={20} color={COLORS.primary} />
              <View style={{ marginLeft: SPACING.lg }}>
                <Text style={s.label}>Chuyên môn</Text>
                <Text style={s.value}>{doctor.specialization || '—'}</Text>
              </View>
            </View>

            <View style={s.row}>
              <Ionicons name="time-outline" size={20} color={COLORS.primary} />
              <View style={{ marginLeft: SPACING.lg }}>
                <Text style={s.label}>Kinh nghiệm</Text>
                <Text style={s.value}>
                  {doctor.experience_years ? `${doctor.experience_years} năm` : '—'}
                </Text>
              </View>
            </View>

            <View style={s.row}>
              <Ionicons name="home-outline" size={20} color={COLORS.primary} />
              <View style={{ marginLeft: SPACING.lg }}>
                <Text style={s.label}>Phòng khám</Text>
                <Text style={s.value}>{doctor.room_number || '—'}</Text>
              </View>
            </View>

            <View style={s.row}>
              <Ionicons name="people-outline" size={20} color={COLORS.primary} />
              <View style={{ marginLeft: SPACING.lg }}>
                <Text style={s.label}>BN tối đa/lượt</Text>
                <Text style={s.value}>{doctor.max_patients_per_slot || 5}</Text>
              </View>
            </View>
          </View>

          {/* BIO */}
          {doctor.bio && (
            <View style={s.card}>
              <Text style={s.title}>Giới thiệu</Text>
              <Text style={{ fontSize: FONT_SIZE.md, color: COLORS.textSecondary, lineHeight: 22 }}>
                {doctor.bio}
              </Text>
            </View>
          )}

          {/* NÚT CHỈNH SỬA */}
          <TouchableOpacity style={s.editBtn}>
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            <Text style={s.editText}>Chỉnh sửa hồ sơ</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </>
  );
}

// STYLE NHỎ GỌN, SẠCH SẼ, ĐẸP TUYỆT ĐỐI
const s = {
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  value: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  editText: {
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
  },
};