// src/screens/admin/AdminHomeScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../api/supabase';
import { useNavigation } from '@react-navigation/native';
import { styles } from '../../styles/admin/AdminHomeStyles';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function AdminHomeScreen() {
  const navigation = useNavigation();
  const [stats, setStats] = useState({
    doctors: 0,
    patients: 0,
    users: 0,
    appointments: 0,
  });
  const [loading, setLoading] = useState(true);

  // TẠO ĐỦ 9 Animated.Value (1 cho avatar, 8 cho menu)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.8)).current;
  const menuScales = useRef(Array.from({ length: 8 }, () => new Animated.Value(0.8))).current;

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [
        { count: doctorCount },
        { count: patientCount },
        { count: userCount },
        { count: appointmentCount },
      ] = await Promise.all([
        supabase.from('doctors').select('*', { count: 'exact', head: true }),
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).neq('status', 'cancelled'),
      ]);

      setStats({
        doctors: doctorCount || 0,
        patients: patientCount || 0,
        users: userCount || 0,
        appointments: appointmentCount || 0,
      });
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
      animateEntrance();
    }
  };

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(avatarScale, { toValue: 1, friction: 8, useNativeDriver: true }),
      ...menuScales.map((anim, i) =>
        Animated.spring(anim, {
          toValue: 1,
          friction: 8,
          delay: i * 80,
          useNativeDriver: true,
        })
      ),
    ]).start();
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const menuItems = [
    { title: 'Quản lý bác sĩ', icon: 'medkit', screen: 'Bác sĩ', gradient: ['#3B82F6', '#1D4ED8'] },
    { title: 'Quản lý bệnh nhân', icon: 'heart', screen: 'Bệnh nhân', gradient: ['#EC4899', '#BE185D'] },
    { title: 'Quản lý người dùng', icon: 'people', screen: 'Người dùng', gradient: ['#8B5CF6', '#6D28D9'] },
    { title: 'Tạo tài khoản', icon: 'person-add', screen: 'Tạo tài khoản', gradient: ['#F59E0B', '#D97706'] },
    { title: 'Tạo bác sĩ', icon: 'briefcase', screen: 'Tạo bác sĩ', gradient: ['#10B981', '#059669'] },
    { title: 'Lịch làm việc', icon: 'calendar', screen: 'Lịch làm việc', gradient: ['#6366F1', '#4F46E5'] },
    { title: 'Báo cáo', icon: 'bar-chart', screen: 'Báo cáo', gradient: ['#F97316', '#EA580C'] },
    { title: 'Quản trị hệ thống', icon: 'settings', screen: 'Quản trị', gradient: ['#64748B', '#475569'] },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />

      {/* HEADER */}
      <LinearGradient
        colors={['#1E40AF', '#2563EB', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Xin chào, Admin</Text>
            <Text style={styles.subtitle}>Quản lý hệ thống y tế</Text>
          </View>
          <Animated.View style={{ transform: [{ scale: avatarScale }] }}>
            <LinearGradient colors={['#60A5FA', '#3B82F6']} style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </LinearGradient>
          </Animated.View>
        </View>
      </LinearGradient>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        opacity={fadeAnim}
      >
        {/* STATS */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Bác sĩ', value: stats.doctors, icon: 'medkit', bg: ['#DBEAFE', '#BFDBFE'], color: '#3B82F6' },
            { label: 'Bệnh nhân', value: stats.patients, icon: 'heart', bg: ['#FCE7F3', '#FBCFE8'], color: '#EC4899' },
            { label: 'Người dùng', value: stats.users, icon: 'people', bg: ['#EDE9FE', '#DDD6FE'], color: '#8B5CF6' },
            { label: 'Lịch khám', value: stats.appointments, icon: 'calendar', bg: ['#D1FAE5', '#A7F3D0'], color: '#10B981' },
          ].map((item, i) => (
            <Animated.View
              key={i}
              style={[
                styles.statCardWrapper,
                { transform: [{ scale: menuScales[i] }] }
              ]}
            >
              <LinearGradient colors={item.bg} style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons name={item.icon} size={32} color={item.color} />
                </View>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </LinearGradient>
            </Animated.View>
          ))}
        </View>

        {/* MENU */}
        <Text style={styles.sectionTitle}>Chức năng quản lý</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <Animated.View style={{ transform: [{ scale: menuScales[i] }] }}>
                <LinearGradient
                  colors={item.gradient}
                  style={styles.menuGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.menuIconWrapper}>
                    <Ionicons name={item.icon} size={36} color="#fff" />
                  </View>
                  <Text style={styles.menuText}>{item.title}</Text>
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.ScrollView>
    </View>
  );
}