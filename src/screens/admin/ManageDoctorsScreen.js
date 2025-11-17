// src/screens/admin/ManageDoctorsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../api/supabase';
import { getAllDoctorsService, deleteDoctorService } from '../../services/doctor/doctorService';
import { styles } from '../../styles/admin/ManageDoctorsStyles';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

export default function ManageDoctorsScreen() {
  const navigation = useNavigation();
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDoctors = async () => {
    try {
      const data = await getAllDoctorsService();
      setDoctors(data);
      setFilteredDoctors(data);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách bác sĩ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query === '') {
      setFilteredDoctors(doctors);
      return;
    }
    const filtered = doctors.filter(doc => {
      const fullName = doc.user_profiles?.full_name?.toLowerCase() || '';
      const deptName = doc.departments?.name?.toLowerCase() || '';
      const specialization = doc.specialization?.toLowerCase() || '';
      return fullName.includes(query) || deptName.includes(query) || specialization.includes(query);
    });
    setFilteredDoctors(filtered);
  }, [searchQuery, doctors]);

  const handleDelete = (doctorId, doctorName) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa bác sĩ **${doctorName}**?`,
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
                Alert.alert('Thành công', result.message, [{ text: 'OK', onPress: fetchDoctors }]);
              } else {
                Alert.alert('Lỗi', result.message);
              }
            } catch (error) {
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

  const renderDoctorItem = ({ item }) => {
    const fullName = item.user_profiles?.full_name || 'Không tên';
    const deptName = item.departments?.name || 'Chưa có khoa';
    const avatarLetter = fullName.charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.doctorCard}
        onPress={() => navigation.navigate('Chi tiết bác sĩ', { doctorId: item.id })}
      >
        <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.cardGradient}>
          <View style={styles.avatarContainer}>
            {item.user_profiles?.avatar_url ? (
              <Image source={{ uri: item.user_profiles.avatar_url }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.avatarGradient}>
                <Text style={styles.avatarText}>{avatarLetter}</Text>
              </LinearGradient>
            )}
          </View>

          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName} numberOfLines={1}>{fullName}</Text>
            <Text style={styles.doctorDept} numberOfLines={1}>{deptName}</Text>
            <View style={styles.detailRow}>
              <Icon name="medkit" size={14} color="#64748B" />
              <Text style={styles.doctorDetail} numberOfLines={1}>{item.specialization || 'Chưa cập nhật'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="home" size={14} color="#64748B" />
              <Text style={styles.doctorDetail} numberOfLines={1}>{item.room_number || 'Chưa có'}</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={(e) => {
                e.stopPropagation();
                navigation.navigate('Sửa bác sĩ', { doctorId: item.id });
              }}
            >
              <Icon name="pencil" size={20} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(item.id, fullName);
              }}
            >
              <Icon name="trash" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />

      {/* HEADER WITH BACK & HOME */}
      <LinearGradient colors={['#1E40AF', '#3B82F6']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh sách bác sĩ</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AdminHome')} style={styles.homeButton}>
          <Icon name="home" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          placeholder="Tìm bác sĩ..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Icon name="close-circle" size={22} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* LIST */}
      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id}
        renderItem={renderDoctorItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchDoctors} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có bác sĩ nào</Text>
          </View>
        }
      />
    </View>
  );
}