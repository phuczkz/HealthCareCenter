// src/controllers/patient/AppointmentController.js

import { supabase } from '../../api/supabase';
import { AppointmentService } from '../../services/patient/AppointmentService';

export class AppointmentController {
  /**
   * TẢI DANH SÁCH LỊCH HẸN CỦA BỆNH NHÂN
   * @param {Function} setAppointments - React state setter
   * @param {Function} setLoading
   * @param {Function} setError
   */
  static async loadAppointments(setAppointments, setLoading, setError) {
    // BẮT BUỘC PHẢI CÓ HÀM SETTER → TRÁNH LỖI "callback không hợp lệ"
    if (typeof setAppointments !== 'function' || 
        typeof setLoading !== 'function' || 
        typeof setError !== 'function') {
      console.error('Lỗi: Các hàm callback phải là function hợp lệ!');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Vui lòng đăng nhập lại.');
      }

      const appointments = await AppointmentService.fetchAppointmentsByUser(user.id);

      // Cập nhật state an toàn
      setAppointments(appointments || []);

    } catch (error) {
      console.error('Error in loadAppointments:', error);
      setError(error.message || 'Không thể tải lịch hẹn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  /**
   * HỦY LỊCH HẸN
   */
  static async cancelAppointment(
    appointmentId,
    setAppointments,
    setError,
    cancelledBy = 'patient',
    reason = null
  ) {
    if (!appointmentId || typeof setAppointments !== 'function' || typeof setError !== 'function') {
      setError('Dữ liệu không hợp lệ.');
      return { success: false, message: 'Thiếu thông tin để hủy lịch.' };
    }

    try {
      const updatedAppointment = await AppointmentService.cancelAppointment(
        appointmentId,
        cancelledBy,
        reason
      );

      // Cập nhật danh sách mà không làm mất thứ tự
      setAppointments(prev => 
        prev.map(appt => 
          appt.id === appointmentId 
            ? { ...appt, ...updatedAppointment, status: 'cancelled' }
            : appt
        )
      );

      return { 
        success: true, 
        message: cancelledBy === 'doctor' 
          ? 'Bác sĩ đã hủy lịch hẹn.' 
          : 'Bạn đã hủy lịch thành công!' 
      };

    } catch (error) {
      console.error('Error in cancelAppointment:', error);
      setError(error.message || 'Hủy lịch thất bại. Vui lòng thử lại.');
      return { success: false, message: error.message || 'Hủy thất bại' };
    }
  }
}