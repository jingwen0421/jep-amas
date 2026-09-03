import { supabase } from '../lib/supabase';
import { getCurrentUser } from './session';

export async function getCurrentTeacherId() {
  const currentUser = getCurrentUser();

  if (!currentUser.id) return '';

  const { data, error } = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', currentUser.id)
    .maybeSingle();

  if (error || !data) return '';

  return data.id;
}

export async function getCurrentTeacher() {
  const currentUser = getCurrentUser();

  if (!currentUser.id) return null;

  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('user_id', currentUser.id)
    .maybeSingle();

  if (error || !data) return null;

  return data;
}
