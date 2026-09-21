import { useState } from 'react';
import { UserPlus } from 'lucide-react';

import { useUsers } from '../hooks/useUsers';
import { useLanguage } from '../context/LanguageContext';
import { translateRole } from '../utils/userHelpers';

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
  const { t } = useLanguage();
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
  const [viewingUser, setViewingUser] = useState<SystemUser | null>(null);

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
          <h1 className="text-3xl text-[#284342]">{t('userManagement.title')}</h1>
          <p className="text-[#6b6b6b] mt-1">
            {t('userManagement.subtitle')}
          </p>
        </div>

        <button
          onClick={openCreateUser}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] flex items-center gap-2"
        >
          <UserPlus size={20} />
          {t('userManagement.addUser')}
        </button>
      </div>

      <UserKPIs stats={stats} />

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="flex flex-wrap border-b border-[rgba(40,67,66,0.1)] bg-[#f8f8f6]">
          <TabButton
            label={t('userManagement.tabs.users', { count: users.length })}
            active={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
          />

          <TabButton
            label={t('userManagement.tabs.pending', { count: pendingCount })}
            active={activeTab === 'pending'}
            onClick={() => setActiveTab('pending')}
          />

          <TabButton
            label={t('userManagement.tabs.invitations')}
            active={activeTab === 'invitations'}
            onClick={() => setActiveTab('invitations')}
          />

          <TabButton
            label={t('userManagement.tabs.security')}
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
                onView={setViewingUser}
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

      {viewingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl text-[#284342] mb-6">
              {viewingUser.name}
            </h2>

            <div className="space-y-4 text-sm">
              <Detail label={t('userManagement.viewModal.email')} value={viewingUser.email} />
              <Detail label={t('userManagement.viewModal.role')} value={translateRole(viewingUser.rawRole, t)} />
              <Detail
                label={t('userManagement.viewModal.status')}
                value={viewingUser.status === 'Active' ? t('common.active') : t('common.inactive')}
              />
              <Detail label={t('userManagement.viewModal.created')} value={viewingUser.createdAt} />
              <Detail label={t('userManagement.viewModal.lastUpdated')} value={viewingUser.lastUpdated} />
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setViewingUser(null)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                {t('userManagement.viewModal.close')}
              </button>

              <button
                onClick={() => {
                  openEditUser(viewingUser);
                  setViewingUser(null);
                }}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
              >
                {t('userManagement.viewModal.editUser')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[rgba(40,67,66,0.08)] pb-2">
      <span className="text-[#6b6b6b]">{label}</span>
      <span className="text-[#284342]">{value}</span>
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