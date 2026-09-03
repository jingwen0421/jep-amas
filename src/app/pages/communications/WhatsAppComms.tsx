import { useEffect, useState } from 'react';
import { MessageCircle, Send, RefreshCw, Search, X, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../utils/session';
import {
  MessageTemplate,
  fetchTemplates,
  queueWhatsAppMessage,
  openWhatsAppChat,
} from '../../services/communicationService';

interface WhatsAppRow {
  id: string;
  recipientName: string;
  phone: string | null;
  message: string;
  sentDate: string;
  status: string;
}

interface RecipientOption {
  userId: string | null;
  name: string;
  phone: string;
}

export default function WhatsAppComms() {
  const currentUser = getCurrentUser();
  const canSend = ['super_admin', 'admin', 'owner', 'finance', 'internal_sales', 'external_sales'].includes(
    currentUser.role
  );

  const [messages, setMessages] = useState<WhatsAppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  const [showComposer, setShowComposer] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipientResults, setRecipientResults] = useState<RecipientOption[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientOption | null>(null);
  const [manualPhone, setManualPhone] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    load();
    fetchTemplates('whatsapp').then(setTemplates);
  }, []);

  async function load() {
    setLoading(true);

    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, title, message, delivery_status, sent_at, created_at, contact_phone')
      .eq('channel', 'whatsapp')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Failed to fetch WhatsApp messages:', error.message);
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

    setMessages(
      (data || []).map((row: any) => ({
        id: row.id,
        recipientName: row.user_id ? namesByUserId[row.user_id] || 'Recipient' : 'Recipient',
        phone: row.contact_phone,
        message: row.message,
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
        .select('user_id, full_name, phone')
        .ilike('full_name', `%${query.trim()}%`)
        .not('phone', 'is', null)
        .limit(5),
      supabase
        .from('users')
        .select('id, full_name, phone')
        .ilike('full_name', `%${query.trim()}%`)
        .neq('role', 'student')
        .limit(5),
    ]);

    const results: RecipientOption[] = [
      ...(studentsRes.data || [])
        .filter((s: any) => s.phone)
        .map((s: any) => ({ userId: s.user_id, name: s.full_name, phone: s.phone })),
      ...(usersRes.data || [])
        .filter((u: any) => u.phone)
        .map((u: any) => ({ userId: u.id, name: u.full_name, phone: u.phone })),
    ];

    setRecipientResults(results);
  }

  function applyTemplate(id: string) {
    setTemplateId(id);
    const template = templates.find((t) => t.id === id);
    if (template) setMessage(template.body);
  }

  function openComposer() {
    setRecipientSearch('');
    setRecipientResults([]);
    setSelectedRecipient(null);
    setManualPhone('');
    setTemplateId('');
    setMessage('');
    setSendError(null);
    setShowComposer(true);
  }

  async function handleSend() {
    setSendError(null);

    const phone = selectedRecipient?.phone || manualPhone.trim();

    if (!phone) {
      setSendError('Choose a recipient or enter a phone number.');
      return;
    }

    if (!message.trim()) {
      setSendError('Message cannot be empty.');
      return;
    }

    setSending(true);

    const result = await queueWhatsAppMessage({
      to: phone,
      toName: selectedRecipient?.name,
      message: message.trim(),
      userId: selectedRecipient?.userId || null,
      templateId: templateId || null,
      relatedModule: 'Communications',
    });

    setSending(false);

    if (!result.success) {
      setSendError(result.error || 'Failed to queue message.');
      return;
    }

    // WhatsApp has no automated send here (see banner below) — open the
    // chat immediately so the sender can press Send themselves right away
    // instead of hunting for it later in the queue.
    openWhatsAppChat(phone, message.trim());

    setShowComposer(false);
    load();
  }

  const sentCount = messages.filter((m) => m.status === 'sent').length;
  const pendingCount = messages.filter((m) => m.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">WhatsApp Communications</h1>
          <p className="text-[#6b6b6b] mt-1">Queue and send WhatsApp messages</p>
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
              Send Message
            </button>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert size={20} className="text-blue-700 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900">
          WhatsApp messages are sent manually through your own WhatsApp — we don't automate this
          channel (the WhatsApp Business API needs a verified business account and stricter
          security review). Every message here opens a pre-filled chat for you to review and send
          yourself, and gets logged below either way.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Total Logged</p>
          <p className="text-3xl text-[#284342]">{messages.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Marked Sent</p>
          <p className="text-3xl text-green-700">{sentCount}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Pending</p>
          <p className="text-3xl text-yellow-700">{pendingCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">Message History</h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {loading && <div className="p-6 text-center text-[#6b6b6b]">Loading messages...</div>}

          {!loading && messages.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              No WhatsApp messages logged yet. {canSend ? 'Send one to get started.' : ''}
            </div>
          )}

          {!loading &&
            messages.map((msg) => (
              <div key={msg.id} className="p-6 hover:bg-[#f8f8f6] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-green-50">
                    <MessageCircle size={24} className="text-green-700" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg text-[#284342]">{msg.recipientName}</h3>
                        <p className="text-sm text-[#6b6b6b]">{msg.phone || 'No phone on file'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-3 py-1 rounded-full ${
                            msg.status === 'sent'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {msg.status}
                        </span>
                        {msg.phone && (
                          <button
                            onClick={() => openWhatsAppChat(msg.phone!, msg.message)}
                            className="p-2 rounded-lg hover:bg-green-50"
                            title="Open in WhatsApp"
                          >
                            <MessageCircle size={16} className="text-green-700" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg mb-2 whitespace-pre-line">
                      <p className="text-sm text-[#284342]">{msg.message}</p>
                    </div>

                    <p className="text-xs text-[#6b6b6b]">{new Date(msg.sentDate).toLocaleString()}</p>
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
              <h2 className="text-xl text-[#284342]">Send WhatsApp Message</h2>
              <button onClick={() => setShowComposer(false)} className="text-[#6b6b6b] hover:text-[#284342]">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-[#284342] mb-2">Recipient</label>
                {selectedRecipient ? (
                  <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-[#f8f8f6]">
                    <span className="text-sm text-[#284342]">
                      {selectedRecipient.name} — {selectedRecipient.phone}
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
                        placeholder="Search a student or staff member by name..."
                        className="w-full pl-8 pr-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                      />
                      {recipientResults.length > 0 && (
                        <div className="mt-1 bg-white border border-[rgba(40,67,66,0.15)] rounded-lg overflow-hidden">
                          {recipientResults.map((r) => (
                            <button
                              key={`${r.userId}-${r.phone}`}
                              onClick={() => {
                                setSelectedRecipient(r);
                                setRecipientResults([]);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-[#284342] hover:bg-[#f8f8f6] transition-colors flex items-center justify-between"
                            >
                              <span>{r.name}</span>
                              <span className="text-xs text-[#6b6b6b]">{r.phone}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-[#6b6b6b] mt-2">Or type a phone number directly:</p>
                    <input
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      placeholder="+60 12-345 6789"
                      className="w-full mt-1 px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                    />
                  </>
                )}
              </div>

              {templates.length > 0 && (
                <div>
                  <label className="block text-sm text-[#284342] mb-2">Start from a template (optional)</label>
                  <select
                    value={templateId}
                    onChange={(e) => applyTemplate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                  >
                    <option value="">No template</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm text-[#284342] mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  placeholder="Type your message here..."
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
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
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Send size={18} />
                {sending ? 'Queueing...' : 'Open in WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
