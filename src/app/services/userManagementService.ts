import { supabase } from '../lib/supabase';
import type { SystemUser, UserFormData, UserActivity } from '../types/user';
import { formatRole } from '../utils/userHelpers';

export async function getUsers(): Promise<SystemUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, status, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error.message);
    return [];
  }

  return (data || []).map((user: any) => ({
    id: user.id,
    name: user.full_name || 'Unnamed User',
    email: user.email || '-',
    rawRole: user.role || 'admin',
    role: formatRole(user.role || 'admin'),
    rawStatus: user.status || 'inactive',
    status: user.status === 'active' ? 'Active' : 'Inactive',
    createdAt: user.created_at ? new Date(user.created_at).toLocaleString() : '-',
    lastUpdated: user.updated_at ? new Date(user.updated_at).toLocaleString() : '-',
  }));
}

export async function createUser(formData: UserFormData) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      full_name: formData.fullName,
      email: formData.email,
      role: formData.role,
      status: formData.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw error;

  await logUserActivity('User Created', data?.id || null, formData);
}

export async function updateUser(userId: string, formData: UserFormData) {
  const { error } = await supabase
    .from('users')
    .update({
      full_name: formData.fullName,
      email: formData.email,
      role: formData.role,
      status: formData.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;

  await logUserActivity('User Updated', userId, formData);
}

export async function toggleUserStatus(user: SystemUser) {
  const newStatus = user.status === 'Active' ? 'inactive' : 'active';

  const { error } = await supabase
    .from('users')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) throw error;

  await logUserActivity(
    newStatus === 'active' ? 'User Activated' : 'User Deactivated',
    user.id,
    {
      fullName: user.name,
      email: user.email,
      role: user.rawRole,
      status: newStatus,
    }
  );
}

export async function getUserActivities(): Promise<UserActivity[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, action, module, created_at')
    .in('module', ['User Management', 'Authentication', 'Settings'])
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Error fetching user activity:', error.message);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    action: item.action || 'System activity',
    module: item.module || '-',
    time: item.created_at ? new Date(item.created_at).toLocaleString() : '-',
  }));
}

async function logUserActivity(
  action: string,
  targetId: string | null,
  formData: UserFormData
) {
  await supabase.from('audit_logs').insert({
    user_id: null,
    action,
    module: 'User Management',
    target_id: targetId,
    old_data: null,
    new_data: {
      name: formData.fullName,
      email: formData.email,
      role: formData.role,
      status: formData.status,
    },
    created_at: new Date().toISOString(),
  });
}