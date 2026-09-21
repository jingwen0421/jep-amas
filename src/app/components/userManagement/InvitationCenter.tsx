import { useEffect, useState } from 'react';
import { Mail, Send, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { roles, translateRole } from '../../utils/userHelpers';
import { useConfirm } from '../../context/ConfirmDialogContext';
import { useLanguage } from '../../context/LanguageContext';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  invited_at: string;
}

export default function InvitationCenter() {
  const { t } = useLanguage();
  const confirmDialog = useConfirm();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('teacher');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  useEffect(() => {
    fetchInvitations();
  }, []);

  async function fetchInvitations() {
    setLoading(true);

    const { data, error } = await supabase
      .from('user_invitations')
      .select('*')
      .order('invited_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch invitations:', error.message);
      setLoading(false);
      return;
    }

    setInvitations(data || []);
    setLoading(false);
  }

  async function sendInvitation() {
    if (!email.trim()) {
      alert(t('userManagement.invitations.error.emailRequired'));
      return;
    }

    setSending(true);

    const { error } = await supabase.from('user_invitations').insert({
      email: email.trim(),
      role,
      status: 'pending',
      invited_at: new Date().toISOString(),
    });

    if (error) {
      alert(t('userManagement.invitations.error.sendFailed', { error: error.message }));
      setSending(false);
      return;
    }

    await supabase.from('audit_logs').insert({
      user_id: null,
      action: 'User Invitation Sent',
      module: 'User Management',
      target_id: email.trim(),
      old_data: null,
      new_data: {
        email: email.trim(),
        role,
        status: 'pending',
      },
      created_at: new Date().toISOString(),
    });

    setEmail('');
    setSending(false);
    fetchInvitations();
  }

  async function cancelInvitation(invitation: Invitation) {
    const confirmed = await confirmDialog(
      t('userManagement.invitations.confirmCancel', { email: invitation.email }),
      { variant: 'danger' }
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from('user_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitation.id);

    if (error) {
      alert(t('userManagement.invitations.error.cancelFailed', { error: error.message }));
      return;
    }

    fetchInvitations();
  }

  async function resendInvitation(invitation: Invitation) {
    const { error } = await supabase
      .from('user_invitations')
      .update({
        status: 'pending',
        invited_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (error) {
      alert(t('userManagement.invitations.error.resendFailed', { error: error.message }));
      return;
    }

    await supabase.from('audit_logs').insert({
      user_id: null,
      action: 'User Invitation Resent',
      module: 'User Management',
      target_id: invitation.email,
      old_data: null,
      new_data: {
        email: invitation.email,
        role: invitation.role,
      },
      created_at: new Date().toISOString(),
    });

    fetchInvitations();
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <h2 className="text-lg text-[#284342] mb-5">{t('userManagement.invitations.title')}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('userManagement.invitations.emailPlaceholder')}
          className="px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] focus:outline-none focus:ring-2 focus:ring-[#284342]"
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] focus:outline-none focus:ring-2 focus:ring-[#284342]"
        >
          {roles.map((item) => (
            <option key={item} value={item}>
              {translateRole(item, t)}
            </option>
          ))}
        </select>

        <button
          onClick={sendInvitation}
          disabled={sending}
          className="bg-[#284342] text-[#e9da95] rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Send size={18} />
          {sending ? t('userManagement.invitations.sending') : t('userManagement.invitations.sendInvitation')}
        </button>
      </div>

      <div className="space-y-3">
        {loading && (
          <p className="text-sm text-[#6b6b6b]">{t('userManagement.invitations.loading')}</p>
        )}

        {!loading && invitations.length === 0 && (
          <p className="text-sm text-[#6b6b6b]">{t('userManagement.invitations.empty')}</p>
        )}

        {!loading &&
          invitations.map((invite) => (
            <div
              key={invite.id}
              className="border border-[rgba(40,67,66,0.1)] rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Mail size={18} className="text-[#284342]" />
                  <p className="text-[#284342]">{invite.email}</p>
                </div>

                <p className="text-xs text-[#6b6b6b] mt-2">
                  {translateRole(invite.role, t)} •{' '}
                  {new Date(invite.invited_at).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    invite.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : invite.status === 'accepted'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {translateInvitationStatus(invite.status, t)}
                </span>

                <button
                  onClick={() => resendInvitation(invite)}
                  className="p-2 hover:bg-[#e9da95]/20 rounded-lg"
                  title={t('userManagement.invitations.resend')}
                >
                  <RefreshCw size={16} className="text-[#284342]" />
                </button>

                <button
                  onClick={() => cancelInvitation(invite)}
                  className="p-2 hover:bg-red-50 rounded-lg"
                  title={t('userManagement.invitations.cancel')}
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function translateInvitationStatus(status: string, t: (key: string, params?: Record<string, string | number>) => string) {
  const key = `userManagement.invitations.status.${String(status || '').toLowerCase()}`;
  const translated = t(key);
  if (translated !== key) return translated;
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}