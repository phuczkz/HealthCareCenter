import { fetchAuthUser, fetchUserProfile } from '../../services/patient/userService';

export const getUserProfile = async (userId) => {
  try {
    const authUser = await fetchAuthUser();
    const profile = await fetchUserProfile(userId);

    return {
      id: profile?.id,
      name: profile?.full_name || 'Người dùng mới',
      email: authUser?.email || '',
      gender: profile?.gender || 'unknown',
      date_of_birth: profile?.date_of_birth || null,
      role: profile?.roles?.name || 'patient',
      avatar_url: profile?.avatar_url || null, // THÊM DÒNG NÀY
    };
  } catch (err) {
    console.error('getUserProfile error:', err);
    throw err;
  }
};