import { supabase } from '../../api/supabase';

export class AppointmentService {
  static async fetchAppointmentsByUser(userId) {
    try {
      if (!userId || typeof userId !== 'string') {
        throw new Error('ID người dùng không hợp lệ.');
      }

      const { data: apptData, error: apptError } = await supabase
        .from('appointments')
        .select(`
          id,
          status,
          patient_name,
          patient_phone,
          created_at,
          appointment_date,
          slot_id,
          doctor_id,
          department_id,
          cancelled_by,
          doctor_schedule_template!inner (
            start_time,
            end_time
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (apptError) throw new Error(`Lỗi lấy appointments: ${apptError.message}`);

      if (!apptData || apptData.length === 0) {
        return [];
      }

      const doctorIds = apptData.map(appt => appt.doctor_id).filter(id => id);
      const { data: doctorData, error: doctorError } = doctorIds.length > 0
        ? await supabase
          .from('doctors')
          .select('id, name, room_number, department_id')
          .in('id', doctorIds)
        : { data: [], error: null };

      if (doctorError) throw new Error(`Lỗi lấy thông tin bác sĩ: ${doctorError.message}`);

      const deptIds = doctorData.map(doc => doc.department_id).filter(id => id);
      const uniqueDeptIds = [...new Set(deptIds)];
      const { data: deptData, error: deptError } = uniqueDeptIds.length > 0
        ? await supabase.from('departments').select('id, name').in('id', uniqueDeptIds)
        : { data: [], error: null };

      if (deptError) throw new Error(`Lỗi lấy thông tin chuyên khoa: ${deptError.message}`);

      const appointmentsWithDetails = apptData.map(appt => {
        const doctor = doctorData.find(doc => doc.id === appt.doctor_id) || {};
        const department = deptData.find(d => d.id === doctor.department_id) || {};
        return {
          ...appt,
          doctor,
          department,
        };
      });

      return appointmentsWithDetails;
    } catch (error) {
      console.error('Error in fetchAppointmentsByUser:', error);
      throw error;
    }
  }

  static async cancelAppointment(appointmentId, cancelledBy = 'patient', reason = null) {
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

      if (error) throw new Error(`Lỗi hủy cuộc hẹn: ${error.message}`);
      if (!data) throw new Error('Cuộc hẹn không tồn tại.');

      return data;
    } catch (error) {
      console.error('Error in cancelAppointment:', error);
      throw error;
    }
  }
}