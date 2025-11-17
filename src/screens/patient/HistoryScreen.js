// src/screens/patient/HistoryScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import AppointmentCard from '../../components/AppointmentCard';
import { AppointmentController } from '../../controllers/patient/AppointmentController';

const Colors = {
  primary: '#1D4ED8',
  secondary: '#38BDF8',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  muted: '#94A3B8',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
};

const TABS = [
  { key: 'confirmed', title: 'Đã đồng ý',   icon: 'checkmark-circle', color: Colors.success },
  { key: 'pending',   title: 'Chưa phản hồi', icon: 'time',          color: Colors.warning },
  { key: 'cancelled', title: 'Đã hủy',      icon: 'close-circle',   color: Colors.danger  },
];

export default function HistoryScreen() {
  const navigation = useNavigation();

  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('confirmed');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // LẤY DỮ LIỆU – ĐÃ FIX LỖI CALLBACK
  const fetchAppointments = useCallback(() => {
    AppointmentController.loadAppointments(
      setAppointments,   // ← truyền đúng hàm setter
      setLoading,
      setError
    );
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    AppointmentController.loadAppointments(setAppointments, setLoading, setError)
      .finally(() => setRefreshing(false));
  }, []);

  // LỌC THEO TAB
  const filteredAppointments = appointments.filter(app => {
    if (activeTab === 'confirmed') return app.status === 'confirmed';
    if (activeTab === 'pending')   return app.status === 'pending';
    return ['cancelled', 'doctor_cancelled', 'patient_cancelled'].includes(app.status);
  });

  const handleCancel = async (id) => {
    Alert.alert(
      'Hủy lịch khám',
      'Bạn có chắc chắn muốn hủy lịch này?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy lịch',
          style: 'destructive',
          onPress: async () => {
            const result = await AppointmentController.cancelAppointment(
              id,
              setAppointments,
              setError,
              'patient'
            );
            if (result.success) {
              Alert.alert('Thành công', result.message);
            } else {
              Alert.alert('Lỗi', result.message);
            }
          },
        },
      ]
    );
  };

  // TAB ITEM
  const renderTab = ({ item }) => {
    const count = appointments.filter(app => {
      if (item.key === 'confirmed') return app.status === 'confirmed';
      if (item.key === 'pending')   return app.status === 'pending';
      return ['cancelled', 'doctor_cancelled', 'patient_cancelled'].includes(app.status);
    }).length;

    const isActive = activeTab === item.key;

    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.tabActive]}
        onPress={() => setActiveTab(item.key)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isActive ? [item.color, item.color + 'dd'] : ['#E2E8F0', '#F1F5F9']}
          style={styles.tabGradient}
        >
          <Ionicons name={item.icon} size={22} color={isActive ? '#FFF' : item.color} />
          <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
            {item.title}
          </Text>
          {count > 0 && (
            <View style={[styles.badge, { backgroundColor: isActive ? '#FFF' : item.color }]}>
              <Text style={[styles.badgeText, isActive && { color: item.color }]}>
                {count}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
      </View>
    );
  }

  return (
    <View style={styles.background}>
      {/* HEADER */}
      <Animated.View entering={FadeInDown.duration(500)}>
        <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Lịch sử đặt lịch</Text>
          <TouchableOpacity style={styles.iconButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color="#FFF" />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      {/* TABS */}
      <View style={styles.tabContainer}>
        <FlatList
          data={TABS}
          renderItem={renderTab}
          keyExtractor={item => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        />
      </View>

      {/* NỘI DUNG */}
      <View style={styles.container}>
        {filteredAppointments.length === 0 ? (
          <Animated.View entering={ZoomIn.duration(500)} style={styles.empty}>
            <Ionicons name="calendar-outline" size={80} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Chưa có lịch hẹn</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'confirmed' && 'Bạn chưa có lịch nào được duyệt'}
              {activeTab === 'pending' && 'Không có lịch đang chờ duyệt'}
              {activeTab === 'cancelled' && 'Bạn chưa hủy lịch nào'}
            </Text>
          </Animated.View>
        ) : (
          <FlatList
            data={filteredAppointments}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item, index }) => (
              <AppointmentCard item={item} index={index} onCancel={handleCancel} />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </View>
  );
}

// STYLES ĐẸP + BO TRÒN
const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF' },

  tabContainer: { paddingVertical: 16, backgroundColor: Colors.bg },
  tabButton: { borderRadius: 30, overflow: 'hidden', elevation: 4 },
  tabActive: { elevation: 10 },
  tabGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 10 },
  tabText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#FFF' },
  badge: { minWidth: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  badgeText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  loadingText: { marginTop: 12, fontSize: 16, color: Colors.textPrimary, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
});