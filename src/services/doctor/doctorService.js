// src/services/doctor/doctorService.js
import { supabase } from '../../api/supabase';

// === TẠO BÁC SĨ + LỊCH MẪU (CHỈ DÙNG doctor_schedule_template) ===
export const createDoctorWithRoleService = async (
  email,
  password,
  fullName,
  departmentId,
  scheduleList = [],
  role = 2
) => {
  try {
    // 1. TẠO USER AUTH
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return { success: false, message: `Email ${email} đã tồn tại` };
      }
      throw authError;
    }

    const userId = authData.user.id;

    // 2. TẠO PROFILE
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({ id: userId, full_name: fullName, email, role_id: role }, { onConflict: 'id' });

    if (profileError) throw profileError;

    // 3. TẠO BÁC SĨ
    const { error: doctorError } = await supabase
      .from('doctors')
      .upsert({ id: userId, department_id: departmentId }, { onConflict: 'id' });

    if (doctorError) throw doctorError;

    // 4. LƯU LỊCH MẪU VÀO doctor_schedule_template
    if (scheduleList.length > 0) {
      const templateByDay = {};
      scheduleList.forEach(s => {
        const key = s.day_of_week;
        if (!templateByDay[key]) {
          templateByDay[key] = { start: s.start_time, end: s.end_time };
        } else {
          const curr = templateByDay[key];
          if (s.start_time < curr.start) curr.start = s.start_time;
          if (s.end_time > curr.end) curr.end = s.end_time;
        }
      });

      const templateData = Object.entries(templateByDay).map(([day, { start, end }]) => ({
        doctor_id: userId,
        day_of_week: day,
        start_time: start,
        end_time: end,
      }));

      const { error: tempErr } = await supabase
        .from('doctor_schedule_template')
        .upsert(templateData, { 
          onConflict: 'doctor_id,day_of_week,start_time' 
        });

      if (tempErr) throw tempErr;
    }

    return { success: true, message: `Đã tạo bác sĩ ${fullName}`, userId };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// === LẤY TẤT CẢ BÁC SĨ ===
export const getAllDoctorsService = async () => {
  const { data, error } = await supabase
    .from('doctors')
    .select(`
      id,
      department_id,
      specialization,
      experience_years,
      room_number,
      max_patients_per_slot,
      bio,
      created_at,
      user_profiles (
        full_name,
        email,
        role_id,
        roles ( name )
      ),
      departments ( name ),
      doctor_schedule_template (
        day_of_week,
        start_time,
        end_time
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// === CẬP NHẬT BÁC SĨ ===
export const updateDoctorService = async (userId, updateData = {}) => {
  const updates = {};

  if (updateData.fullName) {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ full_name: updateData.fullName })
      .eq('id', userId);
    if (profileError) throw new Error(profileError.message);
  }

  if (updateData.departmentId) updates.department_id = updateData.departmentId;
  if (updateData.specialization) updates.specialization = updateData.specialization;
  if (updateData.experience_years) updates.experience_years = updateData.experience_years;
  if (updateData.room_number) updates.room_number = updateData.room_number;
  if (updateData.max_patients_per_slot) updates.max_patients_per_slot = updateData.max_patients_per_slot;
  if (updateData.bio) updates.bio = updateData.bio;

  if (Object.keys(updates).length > 0) {
    const { error: doctorError } = await supabase
      .from('doctors')
      .update(updates)
      .eq('id', userId);
    if (doctorError) throw new Error(doctorError.message);
  }

  return { success: true, message: 'Đã cập nhật thông tin bác sĩ' };
};

// === XÓA BÁC SĨ → TỰ ĐỘNG XÓA LỊCH (DO ON DELETE CASCADE) ===
export const deleteDoctorService = async (userId) => {
  try {
    // 1. XÓA doctors → TỰ ĐỘNG XÓA doctor_schedule_template
    const { error: doctorError } = await supabase
      .from('doctors')
      .delete()
      .eq('id', userId);

    if (doctorError) throw doctorError;

    // 2. XÓA profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (profileError) throw profileError;

    // 3. XÓA auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) throw authError;

    return { success: true, message: 'Đã xóa bác sĩ và lịch làm việc' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};