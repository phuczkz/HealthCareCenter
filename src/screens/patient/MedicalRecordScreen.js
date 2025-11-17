// src/screens/patient/MedicalRecordScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  Linking,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../api/supabase';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const Colors = {
  primary: '#1D4ED8',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  muted: '#64748B',
};

export default function MedicalRecordScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('records'); // 'records' | 'tests'
  const [records, setRecords] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (activeTab === 'records') {
        const { data } = await supabase
          .from('medical_records')
          .select(`
            *,
            doctor:user_profiles(full_name),
            appointments!appointment_id(date)
          `)
          .eq('patient_id', user.id)
          .order('created_at', { ascending: false });
        setRecords(data || []);
      } else {
        const { data } = await supabase
          .from('test_results')
          .select('*')
          .eq('patient_id', user.id)
          .order('performed_at', { ascending: false, nullsLast: true });
        setTests(data || []);
      }
    } catch (err) {
      console.error('Lỗi tải bệnh án:', err);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const openFile = async (url, filename = 'ket_qua.pdf') => {
    if (!url) return;
    try {
      if (url.toLowerCase().includes('.pdf')) {
        Linking.openURL(url);
      } else {
        const result = await FileSystem.downloadAsync(url, FileSystem.documentDirectory + filename);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(result.uri);
        }
      }
    } catch (e) {
      console.log('Lỗi mở file:', e);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải bệnh án...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={[Colors.primary, '#2563EB']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Bệnh án điện tử</Text>
        <View style={{ width: 44 }} />
      </LinearGradient>

      {/* TABS */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'records' && styles.tabActive]}
          onPress={() => setActiveTab('records')}
        >
          <Ionicons name="document-text" size={20} color={activeTab === 'records' ? '#FFF' : Colors.muted} />
          <Text style={[styles.tabText, activeTab === 'records' && styles.tabTextActive]}>
            Bệnh án ({records.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tests' && styles.tabActive]}
          onPress={() => setActiveTab('tests')}
        >
          <Ionicons name="flask" size={20} color={activeTab === 'tests' ? '#FFF' : Colors.muted} />
          <Text style={[styles.tabText, activeTab === 'tests' && styles.tabTextActive]}>
            Cận lâm sàng ({tests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      {activeTab === 'records' ? (
        <FlatList
          data={records}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có bệnh án nào</Text>}
          renderItem={({ item }) => (
            <Animated.View entering={FadeInDown.duration(400)}>
              <View style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordDate}>
                    {new Date(item.created_at).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </Text>
                  <Ionicons name="person-circle" size={28} color={Colors.primary} />
                </View>
                <Text style={styles.doctorName}>BS. {item.doctor?.full_name || 'Không xác định'}</Text>
                {item.diagnosis && (
                  <>
                    <Text style={styles.label}>Chẩn đoán</Text>
                    <Text style={styles.value}>{item.diagnosis}</Text>
                  </>
                )}
                {item.prescription && (
                  <>
                    <Text style={styles.label}>Đơn thuốc</Text>
                    <Text style={styles.value}>{item.prescription}</Text>
                  </>
                )}
                {item.notes && (
                  <>
                    <Text style={styles.label}>Ghi chú</Text>
                    <Text style={styles.value}>{item.notes}</Text>
                  </>
                )}
              </View>
            </Animated.View>
          )}
        />
      ) : (
        <FlatList
          data={tests}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có kết quả cận lâm sàng</Text>}
          renderItem={({ item }) => (
            <Animated.View entering={FadeInDown.duration(400)}>
              <TouchableOpacity
                style={[styles.testCard, item.status === 'abnormal' && styles.testCardAbnormal]}
                onPress={() => item.file_url && openFile(item.file_url, `${item.test_name}.pdf`)}
              >
                <View style={styles.testHeader}>
                  <Text style={styles.testName}>{item.test_name}</Text>
                  <Ionicons
                    name={item.status === 'abnormal' ? 'warning' : item.status === 'critical' ? 'alert-circle' : 'checkmark-circle'}
                    size={28}
                    color={item.status === 'abnormal' ? Colors.warning : item.status === 'critical' ? Colors.danger : Colors.success}
                  />
                </View>
                <Text style={styles.testValue}>
                  {item.result_value} {item.unit}
                  {item.reference_range && <Text style={styles.ref}> (Bình thường: {item.reference_range})</Text>}
                </Text>
                {item.file_url && (
                  <View style={styles.fileBadge}>
                    <Ionicons name="document-attach" size={18} color={Colors.primary} />
                    <Text style={styles.fileText}>Xem file kết quả</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      )}
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
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    margin: 16,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 15, fontWeight: '700', color: Colors.muted },
  tabTextActive: { color: '#FFF' },

  recordCard: { backgroundColor: '#FFF', marginHorizontal: 16, marginBottom: 12, padding: 18, borderRadius: 20, elevation: 4 },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  recordDate: { fontSize: 15, fontWeight: '600', color: Colors.warning },
  doctorName: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  label: { fontSize: 14, color: Colors.muted, marginTop: 12, fontWeight: '600' },
  value: { fontSize: 16, color: Colors.text, marginTop: 4, lineHeight: 22 },

  testCard: { backgroundColor: '#FFF', marginHorizontal: 16, marginBottom: 12, padding: 18, borderRadius: 20, elevation: 4 },
  testCardAbnormal: { borderLeftWidth: 5, borderLeftColor: Colors.warning },
  testHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  testName: { fontSize: 17, fontWeight: '700', color: Colors.text },
  testValue: { marginTop: 8, fontSize: 15, color: Colors.muted },
  ref: { fontSize: 13, color: '#94A3B8' },
  fileBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: '#EFF6FF', padding: 10, borderRadius: 12, alignSelf: 'flex-start' },
  fileText: { marginLeft: 8, color: Colors.primary, fontWeight: '600' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  loadingText: { marginTop: 16, fontSize: 16, color: Colors.text },
  empty: { textAlign: 'center', marginTop: 60, fontSize: 17, color: Colors.muted, fontWeight: '500' },
});