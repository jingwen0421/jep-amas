import { useEffect, useState } from 'react';
import { UserPlus, Shield, Edit, Lock, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'admin',
    status: 'active',
  });

  const roles = [
    'super_admin',
    'admin',
    'owner',
    'teacher',
    'finance',
    'student',
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, status, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error.message);
      setLoading(false);
      return;
    }

    const mapped: SystemUser[] = (data || []).map((user: any) => ({
      id: user.id,
      name: user.full_name || 'Unnamed User',
      email: user.email || '-',
      role: formatRole(user.role),
      status: user.status === 'active' ? 'Active' : 'Inactive',
      lastLogin: user.updated_at
        ? new Date(user.updated_at).toLocaleString()
        : '-',
    }));

    setUsers(mapped);
    setLoading(false);
  }

  async function createUser() {
    if (!formData.fullName || !formData.email) {
      alert('Please enter name and email.');
      return;
    }

    const { error } = await supabase.from('users').insert({
      full_name: formData.fullName,
      email: formData.email,
      role: formData.role,
      status: formData.status,
    });

    if (error) {
      alert(`Failed to create user: ${error.message}`);
      return;
    }

    setFormData({
      fullName: '',
      email: '',
      role: 'admin',
      status: 'active',
    });

    setShowModal(false);
    fetchUsers();
  }

  async function toggleStatus(user: SystemUser) {
    const newStatus = user.status === 'Active' ? 'inactive' : 'active';

    const { error } = await supabase
      .from('users')
      .update({ status: newStatus })
      .eq('id', user.id);

    if (error) {
      alert(`Failed to update user: ${error.message}`);
      return;
    }

    fetchUsers();
  }

  const activeCount = users.filter((u) => u.status === 'Active').length;
  const inactiveCount = users.filter((u) => u.status === 'Inactive').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">User Management</h1>
          <p className="text-[#6b6b6b] mt-1">
            Manage system users and permissions
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
        >
          <UserPlus size={20} />
          Add User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard label="Total Users" value={users.length} color="text-[#284342]" />
        <SummaryCard label="Active" value={activeCount} color="text-green-700" />
        <SummaryCard label="Inactive" value={inactiveCount} color="text-red-700" />
        <SummaryCard label="Roles" value={roles.length} color="text-[#284342]" />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">System Users</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Name</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Email</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Role</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Last Updated</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Status</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#6b6b6b]">
                    Loading users...
                  </td>
                </tr>
              )}

              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#6b6b6b]">
                    No users found.
                  </td>
                </tr>
              )}

              {!loading &&
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#f8f8f6] transition-colors">
                    <td className="px-6 py-4 text-sm text-[#284342]">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">{user.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Shield size={14} className="text-[#284342]" />
                        <span className="text-sm text-[#284342]">{user.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">{user.lastLogin}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${
                          user.status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleStatus(user)}
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                          title="Toggle Status"
                        >
                          <Edit size={16} className="text-[#284342]" />
                        </button>

                        <button
                          onClick={() => alert('Demo password is 123.')}
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                          title="Reset Password"
                        >
                          <Lock size={16} className="text-[#284342]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
        <h2 className="text-lg text-[#284342] mb-4">User Roles</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div
              key={role}
              className="p-4 rounded-lg bg-[#f8f8f6] hover:bg-[#e9da95]/10 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield size={18} className="text-[#284342]" />
                <h3 className="text-sm text-[#284342]">{formatRole(role)}</h3>
              </div>
              <p className="text-xs text-[#6b6b6b]">
                {users.filter((u) => u.role === formatRole(role)).length} users
              </p>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-[#284342]">Add New User</h2>
              <button onClick={() => setShowModal(false)}>
                <X size={20} className="text-[#284342]" />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Full Name"
                value={formData.fullName}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, fullName: value }))
                }
              />

              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, email: value }))
                }
              />

              <div>
                <label className="block text-sm text-[#284342] mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {formatRole(role)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={createUser}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <p className="text-sm text-[#6b6b6b] mb-2">{label}</p>
      <p className={`text-3xl ${color}`}>{value}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-[#284342] mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
      />
    </div>
  );
}

function formatRole(role: string) {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'admin') return 'Admin';
  if (role === 'owner') return 'Owner';
  if (role === 'teacher') return 'Teacher';
  if (role === 'finance') return 'Finance Staff';
  if (role === 'student') return 'Student';
  return role;
}