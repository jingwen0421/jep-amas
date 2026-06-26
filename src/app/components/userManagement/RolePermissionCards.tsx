import { Shield } from 'lucide-react';
import type { SystemUser } from '../../types/user';
import { roles, permissions, formatRole } from '../../utils/userHelpers';

interface Props {
  users: SystemUser[];
}

export default function RolePermissionCards({ users }: Props) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <h2 className="text-lg text-[#284342] mb-4">Role Permission Center</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <div
            key={role}
            className="p-4 rounded-lg bg-[#f8f8f6] hover:bg-[#e9da95]/10 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-[#284342]" />
                <h3 className="text-sm text-[#284342]">{formatRole(role)}</h3>
              </div>

              <span className="text-xs text-[#6b6b6b]">
                {users.filter((user) => user.rawRole === role).length} users
              </span>
            </div>

            <div className="space-y-1">
              {(permissions[role] || []).map((permission) => (
                <p key={permission} className="text-xs text-[#6b6b6b]">
                  • {permission}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}