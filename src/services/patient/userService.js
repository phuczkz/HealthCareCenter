// services/patient/userService.js
import { supabase } from '../../api/supabase';

export const fetchAuthUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
};

export const fetchUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, gender, date_of_birth, avatar_url, roles(name)') // THÊM avatar_url
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};