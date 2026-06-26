import { X, Save } from 'lucide-react';
import type { SystemUser, UserFormData } from '../../types/user';
import { roles, formatRole } from '../../utils/userHelpers';

interface Props {
  editingUser: SystemUser | null;
  formData: UserFormData;
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>;
  onClose: () => void;
  onSave: () => void;
}

export default function UserModal({
  editingUser,
  formData,
  setFormData,
  onClose,
  onSave,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl text-[#284342]">
            {editingUser ? 'Edit User' : 'Add New User'}
          </h2>

          <button onClick={onClose}>
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
            onClick={onClose}
            className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            {editingUser ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </div>
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