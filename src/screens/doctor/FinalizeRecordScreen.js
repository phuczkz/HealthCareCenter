// screens/doctor/FinalizeRecordScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../api/supabase';

export default function FinalizeRecordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { appointmentId, patientId, patientName = 'Bệnh nhân' } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');        // ← CHẨN ĐOÁN CHÍNH THỨC
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');

  // Kết quả xét nghiệm
  const [testResults, setTestResults] = useState([]);

  // Đơn thuốc
  const [medicines, setMedicines] = useState([
    { id: Date.now(), name: '', dosage: '', duration: '', query: '', suggestions: [], show: false }
  ]);
  const [allMedicines, setAllMedicines] = useState([]);

  useEffect(() => {
    fetchTestResults();
    fetchMedicines();
  }, []);

  // 1. LẤY KẾT QUẢ XÉT NGHIỆM
  const fetchTestResults = async () => {
    try {
      const { data } = await supabase
        .from('test_results')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false });

      setTestResults(data || []);
    } catch (err) {
      console.log('Lỗi tải kết quả:', err);
    }
  };

  // 2. TẢI DANH MỤC THUỐC
  const fetchMedicines = async () => {
    try {
      const { data } = await supabase
        .from('medicines')
        .select('name, generic_name, dosage, form')
        .order('name');
      setAllMedicines(data || []);
    } catch (err) {
      console.log('Lỗi tải thuốc:', err);
    }
  };

  // TÌM + CHỌN THUỐC
  const searchMedicine = (text, index) => {
    if (!text.trim()) {
      updateMedicine(index, 'suggestions', []);
      updateMedicine(index, 'show', false);
      return;
    }
    const filtered = allMedicines
      .filter(m => m.name.toLowerCase().includes(text.toLowerCase()) || 
                  (m.generic_name && m.generic_name.toLowerCase().includes(text.toLowerCase())))
      .slice(0, 6);
    updateMedicine(index, 'suggestions', filtered);
    updateMedicine(index, 'show', true);
  };

  const selectMedicine = (med, index) => {
    updateMedicine(index, 'name', med.name);
    updateMedicine(index, 'dosage', med.dosage || '1 viên/lần x 3 lần/ngày');
    updateMedicine(index, 'query', med.name);
    updateMedicine(index, 'suggestions', []);
    updateMedicine(index, 'show', false);
  };

  const updateMedicine = (index, field, value) => {
    setMedicines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addMedicine = () => setMedicines(prev => [...prev, {
    id: Date.now(), name: '', dosage: '', duration: '', query: '', suggestions: [], show: false
  }]);

  const removeMedicine = (index) => {
    if (medicines.length > 1) setMedicines(prev => prev.filter((_, i) => i !== index));
  };

  // LƯU HOÀN TẤT BỆNH ÁN
  const finalizeRecord = async () => {
    if (!diagnosis.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập chẩn đoán chính thức');

    setLoading(true);
    try {
      // 1. Lấy medical_record đã tạo tạm trước đó
      const { data: record, error: findErr } = await supabase
        .from('medical_records')
        .select('id')
        .eq('appointment_id', appointmentId)
        .single();

      if (findErr || !record) throw new Error('Không tìm thấy bệnh án');

      // 2. Cập nhật chẩn đoán + treatment + notes
      await supabase
        .from('medical_records')
        .update({
          diagnosis: diagnosis.trim(),
          treatment: treatment.trim() || null,
          notes: notes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', record.id);

      // 3. Lưu đơn thuốc
      const validMeds = medicines.filter(m => m.name.trim());
      if (validMeds.length > 0) {
        await supabase.from('prescriptions').insert(
          validMeds.map(m => ({
            record_id: record.id,
            medicine_name: m.name,
            dosage: m.dosage?.trim() || null,
            duration: m.duration?.trim() || null,
          }))
        );
      }

      // 4. Đánh dấu lịch hẹn HOÀN TẤT
      await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);

      Alert.alert(
        'HOÀN TẤT!',
        'Bệnh án đã được hoàn thiện và gửi cho bệnh nhân',
        [{ text: 'OK', onPress: () => navigation.replace('DoctorMain') }]
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', err.message || 'Không thể hoàn tất bệnh án');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />

      {/* HEADER */}
      <LinearGradient colors={['#DC2626', '#B91C1C']} style={{ paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', marginLeft: 16 }}>
            Hoàn tất bệnh án
          </Text>
        </View>
        <Text style={{ color: '#FECACA', fontSize: 16, marginTop: 8 }}>
          Bệnh nhân: <Text style={{ fontWeight: 'bold' }}>{patientName}</Text>
        </Text>
      </LinearGradient>

      <ScrollView style={{ flex: 1, backgroundColor: '#FEF2F2' }} contentContainerStyle={{ padding: 20 }}>

        {/* KẾT QUẢ XÉT NGHIỆM – BẮT BUỘC PHẢI XEM TRƯỚC */}
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Kết quả xét nghiệm ({testResults.length})</Text>
          {testResults.length === 0 ? (
            <Text style={{ color: '#92400E', fontStyle: 'italic' }}>Chưa có kết quả</Text>
          ) : (
            testResults.map((t, i) => (
              <View key={t.id} style={{ marginBottom: 14 }}>
                <Text style={{
                  fontWeight: 'bold',
                  color: t.status === 'abnormal' || t.status === 'critical' ? '#DC2626' : '#16A34A',
                  fontSize: 16,
                }}>
                  {i + 1}. {t.test_name}
                  {t.status === 'abnormal' && ' ← BẤT THƯỜNG'}
                  {t.status === 'critical' && ' ← NGUY HIỂM'}
                </Text>
                {t.result_value && (
                  <Text style={{ color: '#475569', marginTop: 4 }}>
                    → {t.result_value} {t.unit} 
                    {t.reference_range && ` (Bình thường: ${t.reference_range})`}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* CHẨN ĐOÁN CHÍNH THỨC */}
        <View style={styles.card}>
          <Text style={styles.label}>Chẩn đoán chính thức <Text style={{ color: '#DC2626' }}>*</Text></Text>
          <TextInput
            style={styles.textArea}
            placeholder="Viêm phổi cộng đồng, Đái tháo đường type 2..."
            value={diagnosis}
            onChangeText={setDiagnosis}
            multiline
          />
        </View>

        {/* ĐƠN THUỐC */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={styles.label}>Đơn thuốc</Text>
            <TouchableOpacity onPress={addMedicine}>
              <Ionicons name="add-circle" size={40} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          {medicines.map((med, i) => (
            <View key={med.id} style={{ marginBottom: 20 }}>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 12 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 16 }}
                  placeholder="Tìm tên thuốc..."
                  value={med.query}
                  onChangeText={t => { updateMedicine(i, 'query', t); searchMedicine(t, i); }}
                />
                {medicines.length > 1 && (
                  <TouchableOpacity onPress={() => removeMedicine(i)}>
                    <Ionicons name="close-circle" size={28} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              {med.show && med.suggestions.length > 0 && (
                <View style={styles.suggestions}>
                  {med.suggestions.map((s, idx) => (
                    <TouchableOpacity key={idx} style={styles.suggestion} onPress={() => selectMedicine(s, i)}>
                      <Text style={{ fontWeight: 'bold' }}>{s.name}</Text>
                      <Text style={{ fontSize: 13, color: '#64748B' }}>{s.generic_name || s.dosage}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <TextInput style={styles.input} placeholder="Liều lượng" value={med.dosage} onChangeText={t => updateMedicine(i, 'dosage', t)} />
                <TextInput style={styles.input} placeholder="Thời gian dùng" value={med.duration} onChangeText={t => updateMedicine(i, 'duration', t)} />
              </View>
            </View>
          ))}
        </View>

        {/* DẶN DÒ */}
        <View style={styles.card}>
          <Text style={styles.label}>Dặn dò / Hướng dẫn điều trị</Text>
          <TextInput style={styles.textArea} placeholder="Uống nhiều nước, tái khám sau 5 ngày..." value={treatment} onChangeText={setTreatment} multiline />
        </View>

        {/* NÚT HOÀN TẤT BỆNH ÁN */}
        <TouchableOpacity onPress={finalizeRecord} disabled={loading} style={{ marginVertical: 30 }}>
          <LinearGradient colors={loading ? ['#94A3B8', '#64748B'] : ['#7C2D12', '#4C1D0A']} style={styles.finalBtn}>
            {loading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <>
                <Ionicons name="document-text" size={32} color="#fff" />
                <Text style={styles.finalText}>HOÀN TẤT BỆNH ÁN</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// STYLE ĐẸP NHƯ BỆNH VIỆN QUỐC TẾ
const styles = {
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 },
  resultCard: { backgroundColor: '#FFF7ED', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 2, borderColor: '#F97316' },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#C2410C', marginBottom: 12 },
  label: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  textArea: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, fontSize: 16, minHeight: 100, textAlignVertical: 'top', borderWidth: 1.5, borderColor: '#E2E8F0' },
  input: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, fontSize: 16, borderWidth: 1.5, borderColor: '#E2E8F0' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#E2E8F0' },
  suggestions: { backgroundColor: '#fff', borderRadius: 16, marginTop: 8, maxHeight: 200, borderWidth: 1, borderColor: '#E2E8F0' },
  suggestion: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  finalBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 20, borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 15 },
  finalText: { color: '#fff', fontSize: 22, fontWeight: 'bold', letterSpacing: 1.5 },
};