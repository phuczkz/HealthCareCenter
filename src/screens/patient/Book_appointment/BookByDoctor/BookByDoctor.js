import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../../../api/supabase';

const Colors = {
  primary: '#1D4ED8',
  secondary: '#38BDF8',
  textPrimary: '#1E293B',
  textSecondary: '#4B5563',
  bg: '#F8FAFC',
  success: '#10B981',
  warning: '#F59E0B',
};

const DAYS = [
  'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'
];

const TIME_SLOTS = [
  'Sáng (07:00 - 12:00)',
  'Chiều (13:00 - 17:00)',
  'Tối (17:00 - 21:00)'
];

export default function BookByDoctor() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  // FILTER STATES
  const [selectedDept, setSelectedDept] = useState(null); // { id, name }
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  // MODAL
  const [deptModal, setDeptModal] = useState(false);
  const [dayModal, setDayModal] = useState(false);
  const [timeModal, setTimeModal] = useState(false);

  const [departments, setDepartments] = useState([]);

  // LẤY DANH SÁCH KHOA
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      if (error) throw error;
      setDepartments([{ id: null, name: 'Tất cả khoa' }, ...data]);
    } catch (err) {
      console.error('Lỗi lấy khoa:', err);
    }
  };

  // TÌM KIẾM + LỌC
  const searchDoctors = async () => {
    const keyword = query.trim();
    if (!keyword && !selectedDept?.id && !selectedDay && !selectedTime) {
      setDoctors([]);
      return;
    }

    setLoading(true);
    try {
      let q = supabase
        .from('doctors')
        .select(`
          id,
          specialization,
          room_number,
          experience_years,
          department_id,
          departments!inner(name),
          user_profiles!inner(full_name, gender, avatar_url),
          doctor_schedule_template (day_of_week, start_time, end_time)
        `);

      if (keyword) {
        q = q.ilike('user_profiles.full_name', `%${keyword}%`);
      }

      if (selectedDept?.id) {
        q = q.eq('department_id', selectedDept.id); // DÙNG .id
      }

      const { data, error } = await q.order('full_name', {
        foreignTable: 'user_profiles',
        ascending: true,
      });

      if (error) throw error;

      if (!Array.isArray(data) || data.length === 0) {
        setDoctors([]);
        setLoading(false);
        return;
      }

      const grouped = {};

      data.forEach(doc => {
        if (!doc || typeof doc !== 'object') return;
        if (!doc.id) return;
        if (!doc.user_profiles || !doc.departments) return;

        const id = doc.id;
        if (!grouped[id]) {
          grouped[id] = {
            id: doc.id,
            user_profiles: doc.user_profiles,
            departments: doc.departments,
            specialization: doc.specialization || '',
            room_number: doc.room_number || '',
            department_id: doc.department_id,
            department_name: doc.departments.name || 'Chưa có khoa',
            schedules: [],
          };
        }

        const raw = doc.doctor_schedule_template;
        const templates = Array.isArray(raw)
          ? raw
          : raw == null
            ? []
            : [raw];

        templates.forEach(t => {
          if (
            !t ||
            typeof t !== 'object' ||
            !t.start_time ||
            !t.end_time ||
            !t.day_of_week ||
            t.end_time <= t.start_time
          ) {
            return;
          }

          const start = t.start_time.slice(0, 5);
          const session = start < '12:00' ? 'Sáng' : start < '17:00' ? 'Chiều' : 'Tối';
          const dayText = `${session} ${t.day_of_week}`;

          if (selectedDay && !dayText.includes(selectedDay)) return;

          if (selectedTime) {
            const timeMap = {
              'Sáng (07:00 - 12:00)': 'Sáng',
              'Chiều (13:00 - 17:00)': 'Chiều',
              'Tối (17:00 - 21:00)': 'Tối',
            };
            const sessionKey = timeMap[selectedTime];
            if (!sessionKey || !dayText.includes(sessionKey)) return;
          }

          const fullSession = `${session} ${t.day_of_week}`;
          if (!grouped[id].schedules.includes(fullSession)) {
            grouped[id].schedules.push(fullSession);
          }
        });
      });

      const result = Object.values(grouped).filter(d => d.schedules.length > 0);
      setDoctors(result);
    } catch (err) {
      console.error('Lỗi tìm bác sĩ:', err);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  // GỌI LẠI TÌM KIẾM KHI CÓ THAY ĐỔI FILTER – ĐÃ SỬA
  useEffect(() => {
    const timeout = setTimeout(() => {
      searchDoctors();
    }, 300); // Debounce để tránh gọi liên tục

    return () => clearTimeout(timeout);
  }, [query, selectedDept, selectedDay, selectedTime]);

  // RENDER DOCTOR CARD
  const renderDoctor = ({ item }) => {
    const profile = item.user_profiles || {};
    const dept = item.departments || {};
    const hasAvatar = profile.avatar_url;

    return (
      <View style={styles.doctorCard}>
        <View style={styles.header}>
          {hasAvatar ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>
                {profile.full_name?.charAt(0).toUpperCase() || 'B'}
              </Text>
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.name}>{profile.full_name || 'Bác sĩ'}</Text>
            <Text style={styles.gender}>
              Giới tính {profile.gender === 'male' ? 'Nam' : 'Nữ'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.details}>
          <View style={styles.row}>
            <Text style={styles.label}>Chuyên khoa</Text>
            <Text style={styles.value}>{dept.name || 'Chưa có'}</Text>
            <TouchableOpacity style={styles.infoIcon}>
              <Ionicons name="information-circle" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Giá khám</Text>
            <Text style={styles.price}>150.000đ</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Buổi khám</Text>
            <View style={styles.sessions}>
              {item.schedules.map((s, i) => (
                <Text key={i} style={styles.session}>{s}</Text>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => {
            const doctorData = {
              id: item.id,
              name: profile.full_name || 'Bác sĩ',
              room_number: item.room_number || '',
              specialization: item.specialization || '',
              avatar_url: profile.avatar_url || null,
              department_id: item.department_id,
              department_name: item.department_name,
            };

            console.log('========== BOOK BY DOCTOR ==========');
            console.log('Chuyển sang SelectDate với doctor:', doctorData);
            console.log('=====================================');

            navigation.navigate('SelectDate', { doctor: doctorData });
          }}
        >
          <Text style={styles.selectButtonText}>Chọn</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Chọn bác sĩ</Text>
        <TouchableOpacity>
          <Ionicons name="home-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          placeholder="Tìm kiếm bác sĩ..."
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
      </View>

      {/* FILTERS */}
      <View style={styles.filters}>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setDeptModal(true)}>
          <Text style={styles.filterText}>
            {selectedDept?.name || 'Chọn chuyên khoa'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterBtn} onPress={() => setDayModal(true)}>
          <Text style={styles.filterText}>
            {selectedDay || 'Chọn thứ'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterBtn} onPress={() => setTimeModal(true)}>
          <Text style={styles.filterText}>
            {selectedTime || 'Chọn giờ'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* HINT */}
      <View style={styles.hint}>
        <Ionicons name="information-circle" size={16} color={Colors.primary} />
        <Text style={styles.hintText}>Nhấn vào để xem chức năng chuyên khoa</Text>
      </View>

      {/* LIST */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDoctor}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>
                {query || selectedDept || selectedDay || selectedTime
                  ? 'Không tìm thấy bác sĩ nào.'
                  : 'Nhập tên hoặc chọn lọc.'}
              </Text>
            </View>
          }
        />
      )}

      {/* MODAL CHỌN KHOA – ĐÃ SỬA */}
      <Modal visible={deptModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn chuyên khoa</Text>
              <TouchableOpacity onPress={() => setDeptModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={departments}
              keyExtractor={(item) => item.id?.toString() || 'all'}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedDept(item); // TRUYỀN OBJECT { id, name }
                    setDeptModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {selectedDept?.id === item.id && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL CHỌN THỨ */}
      <Modal visible={dayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn thứ</Text>
              <TouchableOpacity onPress={() => setDayModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={DAYS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedDay(item);
                    setDayModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {selectedDay === item && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL CHỌN GIỜ */}
      <Modal visible={timeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn buổi</Text>
              <TouchableOpacity onPress={() => setTimeModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={TIME_SLOTS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedTime(item);
                    setTimeModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {selectedTime === item && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// === STYLES (giữ nguyên) ===
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16 },
  filters: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterText: { fontSize: 14, color: '#4B5563' },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  hintText: { marginLeft: 6, fontSize: 13, color: Colors.primary },
  list: { padding: 16, paddingTop: 8 },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, marginRight: 12 },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  gender: { fontSize: 14, color: '#059669', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  details: { gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, color: Colors.textSecondary },
  value: { fontSize: 15, color: Colors.textPrimary, fontWeight: '600', flex: 1, textAlign: 'right', marginRight: 8 },
  price: { fontSize: 16, color: '#DC2626', fontWeight: '700' },
  infoIcon: { padding: 4 },
  sessions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1, justifyContent: 'flex-end' },
  session: { fontSize: 14, color: '#16A34A', backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  selectButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#6B7280', textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemText: { fontSize: 16, color: Colors.textPrimary },
});