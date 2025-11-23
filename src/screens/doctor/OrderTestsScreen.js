import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../api/supabase';

export default function OrderTestsScreen({ route, navigation }) {
  const { appointmentId, patientId, patientName } = route.params || {};

  const [initialNote, setInitialNote] = useState('');
  const [selectedTests, setSelectedTests] = useState([]);
  const [customTest, setCustomTest] = useState('');

  const commonTests = [
    'Công thức máu', 'Đường huyết', 'Chức năng gan', 'Chức năng thận',
    'CRP', 'Nước tiểu', 'Siêu âm bụng', 'X-Quang ngực', 'Điện tâm đồ',
    'HBsAg', 'Anti-HCV', 'HIV', 'Siêu âm tuyến giáp'
  ];

  const toggleTest = (test) => {
    console.log('Toggle xét nghiệm:', test);
    setSelectedTests(prev =>
      prev.includes(test) ? prev.filter(t => t !== test) : [...prev, test]
    );
  };

  const addCustomTest = () => {
    const name = customTest.trim();
    if (name && !selectedTests.includes(name)) {
      console.log('Thêm xét nghiệm tùy chỉnh:', name);
      setSelectedTests(prev => [...prev, name]);
      setCustomTest('');
    }
  };

  const sendTests = async () => {
    if (selectedTests.length === 0) {
      return Alert.alert('Chưa chọn', 'Vui lòng chọn ít nhất 1 xét nghiệm');
    }

    console.log('Bắt đầu gửi chỉ định xét nghiệm...');
    console.log('Số lượng xét nghiệm:', selectedTests.length);
    console.log('Danh sách:', selectedTests);
    console.log('Appointment ID:', appointmentId);

    try {
      console.log('1. Tạo bệnh án tạm (chờ kết quả cận lâm sàng)...');
      const { data: record, error: recordError } = await supabase
        .from('medical_records')
        .insert({
          patient_id: patientId,
          appointment_id: appointmentId,
          diagnosis: 'Đang chờ kết quả xét nghiệm cận lâm sàng',
          notes: initialNote.trim() || null,
        })
        .select()
        .single();

      if (recordError) throw recordError;
      console.log('Tạo bệnh án tạm thành công, ID:', record.id);

      console.log('2. Gửi chỉ định', selectedTests.length, 'xét nghiệm...');
      const testPayload = selectedTests.map(name => ({
        patient_id: patientId,
        appointment_id: appointmentId,
        test_type: 'lab',
        test_name: name,
        status: 'pending',
      }));

      const { error: testError } = await supabase
        .from('test_results')
        .insert(testPayload);

      if (testError) throw testError;
      console.log('Gửi chỉ định xét nghiệm thành công');

      console.log('3. Cập nhật trạng thái lịch hẹn → waiting_results');
      const { error: aptError } = await supabase
        .from('appointments')
        .update({ status: 'waiting_results' })
        .eq('id', appointmentId);

      if (aptError) throw aptError;
      console.log('Cập nhật trạng thái lịch hẹn thành công');

      Alert.alert(
        'Thành công!',
        `Đã gửi chỉ định ${selectedTests.length} xét nghiệm.\nKhi có kết quả, bạn sẽ được thông báo để hoàn tất bệnh án.`,
        [{ text: 'OK', onPress: () => navigation.replace('DoctorAppointments') }]
      );
    } catch (err) {
      console.error('Lỗi khi gửi chỉ định xét nghiệm:', err);
      Alert.alert('Lỗi', err.message || 'Không thể gửi chỉ định');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />

      <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.header}>
        <Text style={styles.headerTitle}>Chỉ định xét nghiệm</Text>
        <Text style={styles.headerSubtitle}>
          Bệnh nhân: <Text style={{ fontWeight: 'bold' }}>{patientName}</Text>
        </Text>
      </LinearGradient>

      <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 20 }}>

        <View style={styles.card}>
          <Text style={styles.label}>Triệu chứng / Lý do khám</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Sốt cao, ho có đờm, mệt mỏi 5 ngày..."
            value={initialNote}
            onChangeText={setInitialNote}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Chọn xét nghiệm cần làm</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
            {commonTests.map(test => (
              <TouchableOpacity
                key={test}
                onPress={() => toggleTest(test)}
                style={[
                  styles.testButton,
                  selectedTests.includes(test) && styles.testButtonSelected
                ]}
              >
                <Text style={[
                  styles.testButtonText,
                  selectedTests.includes(test) && styles.testButtonTextSelected
                ]}>
                  {test}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <TextInput
              style={styles.input}
              placeholder="Nhập xét nghiệm khác..."
              value={customTest}
              onChangeText={setCustomTest}
              onSubmitEditing={addCustomTest}
            />
            <TouchableOpacity onPress={addCustomTest}>
              <Ionicons name="add-circle" size={48} color="#10B981" />
            </TouchableOpacity>
          </View>

          {selectedTests.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={styles.selectedTitle}>
                Đã chọn ({selectedTests.length} xét nghiệm)
              </Text>
              {selectedTests.map((test, i) => (
                <View key={i} style={styles.selectedItem}>
                  <Text style={styles.selectedText}>{i + 1}. {test}</Text>
                  <TouchableOpacity onPress={() => toggleTest(test)}>
                    <Ionicons name="close-circle" size={28} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity onPress={sendTests} style={{ marginVertical: 30 }}>
          <LinearGradient colors={['#10B981', '#059669']} style={styles.sendButton}>
            <Ionicons name="paper-plane" size={32} color="#fff" />
            <Text style={styles.sendButtonText}>GỬI CHỈ ĐỊNH XÉT NGHIỆM</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#DBEAFE',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    textAlignVertical: 'top',
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  testButton: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#E0E7FF',
  },
  testButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  testButtonText: {
    color: '#4338CA',
    fontWeight: '600',
    fontSize: 14,
  },
  testButtonTextSelected: {
    color: '#fff',
  },
  selectedTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  selectedText: {
    flex: 1,
    fontSize: 16,
    color: '#1E40AF',
    fontWeight: '600',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
};