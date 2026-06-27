import { supabase } from '../lib/supabase';
import { getCurrentUser } from './session';

export async function getCurrentStudentId() {
  const currentUser = getCurrentUser();

  if (!currentUser.email) return '';

  const { data, error } = await supabase
    .from('students')
    .select('id')
    .eq('email', currentUser.email)
    .maybeSingle();

  if (error || !data) return '';

  return data.id;
}

export async function getCurrentStudent() {
  const currentUser = getCurrentUser();

  if (!currentUser.email) return null;

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('email', currentUser.email)
    .maybeSingle();

  if (error || !data) return null;

  return data;
}