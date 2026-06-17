import { UserPlus, Shield, Edit, Lock } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
}

export default function UserManagement() {
  const users: User[] = [
    {
      id: 'U001',
      name: 'Admin User',
      email: 'admin@jepacademy.com',
      role: 'Super Admin',
      status: 'Active',
      lastLogin: '2026-06-02 08:30',
    },
    {
      id: 'U002',
      name: 'Juju Lim',
      email: 'juju.lim@jepacademy.com',
      role: 'Teacher',
      status: 'Active',
      lastLogin: '2026-06-02 09:15',
    },
    {
      id: 'U003',
      name: 'Esther',
      email: 'esther@jepacademy.com',
      role: 'Teacher',
      status: 'Active',
      lastLogin: '2026-06-01 14:20',
    },
    {
      id: 'U004',
      name: 'Finance Staff',
      email: 'finance@jepacademy.com',
      role: 'Finance Staff',
      status: 'Active',
      lastLogin: '2026-06-02 07:45',
    },
    {
      id: 'U005',
      name: 'Wong Yi Feng',
      email: 'wong.yifeng@jepacademy.com',
      role: 'Teacher',
      status: 'Active',
      lastLogin: '2026-06-02 10:00',
    },
    {
      id: 'U006',
      name: 'Pauline Tang',
      email: 'pauline.tang@jepacademy.com',
      role: 'Teacher',
      status: 'Active',
      lastLogin: '2026-06-01 16:30',
    },
  ];

  const roles = ['Super Admin', 'Admin', 'Teacher', 'Finance Staff', 'Student', 'Owner'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">User Management</h1>
          <p className="text-[#6b6b6b] mt-1">Manage system users and permissions</p>
        </div>
        <button className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2">
          <UserPlus size={20} />
          Add User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Total Users</p>
          <p className="text-3xl text-[#284342]">{users.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Active</p>
          <p className="text-3xl text-green-700">
            {users.filter((u) => u.status === 'Active').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Inactive</p>
          <p className="text-3xl text-red-700">
            {users.filter((u) => u.status === 'Inactive').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Roles</p>
          <p className="text-3xl text-[#284342]">{roles.length}</p>
        </div>
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
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Last Login</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Status</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {users.map((user) => (
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
                      <button className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors" title="Edit">
                        <Edit size={16} className="text-[#284342]" />
                      </button>
                      <button className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors" title="Reset Password">
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
            <div key={role} className="p-4 rounded-lg bg-[#f8f8f6] hover:bg-[#e9da95]/10 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={18} className="text-[#284342]" />
                <h3 className="text-sm text-[#284342]">{role}</h3>
              </div>
              <p className="text-xs text-[#6b6b6b]">
                {users.filter((u) => u.role === role).length} users
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
