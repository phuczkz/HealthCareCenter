import { supabase } from '../../api/supabase';

export const DoctorAppointmentService = {
  async getDoctorId() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        throw new Error('Không thể lấy thông tin người dùng. Vui lòng kiểm tra đăng nhập.');
      }
      const userId = user.id;

      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('id', userId)
        .single();

      if (doctorError || !doctor) {
        throw new Error('Không tìm thấy thông tin bác sĩ. Vui lòng kiểm tra tài khoản.');
      }

      console.log('Fetched doctor ID:', doctor.id);
      return doctor.id;
    } catch (err) {
      console.error('Error fetching doctor ID:', err);
      throw err;
    }
  },

  async getAppointmentsByDoctor(doctorId) {
    try {
      if (!doctorId || typeof doctorId !== 'string') {
        throw new Error('ID bác sĩ không hợp lệ.');
      }
      console.log('Fetching appointments for doctorId:', doctorId);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          symptoms,
          status,
          qr_code,
          created_at,
          updated_at,
          patient_name,
          patient_phone,
          date,
          cancelled_by,
          doctor:user_profiles!appointments_doctor_id_fkey(full_name, phone),
          patient:user_profiles!appointments_user_id_fkey(full_name, phone),
          department:departments!fk_appointments_department(name, description),
          slot:doctor_schedule_template!fk_slot_id(start_time, end_time)
        `)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching appointments:', error.message);
        throw new Error(`Không thể tải lịch hẹn: ${error.message}`);
      }

      return data?.map(appointment => ({
        ...appointment,
        patient: appointment.patient || { full_name: 'Bệnh nhân không xác định', phone: '' },
        doctor: appointment.doctor || { full_name: 'Bác sĩ không xác định', phone: '' },
        department: appointment.department || { name: 'Khoa không xác định', description: '' },
        slot: appointment.slot || { start_time: null, end_time: null },
      })) || [];
    } catch (err) {
      console.error('Error in getAppointmentsByDoctor:', err);
      throw err;
    }
  },

  async confirmAppointment(appointmentId) {
    try {
      if (!appointmentId || typeof appointmentId !== 'string') {
        throw new Error('ID cuộc hẹn không hợp lệ.');
      }
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) {
        console.error('Error confirming appointment:', error);
        throw new Error(`Không thể xác nhận cuộc hẹn: ${error.message}`);
      }
      if (!data) {
        throw new Error('Cuộc hẹn không tồn tại.');
      }
      return data;
    } catch (err) {
      console.error('Error in confirmAppointment:', err);
      throw err;
    }
  },

  async cancelAppointment(appointmentId, cancelledBy = 'doctor', reason = null) {
    try {
      if (!appointmentId || typeof appointmentId !== 'string') {
        throw new Error('ID cuộc hẹn không hợp lệ.');
      }
      const status = cancelledBy === 'doctor' ? 'doctor_cancelled' : 'patient_cancelled';
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status,
          updated_at: new Date().toISOString(),
          cancelled_by: reason ? { cancelled_by: cancelledBy, reason } : { cancelled_by: cancelledBy },
        })
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) {
        console.error('Error cancelling appointment:', error);
        throw new Error(`Không thể hủy cuộc hẹn: ${error.message}`);
      }
      if (!data) {
        throw new Error('Cuộc hẹn không tồn tại.');
      }
      return data;
    } catch (err) {
      console.error('Error in cancelAppointment:', err);
      throw err;
    }
  },
};