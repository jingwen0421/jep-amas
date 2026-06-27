import { CheckCircle2, XCircle, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { SystemUser } from '../../types/user';

interface Props {
  users: SystemUser[];
  onRefresh: () => void;
}

export default function PendingApproval({ users, onRefresh }: Props) {
  const pendingUsers = users.filter(
  (user) => user.rawStatus === 'pending' && user.rawRole !== 'student'
);

  async function updateApproval(user: SystemUser, status: 'active' | 'rejected') {
    const confirmed = confirm(
      status === 'active'
        ? `Approve ${user.name}?`
        : `Reject ${user.name}?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('users')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      alert(`Failed to update user: ${error.message}`);
      return;
    }

    await supabase.from('audit_logs').insert({
      user_id: null,
      action: status === 'active' ? 'Account Approved' : 'Account Rejected',
      module: 'User Management',
      target_id: user.id,
      old_data: { status: 'pending' },
      new_data: {
        name: user.name,
        email: user.email,
        role: user.rawRole,
        status,
      },
      created_at: new Date().toISOString(),
    });

    await supabase.from('notifications').insert({
      user_id: user.id,
      channel: 'in_app',
      title: status === 'active' ? 'Account Approved' : 'Account Rejected',
      message:
        status === 'active'
          ? 'Your account has been approved. You may now log in.'
          : 'Your account registration has been rejected. Please contact the academy administrator.',
      delivery_status: 'pending',
      created_at: new Date().toISOString(),
    });

    onRefresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl text-[#284342]">Pending Account Approval</h2>
        <p className="text-sm text-[#6b6b6b] mt-1">
          Review new account sign-ups before allowing system access.
        </p>
      </div>

      {pendingUsers.length === 0 && (
        <div className="p-8 text-center bg-[#f8f8f6] rounded-lg text-[#6b6b6b]">
          No pending accounts.
        </div>
      )}

      {pendingUsers.map((user) => (
        <div
          key={user.id}
          className="p-5 rounded-lg border border-[rgba(40,67,66,0.1)] bg-white flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-[#e9da95]/30 flex items-center justify-center text-[#284342]">
              <UserCheck size={20} />
            </div>

            <div>
              <p className="text-sm text-[#284342]">{user.name}</p>
              <p className="text-xs text-[#6b6b6b] mt-1">{user.email}</p>
              <p className="text-xs text-[#6b6b6b] mt-1">
                Requested Role: {user.role}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => updateApproval(user, 'active')}
              className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              Approve
            </button>

            <button
              onClick={() => updateApproval(user, 'rejected')}
              className="px-4 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 flex items-center gap-2"
            >
              <XCircle size={16} />
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}