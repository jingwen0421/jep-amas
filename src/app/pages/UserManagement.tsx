import { useState } from 'react';
import { UserPlus } from 'lucide-react';

import { useUsers } from '../hooks/useUsers';

import type { SystemUser, UserFormData } from '../types/user';

import UserKPIs from '../components/userManagement/UserKPIs';
import UserFilters from '../components/userManagement/UserFilters';
import UserTable from '../components/userManagement/UserTable';
import UserModal from '../components/userManagement/UserModal';
import LoginActivity from '../components/userManagement/LoginActivity';
import SecuritySummary from '../components/userManagement/SecuritySummary';
import PermissionMatrix from '../components/userManagement/PermissionMatrix';
import InvitationCenter from '../components/userManagement/InvitationCenter';
import PendingApproval from '../components/userManagement/PendingApproval';

type Tab = 'users' | 'pending' | 'invitations' | 'security';

export default function UserManagement() {
  const {
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
  } = useUsers();

  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  const [formData, setFormData] = useState<UserFormData>({
    fullName: '',
    email: '',
    role: 'admin',
    status: 'active',
  });

  const pendingCount = users.filter((user) => user.rawStatus === 'pending').length;

  function openCreateUser() {
    setEditingUser(null);
    setFormData({
      fullName: '',
      email: '',
      role: 'admin',
      status: 'active',
    });
    setShowModal(true);
  }

  function openEditUser(user: SystemUser) {
    setEditingUser(user);
    setFormData({
      fullName: user.name,
      email: user.email,
      role: user.rawRole,
      status: user.rawStatus,
    });
    setShowModal(true);
  }

  async function handleSave() {
    await saveUser(formData, editingUser?.id);
    setShowModal(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">User & Access Control</h1>
          <p className="text-[#6b6b6b] mt-1">
            Manage users, approvals, invitations and system access.
          </p>
        </div>

        <button
          onClick={openCreateUser}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] flex items-center gap-2"
        >
          <UserPlus size={20} />
          Add User
        </button>
      </div>

      <UserKPIs stats={stats} />

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="flex flex-wrap border-b border-[rgba(40,67,66,0.1)] bg-[#f8f8f6]">
          <TabButton
            label={`Users (${users.length})`}
            active={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
          />

          <TabButton
            label={`Pending Approval (${pendingCount})`}
            active={activeTab === 'pending'}
            onClick={() => setActiveTab('pending')}
          />

          <TabButton
            label="Invitations"
            active={activeTab === 'invitations'}
            onClick={() => setActiveTab('invitations')}
          />

          <TabButton
            label="Security"
            active={activeTab === 'security'}
            onClick={() => setActiveTab('security')}
          />
        </div>

        <div className="p-6">
          {activeTab === 'users' && (
            <div className="space-y-6">
              <UserFilters
                searchTerm={searchTerm}
                roleFilter={roleFilter}
                statusFilter={statusFilter}
                setSearchTerm={setSearchTerm}
                setRoleFilter={setRoleFilter}
                setStatusFilter={setStatusFilter}
              />

              <UserTable
                users={filteredUsers}
                totalUsers={users.length}
                loading={loading}
                onView={(user) =>
                  alert(`${user.name}\n${user.email}\n${user.role}`)
                }
                onEdit={openEditUser}
                onToggleStatus={toggleStatus}
              />
            </div>
          )}

          {activeTab === 'pending' && (
            <PendingApproval users={users} onRefresh={refresh} />
          )}

          {activeTab === 'invitations' && <InvitationCenter />}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <SecuritySummary users={users} activities={activities} />
                <LoginActivity activities={activities} />
              </div>

              <PermissionMatrix />
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <UserModal
          editingUser={editingUser}
          formData={formData}
          setFormData={setFormData}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-4 text-sm border-b-2 transition-colors ${
        active
          ? 'border-[#284342] text-[#284342] bg-white'
          : 'border-transparent text-[#6b6b6b] hover:text-[#284342]'
      }`}
    >
      {label}
    </button>
  );
}