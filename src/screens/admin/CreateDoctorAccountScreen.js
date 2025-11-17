// src/screens/admin/CreateDoctorAccountScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../api/supabase';
import { styles } from '../../styles/admin/CreateDoctorAccountStyles';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

export default function CreateDoctorAccountScreen() {
  const navigation = useNavigation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [maxPatients, setMaxPatients] = useState('5');
  const [bio, setBio] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [deptModalVisible, setDeptModalVisible] = useState(false);
  const [searchDept, setSearchDept] = useState('');
  const [filteredDepts, setFilteredDepts] = useState([]);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const modalAnim = useRef(new Animated.Value(300)).current;

  const inputRefs = {
    email: useRef(null),
    password: useRef(null),
    spec: useRef(null),
    exp: useRef(null),
    room: useRef(null),
    max: useRef(null),
    bio: useRef(null),
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      if (error) {
        Alert.alert('Lỗi', 'Không thể tải danh sách khoa.');
      } else {
        setDepartments(data || []);
        setFilteredDepts(data || []);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    const filtered = departments.filter((dep) =>
      dep.name.toLowerCase().includes(searchDept.toLowerCase())
    );
    setFilteredDepts(filtered);
  }, [searchDept, departments]);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (pwd) => pwd.length >= 6;

  const selectedDepartmentName = () => {
    const dep = departments.find((d) => String(d.id) === String(departmentId));
    return dep ? dep.name : 'Chọn khoa';
  };

  const handleNext = () => {
    if (!fullName.trim() || !email.trim() || !password || !departmentId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ các trường bắt buộc.');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Email sai', 'Vui lòng nhập đúng định dạng email.');
      return;
    }
    if (!isValidPassword(password)) {
      Alert.alert('Mật khẩu yếu', 'Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    navigation.navigate('Lịch làm việc', {
      doctorInfo: {
        fullName,
        email,
        password,
        specialization,
        experienceYears: experienceYears ? parseInt(experienceYears) : 0,
        roomNumber,
        maxPatients: maxPatients ? parseInt(maxPatients) : 5,
        bio,
        departmentId,
      },
    });
  };

  const openModal = () => {
    setDeptModalVisible(true);
    Animated.spring(modalAnim, {
      toValue: 0,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.spring(modalAnim, {
      toValue: 300,
      friction: 8,
      useNativeDriver: true,
    }).start(() => setDeptModalVisible(false));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* HEADER GRADIENT */}
      <LinearGradient colors={['#1E40AF', '#3B82F6']} style={styles.header}>
        <TouchableOpacity 
  style={styles.backButton} 
  onPress={() => navigation.goBack()}
  activeOpacity={0.7}
>
  <Icon name="arrow-back" size={24} color="#fff" />
</TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo tài khoản bác sĩ</Text>
        <Text style={styles.headerSubtitle}>Bước 1/2</Text>
      </LinearGradient>

      <Animated.ScrollView
        style={[styles.container, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          {/* INPUTS */}
          <InputField
            label="Họ và tên *"
            icon="person-outline"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nguyễn Văn A"
            returnKeyType="next"
            onSubmitEditing={() => inputRefs.email.current?.focus()}
          />

          <InputField
            ref={inputRefs.email}
            label="Email *"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="doctor@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => inputRefs.password.current?.focus()}
          />

          <InputField
            ref={inputRefs.password}
            label="Mật khẩu *"
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            returnKeyType="next"
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Khoa *</Text>
            <TouchableOpacity style={styles.dropdownButton} onPress={openModal}>
              <View style={styles.dropdownIcon}>
                <Icon name="business-outline" size={20} color="#fff" />
              </View>
              <Text style={styles.dropdownText}>{selectedDepartmentName()}</Text>
              <Icon name="chevron-down" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          <InputField
            ref={inputRefs.spec}
            label="Chuyên môn"
            icon="medkit-outline"
            value={specialization}
            onChangeText={setSpecialization}
            placeholder="Tim mạch, Nội khoa..."
          />

          <InputField
            ref={inputRefs.exp}
            label="Số năm kinh nghiệm"
            icon="time-outline"
            value={experienceYears}
            onChangeText={setExperienceYears}
            placeholder="5"
            keyboardType="numeric"
          />

          <InputField
            ref={inputRefs.room}
            label="Số phòng"
            icon="home-outline"
            value={roomNumber}
            onChangeText={setRoomNumber}
            placeholder="202"
          />

          <InputField
            ref={inputRefs.max}
            label="Số bệnh nhân/ca"
            icon="people-outline"
            value={maxPatients}
            onChangeText={setMaxPatients}
            placeholder="5"
            keyboardType="numeric"
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tiểu sử</Text>
            <View style={styles.textAreaWrapper}>
              <View style={styles.textAreaIcon}>
                <Icon name="document-text-outline" size={20} color="#fff" />
              </View>
              <TextInput
                ref={inputRefs.bio}
                style={styles.textArea}
                placeholder="Giới thiệu ngắn gọn..."
                value={bio}
                onChangeText={setBio}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* NÚT TIẾP TỤC */}
          <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.primaryButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryButtonText}>
                Tiếp tục → Chọn lịch làm việc
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.ScrollView>

      {/* MODAL */}
      <Modal visible={deptModalVisible} animationType="none" transparent>
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: modalAnim }] },
          ]}
        >
          <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn khoa</Text>
            <TouchableOpacity onPress={closeModal}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm khoa..."
            value={searchDept}
            onChangeText={setSearchDept}
            placeholderTextColor="#94A3B8"
          />
          <ScrollView style={{ maxHeight: 400 }}>
            {filteredDepts.map((dept) => (
              <TouchableOpacity
                key={dept.id}
                style={styles.modalItem}
                onPress={() => {
                  setDepartmentId(String(dept.id));
                  closeModal();
                  setSearchDept('');
                }}
              >
                <Text style={styles.modalItemText}>{dept.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// COMPONENT INPUT ĐẸP
const InputField = React.forwardRef(({ label, icon, ...props }, ref) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <View style={styles.inputIconWrapper}>
        <Icon name={icon} size={20} color="#fff" />
      </View>
      <TextInput
        ref={ref}
        style={styles.input}
        placeholderTextColor="#94A3B8"
        {...props}
      />
    </View>
  </View>
));