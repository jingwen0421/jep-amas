import { useState } from 'react';
import { UserPlus } from 'lucide-react';

import { useUsers } from '../hooks/useUsers';

import type {
  SystemUser,
  UserFormData,
} from '../types/user';

import UserKPIs from '../components/userManagement/UserKPIs';
import UserFilters from '../components/userManagement/UserFilters';
import UserTable from '../components/userManagement/UserTable';
import UserModal from '../components/userManagement/UserModal';
import RolePermissionCards from '../components/userManagement/RolePermissionCards';
import LoginActivity from '../components/userManagement/LoginActivity';
import SecuritySummary from '../components/userManagement/SecuritySummary';
import PermissionMatrix from '../components/userManagement/PermissionMatrix';
import InvitationCenter from '../components/userManagement/InvitationCenter';
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

  } = useUsers();

  const [showModal, setShowModal] = useState(false);

  const [editingUser, setEditingUser] =
    useState<SystemUser | null>(null);

  const [formData, setFormData] =
    useState<UserFormData>({
      fullName: '',
      email: '',
      role: 'admin',
      status: 'active',
    });

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

    await saveUser(
      formData,
      editingUser?.id
    );

    setShowModal(false);

  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl text-[#284342]">
            User & Access Control
          </h1>

          <p className="text-[#6b6b6b] mt-1">
            Manage users, permissions and academy access.
          </p>

        </div>

        <button
          onClick={openCreateUser}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] flex items-center gap-2"
        >
          <UserPlus size={20}/>
          Add User
        </button>

      </div>

      <UserKPIs
        stats={stats}
      />

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

        onView={(user)=>
          alert(
            `${user.name}\n${user.email}\n${user.role}`
          )
        }

        onEdit={openEditUser}

        onToggleStatus={toggleStatus}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <RolePermissionCards
          users={users}
        />

        <LoginActivity
          activities={activities}
        />

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SecuritySummary users={users} activities={activities} />
        <PermissionMatrix />
      </div>

      <InvitationCenter />

      {showModal && (

        <UserModal
          editingUser={editingUser}

          formData={formData}

          setFormData={setFormData}

          onClose={()=>
            setShowModal(false)
          }

          onSave={handleSave}
        />

      )}

    </div>
  );

}