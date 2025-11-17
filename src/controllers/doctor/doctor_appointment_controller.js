import { DoctorAppointmentService } from '../../services/doctor/doctor_appointment_service';

export const DoctorAppointmentController = {
  async loadAppointments(setDoctorId, setAppointments, setLoading, setError) {
    try {
      if (!setDoctorId || !setAppointments || !setLoading || !setError) {
        throw new Error('Các hàm callback không hợp lệ.');
      }

      setLoading(true);
      setError(null);

      const doctorId = await DoctorAppointmentService.getDoctorId();
      if (!doctorId) {
        throw new Error('Không thể xác định ID bác sĩ.');
      }
      setDoctorId(doctorId);

      const appointments = await DoctorAppointmentService.getAppointmentsByDoctor(doctorId);
      if (!Array.isArray(appointments)) {
        throw new Error('Dữ liệu lịch hẹn không hợp lệ.');
      }
      setAppointments(appointments);
    } catch (err) {
      console.error('Error in loadAppointments:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải lịch hẹn.');
    } finally {
      setLoading(false);
    }
  },

  async confirmAppointment(appointmentId, setAppointments, setError) {
    try {
      if (!appointmentId || typeof appointmentId !== 'string') {
        throw new Error('ID cuộc hẹn không hợp lệ.');
      }

      const updatedAppointment = await DoctorAppointmentService.confirmAppointment(appointmentId);
      if (setAppointments && setError) {
        setAppointments(prev => 
          prev.map(appt => appt.id === appointmentId ? updatedAppointment : appt)
        );
      }
      return { success: true, message: 'Đã xác nhận cuộc hẹn' };
    } catch (err) {
      console.error('Error in confirmAppointment controller:', err);
      if (setError) {
        setError(err.message || 'Không thể xác nhận cuộc hẹn.');
      }
      throw err;
    }
  },

  async cancelAppointment(appointmentId, setAppointments, setError, cancelledBy = 'doctor', reason = null) {
    try {
      if (!appointmentId || typeof appointmentId !== 'string') {
        throw new Error('ID cuộc hẹn không hợp lệ.');
      }

      const updatedAppointment = await DoctorAppointmentService.cancelAppointment(appointmentId, cancelledBy, reason);
      if (setAppointments && setError) {
        setAppointments(prev => 
          prev.map(appt => appt.id === appointmentId ? updatedAppointment : appt)
        );
      }
      return { success: true, message: `Đã hủy cuộc hẹn bởi ${cancelledBy === 'doctor' ? 'bác sĩ' : 'bệnh nhân'}` };
    } catch (err) {
      console.error('Error in cancelAppointment controller:', err);
      if (setError) {
        setError(err.message || 'Không thể hủy cuộc hẹn.');
      }
      throw err;
    }
  },
};