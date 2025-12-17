import { supabase } from "../../api/supabase";

export const DoctorAppointmentService = {
  async getDoctorId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Chưa đăng nhập");
    return user.id;
  },

  async getAppointmentsByDoctor(doctorId) {
    try {
      console.log("Đang tải lịch cho bác sĩ ID:", doctorId);

      const { data: appointments = [], error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          user_id,
          patient_name,
          patient_phone,
          appointment_date,
          symptoms,
          status,
          created_at,
          price,
          slot_id,
          doctor_id,
          doctors!doctor_id (
            id,
            name,
            room_number,
            service_id,
            services!service_id (
              id,
              name
            )
          ),
          doctor_schedule_template!slot_id (
            start_time,
            end_time
          ),
          user_profiles!user_id (
            id,
            full_name,
            phone,
            avatar_url
          )
        `
        )
        .eq("doctor_id", doctorId)
        .order("appointment_date", { ascending: true });

      if (error) throw error;
      if (appointments.length === 0) return [];

      // Lấy thông tin bác sĩ + chuyên khoa (chỉ 1 lần)
      const doctorInfo = appointments[0].doctors;
      const roomNumber = doctorInfo?.room_number?.trim() || "Chưa có phòng";
      const serviceName = doctorInfo?.services?.name || "Khám tổng quát";

      const result = appointments.map((appt) => {
        const slot = appt.doctor_schedule_template || {};
        const patient = appt.user_profiles || {};

        return {
          id: appt.id,
          user_id: appt.user_id,
          patient_name: patient.full_name || appt.patient_name || "Bệnh nhân",
          patient_phone: patient.phone || appt.patient_phone || "",
          appointment_date: appt.appointment_date,
          symptoms: appt.symptoms,
          status: appt.status,
          price: appt.price || 180000,

          // CHUYÊN KHOA ĐÚNG 100% TỪ BÁC SĨ
          service_name: serviceName,

          // Giờ khám
          timeDisplay:
            slot.start_time && slot.end_time
              ? `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`
              : "Chưa xác định",

          // Thông tin bác sĩ
          doctor_name: doctorInfo?.name || "Bác sĩ",
          doctor_room_number: roomNumber,

          // Tương thích code cũ
          patient: {
            full_name: patient.full_name || appt.patient_name || "Bệnh nhân",
            phone: patient.phone || appt.patient_phone || "",
            avatar_url: patient.avatar_url || null,
          },
          doctor_specialization_text: serviceName,
        };
      });

      console.log(
        `ĐÃ TẢI ${result.length} LỊCH – Chuyên khoa: ${serviceName} – Phòng: ${roomNumber}`
      );
      return result;
    } catch (err) {
      console.error("Lỗi tải lịch bác sĩ:", err.message || err);
      return [];
    }
  },
};
