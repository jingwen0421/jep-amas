import { useEffect, useState } from 'react';
import { Mail, Send, RefreshCw, Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../utils/session';
import {
  MessageTemplate,
  fetchTemplates,
  sendEmail,
} from '../../services/communicationService';
import { useLanguage } from '../../context/LanguageContext';

const RECIPIENT_FALLBACK = '__recipient_fallback__';
const SUBJECT_FALLBACK = '__subject_fallback__';

interface EmailRow {
  id: string;
  recipientName: string;
  recipientUserId: string | null;
  subject: string;
  body: string;
  sentDate: string;
  status: string;
}

interface RecipientOption {
  userId: string | null;
  name: string;
  email: string;
}

export default function EmailComms() {
  const { t } = useLanguage();
  const currentUser = getCurrentUser();
  const canSend = ['super_admin', 'admin', 'owner', 'finance', 'internal_sales', 'external_sales'].includes(
    currentUser.role
  );

  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  const [showComposer, setShowComposer] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipientResults, setRecipientResults] = useState<RecipientOption[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientOption | null>(null);
  const [manualEmail, setManualEmail] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    load();
    fetchTemplates('email').then(setTemplates);
  }, []);

  async function load() {
    setLoading(true);

    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, title, message, delivery_status, sent_at, created_at')
      .eq('channel', 'email')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Failed to fetch emails:', error.message);
      setLoading(false);
      return;
    }

    const userIds = Array.from(new Set((data || []).map((r: any) => r.user_id).filter(Boolean)));
    const namesByUserId: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: users } = await supabase.from('users').select('id, full_name').in('id', userIds);
      (users || []).forEach((u: any) => {
        namesByUserId[u.id] = u.full_name;
      });
    }

    setEmails(
      (data || []).map((row: any) => ({
        id: row.id,
        recipientName: row.user_id ? namesByUserId[row.user_id] || RECIPIENT_FALLBACK : RECIPIENT_FALLBACK,
        recipientUserId: row.user_id,
        subject: row.title || SUBJECT_FALLBACK,
        body: row.message,
        sentDate: row.sent_at || row.created_at,
        status: row.delivery_status,
      }))
    );

    setLoading(false);
  }

  async function searchRecipients(query: string) {
    setRecipientSearch(query);
    setSelectedRecipient(null);

    if (!query.trim()) {
      setRecipientResults([]);
      return;
    }

    const [studentsRes, usersRes] = await Promise.all([
      supabase
        .from('students')
        .select('user_id, full_name, email')
        .ilike('full_name', `%${query.trim()}%`)
        .not('email', 'is', null)
        .limit(5),
      supabase
        .from('users')
        .select('id, full_name, email')
        .ilike('full_name', `%${query.trim()}%`)
        .neq('role', 'student')
        .limit(5),
    ]);

    const results: RecipientOption[] = [
      ...(studentsRes.data || [])
        .filter((s: any) => s.email)
        .map((s: any) => ({ userId: s.user_id, name: s.full_name, email: s.email })),
      ...(usersRes.data || [])
        .filter((u: any) => u.email)
        .map((u: any) => ({ userId: u.id, name: u.full_name, email: u.email })),
    ];

    setRecipientResults(results);
  }

  function applyTemplate(id: string) {
    setTemplateId(id);
    const template = templates.find((t) => t.id === id);
    if (template) setBody(template.body);
  }

  function openComposer() {
    setRecipientSearch('');
    setRecipientResults([]);
    setSelectedRecipient(null);
    setManualEmail('');
    setTemplateId('');
    setSubject('');
    setBody('');
    setSendError(null);
    setShowComposer(true);
  }

  async function handleSend() {
    setSendError(null);

    const toEmail = selectedRecipient?.email || manualEmail.trim();

    if (!toEmail) {
      setSendError(t('emailComms.error.chooseRecipient'));
      return;
    }

    if (!subject.trim()) {
      setSendError(t('emailComms.error.subjectRequired'));
      return;
    }

    if (!body.trim()) {
      setSendError(t('emailComms.error.bodyRequired'));
      return;
    }

    setSending(true);

    const result = await sendEmail({
      to: toEmail,
      toName: selectedRecipient?.name,
      subject: subject.trim(),
      body: body.trim(),
      userId: selectedRecipient?.userId || null,
      templateId: templateId || null,
      relatedModule: 'Communications',
    });

    setSending(false);

    if (!result.success) {
      setSendError(result.error || t('emailComms.error.sendFailed'));
      return;
    }

    setShowComposer(false);
    load();
  }

  const sentCount = emails.filter((e) => e.status === 'sent').length;
  const pendingCount = emails.filter((e) => e.status === 'pending').length;
  const failedCount = emails.filter((e) => e.status === 'failed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">{t('emailComms.title')}</h1>
          <p className="text-[#6b6b6b] mt-1">{t('emailComms.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
          >
            <RefreshCw size={18} />
          </button>
          {canSend && (
            <button
              onClick={openComposer}
              className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
            >
              <Send size={20} />
              {t('emailComms.composeEmail')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">{t('emailComms.stat.total')}</p>
          <p className="text-3xl text-[#284342]">{emails.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">{t('emailComms.stat.sent')}</p>
          <p className="text-3xl text-green-700">{sentCount}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">{t('emailComms.stat.pending')}</p>
          <p className="text-3xl text-yellow-700">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">{t('emailComms.stat.failed')}</p>
          <p className="text-3xl text-red-700">{failedCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">{t('emailComms.history')}</h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {loading && <div className="p-6 text-center text-[#6b6b6b]">{t('emailComms.loading')}</div>}

          {!loading && emails.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              {t('emailComms.empty')} {canSend ? t('emailComms.emptyHint') : ''}
            </div>
          )}

          {!loading &&
            emails.map((email) => (
              <div key={email.id} className="p-6 hover:bg-[#f8f8f6] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-blue-50">
                    <Mail size={20} className="text-blue-700" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <h3 className="text-[#284342]">{email.subject === SUBJECT_FALLBACK ? t('emailComms.noSubject') : email.subject}</h3>
                      <span
                        className={`text-xs px-3 py-1 rounded-full shrink-0 ${
                          email.status === 'sent'
                            ? 'bg-green-100 text-green-700'
                            : email.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {email.status === 'sent'
                          ? t('emailComms.status.sent')
                          : email.status === 'failed'
                          ? t('emailComms.status.failed')
                          : t('emailComms.status.pending')}
                      </span>
                    </div>
                    <p className="text-sm text-[#6b6b6b] mb-2">
                      {t('emailComms.to', {
                        name: email.recipientName === RECIPIENT_FALLBACK ? t('emailComms.recipientFallback') : email.recipientName,
                      })}
                    </p>
                    <p className="text-xs text-[#6b6b6b]">
                      {new Date(email.sentDate).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {showComposer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[rgba(40,67,66,0.1)] flex items-center justify-between">
              <h2 className="text-xl text-[#284342]">{t('emailComms.composeEmail')}</h2>
              <button onClick={() => setShowComposer(false)} className="text-[#6b6b6b] hover:text-[#284342]">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-[#284342] mb-2">{t('emailComms.recipient')}</label>
                {selectedRecipient ? (
                  <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-[#f8f8f6]">
                    <span className="text-sm text-[#284342]">
                      {selectedRecipient.name} — {selectedRecipient.email}
                    </span>
                    <button
                      onClick={() => setSelectedRecipient(null)}
                      className="text-[#6b6b6b] hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]" />
                      <input
                        value={recipientSearch}
                        onChange={(e) => searchRecipients(e.target.value)}
                        placeholder={t('emailComms.recipientSearchPlaceholder')}
                        className="w-full pl-8 pr-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                      />
                      {recipientResults.length > 0 && (
                        <div className="mt-1 bg-white border border-[rgba(40,67,66,0.15)] rounded-lg overflow-hidden">
                          {recipientResults.map((r) => (
                            <button
                              key={`${r.userId}-${r.email}`}
                              onClick={() => {
                                setSelectedRecipient(r);
                                setRecipientResults([]);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-[#284342] hover:bg-[#f8f8f6] transition-colors flex items-center justify-between"
                            >
                              <span>{r.name}</span>
                              <span className="text-xs text-[#6b6b6b]">{r.email}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-[#6b6b6b] mt-2">{t('emailComms.orTypeEmail')}</p>
                    <input
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder={t('emailComms.emailPlaceholder')}
                      className="w-full mt-1 px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                    />
                  </>
                )}
              </div>

              {templates.length > 0 && (
                <div>
                  <label className="block text-sm text-[#284342] mb-2">{t('emailComms.startFromTemplate')}</label>
                  <select
                    value={templateId}
                    onChange={(e) => applyTemplate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                  >
                    <option value="">{t('emailComms.noTemplate')}</option>
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm text-[#284342] mb-2">{t('emailComms.subject')}</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t('emailComms.subjectPlaceholder')}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">{t('emailComms.message')}</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  placeholder={t('emailComms.messagePlaceholder')}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
                {templateId && body.includes('{') && (
                  <p className="text-xs text-[#6b6b6b] mt-1">
                    {t('emailComms.placeholderTip')}
                  </p>
                )}
              </div>

              {sendError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{sendError}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[rgba(40,67,66,0.1)] flex items-center gap-3">
              <button
                onClick={() => setShowComposer(false)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Send size={18} />
                {sending ? t('emailComms.sending') : t('emailComms.sendEmail')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
