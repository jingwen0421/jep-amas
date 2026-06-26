import { useEffect, useMemo, useState } from 'react';
import type { SystemUser, UserActivity, UserFormData } from '../types/user';
import {
  createUser,
  getUserActivities,
  getUsers,
  toggleUserStatus,
  updateUser,
} from '../services/userManagementService';

export function useUsers() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    setUsers(await getUsers());
    setActivities(await getUserActivities());
    setLoading(false);
  }

  async function saveUser(formData: UserFormData, userId?: string) {
    if (userId) {
      await updateUser(userId, formData);
    } else {
      await createUser(formData);
    }

    await refresh();
  }

  async function toggleStatus(user: SystemUser) {
    await toggleUserStatus(user);
    await refresh();
  }

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.role.toLowerCase().includes(search);

      const matchesRole = roleFilter === 'all' || user.rawRole === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.rawStatus === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'Active').length,
    inactive: users.filter((u) => u.status === 'Inactive').length,
    adminAccess: users.filter((u) =>
      ['super_admin', 'admin', 'owner'].includes(u.rawRole)
    ).length,
  };

  return {
    users,
    filteredUsers,
    activities,
    loading,
    stats,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    saveUser,
    toggleStatus,
    refresh,
  };
}