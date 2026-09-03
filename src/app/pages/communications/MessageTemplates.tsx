import { useEffect, useState } from 'react';
import { Edit, Trash2, MessageSquare, Mail, Bell, Plus, X } from 'lucide-react';
import {
  MessageTemplate,
  TemplateChannel,
  fetchTemplates,
  saveTemplate,
  deleteTemplate,
} from '../../services/communicationService';
import { getCurrentUser } from '../../utils/session';

const CHANNEL_META: Record<TemplateChannel, { label: string; icon: React.ReactNode; badge: string }> = {
  whatsapp: {
    label: 'WhatsApp',
    icon: <MessageSquare size={20} className="text-green-700" />,
    badge: 'bg-green-100 text-green-700',
  },
  email: {
    label: 'Email',
    icon: <Mail size={20} className="text-blue-700" />,
    badge: 'bg-blue-100 text-blue-700',
  },
  in_app: {
    label: 'In-App',
    icon: <Bell size={20} className="text-[#284342]" />,
    badge: 'bg-[#e9da95]/30 text-[#284342]',
  },
};

const emptyForm = { name: '', channel: 'email' as TemplateChannel, body: '' };

export default function MessageTemplates() {
  const currentUser = getCurrentUser();
  const canManage = ['super_admin', 'admin'].includes(currentUser.role);

  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setTemplates(await fetchTemplates());
    setLoading(false);
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setShowModal(true);
  }

  function openEdit(t: MessageTemplate) {
    setEditingId(t.id);
    setForm({ name: t.name, channel: t.channel, body: t.body });
    setFormError(null);
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setFormError('Give the template a name.');
      return;
    }
    if (!form.body.trim()) {
      setFormError('Template content cannot be empty.');
      return;
    }

    setSaving(true);
    const result = await saveTemplate({
      id: editingId || undefined,
      name: form.name.trim(),
      channel: form.channel,
      body: form.body.trim(),
    });
    setSaving(false);

    if (!result.success) {
      setFormError(result.error || 'Failed to save template.');
      return;
    }

    setShowModal(false);
    load();
  }

  async function handleDelete(t: MessageTemplate) {
    if (!confirm(`Deactivate the "${t.name}" template?`)) return;
    const result = await deleteTemplate(t.id);
    if (!result.success) {
      alert(result.error || 'Failed to deactivate template.');
      return;
    }
    load();
  }

  function extractVariables(body: string) {
    const matches = body.match(/\{(\w+)\}/g) || [];
    return Array.from(new Set(matches.map((m) => m.slice(1, -1))));
  }

  const grouped: Record<TemplateChannel, MessageTemplate[]> = {
    whatsapp: templates.filter((t) => t.channel === 'whatsapp'),
    email: templates.filter((t) => t.channel === 'email'),
    in_app: templates.filter((t) => t.channel === 'in_app'),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Message Templates</h1>
          <p className="text-[#6b6b6b] mt-1">
            Reusable content for WhatsApp, Email, and in-app notifications
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreate}
            className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            Create Template
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">WhatsApp</p>
          <p className="text-3xl text-green-700">{grouped.whatsapp.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Email</p>
          <p className="text-3xl text-blue-700">{grouped.email.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">In-App</p>
          <p className="text-3xl text-[#284342]">{grouped.in_app.length}</p>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
          Loading templates...
        </div>
      )}

      {!loading &&
        (['whatsapp', 'email', 'in_app'] as TemplateChannel[]).map((channel) => (
          <div
            key={channel}
            className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden"
          >
            <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <h2 className="text-lg text-[#284342]">{CHANNEL_META[channel].label} Templates</h2>
            </div>

            <div className="divide-y divide-[rgba(40,67,66,0.1)]">
              {grouped[channel].length === 0 && (
                <div className="p-6 text-center text-[#6b6b6b] text-sm">
                  No {CHANNEL_META[channel].label.toLowerCase()} templates yet.
                </div>
              )}

              {grouped[channel].map((template) => (
                <div key={template.id} className="p-6 hover:bg-[#f8f8f6] transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {CHANNEL_META[channel].icon}
                        <h3 className="text-lg text-[#284342]">{template.name}</h3>
                        <span className={`text-xs px-3 py-1 rounded-full ${CHANNEL_META[channel].badge}`}>
                          {CHANNEL_META[channel].label}
                        </span>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg mb-3 whitespace-pre-line">
                        <p className="text-sm text-[#284342]">{template.body}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-[#6b6b6b]">Variables:</span>
                        {extractVariables(template.body).length === 0 && (
                          <span className="text-xs text-[#6b6b6b]">none</span>
                        )}
                        {extractVariables(template.body).map((variable) => (
                          <span
                            key={variable}
                            className="text-xs px-2 py-1 rounded bg-[#e9da95]/20 text-[#284342]"
                          >
                            {`{${variable}}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center justify-between pt-4 border-t border-[rgba(40,67,66,0.1)]">
                      <p className="text-xs text-[#6b6b6b]">
                        Updated {new Date(template.updatedAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(template)}
                          className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-2"
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(template)}
                          className="px-4 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition-colors text-sm flex items-center gap-2"
                        >
                          <Trash2 size={14} />
                          Deactivate
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

      {showModal && canManage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-[#284342]">
                {editingId ? 'Edit Template' : 'Create Template'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#6b6b6b] hover:text-[#284342]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#284342] mb-2">Template Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Class Reminder"
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">Channel</label>
                <div className="flex gap-3">
                  {(['whatsapp', 'email', 'in_app'] as TemplateChannel[]).map((c) => (
                    <label
                      key={c}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] cursor-pointer hover:bg-[#f8f8f6]"
                    >
                      <input
                        type="radio"
                        name="channel"
                        checked={form.channel === c}
                        onChange={() => setForm((prev) => ({ ...prev, channel: c }))}
                      />
                      <span className="text-sm text-[#284342]">{CHANNEL_META[c].label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Content{' '}
                  <span className="text-xs text-[#6b6b6b] font-normal">
                    — use {'{variableName}'} for placeholders (e.g. {'{studentName}'})
                  </span>
                </label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                  rows={6}
                  placeholder="Hi {studentName}, your {className} class is tomorrow at {time}."
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{formError}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
