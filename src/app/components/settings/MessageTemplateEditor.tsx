import { useEffect, useState } from 'react';
import { MessageSquare, Mail, Save, Eye } from 'lucide-react';
import { templateVariables } from '../../utils/settingsHelpers';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';

const SUBJECT_PREFIX = 'Subject: ';

const defaultTemplates = [
  {
    id: 'payment-reminder',
    name: 'Payment Reminder',
    nameKey: 'settings.template.paymentReminder',
    channel: 'whatsapp',
    subject: '',
    content:
      'Hi {{StudentName}}, this is a reminder that your payment of RM {{Amount}} is due on {{DueDate}}. Thank you from JEP Image Makeup Academy.',
  },
  {
    id: 'class-reminder',
    name: 'Class Reminder',
    nameKey: 'settings.template.classReminder',
    channel: 'whatsapp',
    subject: '',
    content:
      'Hi {{StudentName}}, reminder that your {{CourseName}} class is scheduled on {{ClassDate}}.',
  },
  {
    id: 'certificate-ready',
    name: 'Certificate Ready',
    nameKey: 'settings.template.certificateReady',
    channel: 'whatsapp',
    subject: '',
    content:
      'Hi {{StudentName}}, your certificate {{CertificateNo}} is ready. You may contact the academy for collection.',
  },
  {
    id: 'welcome-email',
    name: 'Welcome Email',
    nameKey: 'settings.template.welcomeEmail',
    channel: 'email',
    subject: 'Welcome to JEP Image Makeup Academy',
    content:
      'Hi {{StudentName}}, welcome to JEP Image Makeup Academy. We are happy to have you in {{CourseName}}.',
  },
];

export default function MessageTemplateEditor() {
  const { t } = useLanguage();
  const [templates, setTemplates] = useState(defaultTemplates);
  const [selectedId, setSelectedId] = useState(defaultTemplates[0].id);
  const [saving, setSaving] = useState(false);

  const selectedTemplate =
    templates.find((template) => template.id === selectedId) || templates[0];

  useEffect(() => {
    loadSavedTemplates();
  }, []);

  async function loadSavedTemplates() {
    const { data, error } = await supabase
      .from('message_templates')
      .select('template_name, channel, message_body')
      .eq('language', 'en');

    if (error || !data) {
      console.error('Error loading message templates:', error?.message);
      return;
    }

    setTemplates((prev) =>
      prev.map((template) => {
        const saved = data.find(
          (row) =>
            row.template_name === template.name &&
            row.channel === template.channel
        );

        if (!saved) return template;

        const isEmailWithSubject =
          template.channel === 'email' &&
          saved.message_body.startsWith(SUBJECT_PREFIX);

        if (isEmailWithSubject) {
          const [subjectLine, ...rest] = saved.message_body.split('\n\n');
          return {
            ...template,
            subject: subjectLine.slice(SUBJECT_PREFIX.length),
            content: rest.join('\n\n'),
          };
        }

        return { ...template, content: saved.message_body };
      })
    );
  }

  function updateTemplate(field: 'name' | 'subject' | 'content', value: string) {
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === selectedTemplate.id
          ? { ...template, [field]: value }
          : template
      )
    );
  }

  function insertVariable(variable: string) {
    updateTemplate('content', `${selectedTemplate.content} ${variable}`);
  }

  async function saveTemplate() {
    setSaving(true);

    const messageBody =
      selectedTemplate.channel === 'email' && selectedTemplate.subject
        ? `${SUBJECT_PREFIX}${selectedTemplate.subject}\n\n${selectedTemplate.content}`
        : selectedTemplate.content;

    const { error } = await supabase.from('message_templates').upsert(
      {
        template_name: selectedTemplate.name,
        channel: selectedTemplate.channel,
        language: 'en',
        message_body: messageBody,
        status: 'active',
      },
      { onConflict: 'template_name,channel,language' }
    );

    setSaving(false);

    if (error) {
      alert(t('settings.template.saveFailed', { message: error.message }));
      return;
    }

    alert(t('settings.template.saved'));
  }

  return (
    <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
      <div className="p-5 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
        <h2 className="text-xl text-[#284342]">{t('settings.template.editorTitle')}</h2>
        <p className="text-sm text-[#6b6b6b] mt-1">
          {t('settings.template.editorSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        <div className="border-r border-[rgba(40,67,66,0.1)] p-4 space-y-2">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedId(template.id)}
              className={`w-full text-left p-4 rounded-lg transition-colors ${
                selectedId === template.id
                  ? 'bg-[#284342] text-[#e9da95]'
                  : 'bg-[#f8f8f6] text-[#284342] hover:bg-[#e9da95]/20'
              }`}
            >
              <div className="flex items-center gap-2">
                {template.channel === 'whatsapp' ? (
                  <MessageSquare size={16} />
                ) : (
                  <Mail size={16} />
                )}
                <span className="text-sm">{t(template.nameKey)}</span>
              </div>
              <p className="text-xs opacity-70 mt-1">
                {template.channel.toUpperCase()}
              </p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('settings.template.nameLabel')}
              value={selectedTemplate.name}
              onChange={(value) => updateTemplate('name', value)}
            />

            <Input
              label={t('settings.template.channelLabel')}
              value={selectedTemplate.channel.toUpperCase()}
              disabled
            />
          </div>

          {selectedTemplate.channel === 'email' && (
            <Input
              label={t('settings.template.emailSubjectLabel')}
              value={selectedTemplate.subject}
              onChange={(value) => updateTemplate('subject', value)}
            />
          )}

          <div>
            <label className="block text-sm text-[#284342] mb-2">
              {t('settings.template.messageContentLabel')}
            </label>
            <textarea
              value={selectedTemplate.content}
              onChange={(e) => updateTemplate('content', e.target.value)}
              rows={8}
              className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] focus:outline-none focus:ring-2 focus:ring-[#284342]"
            />
          </div>

          <div>
            <p className="text-sm text-[#284342] mb-2">{t('settings.template.insertVariables')}</p>
            <div className="flex flex-wrap gap-2">
              {templateVariables.map((variable) => (
                <button
                  key={variable}
                  onClick={() => insertVariable(variable)}
                  className="text-xs px-3 py-2 rounded-lg bg-[#e9da95]/20 text-[#284342] hover:bg-[#e9da95]/40"
                >
                  {variable}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#f8f8f6] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2 text-[#284342]">
              <Eye size={16} />
              <p className="text-sm">{t('settings.template.preview')}</p>
            </div>
            <p className="text-sm text-[#6b6b6b] whitespace-pre-line">
              {selectedTemplate.content}
            </p>
          </div>

          <button
            onClick={saveTemplate}
            disabled={saving}
            className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? t('settings.template.saving') : t('settings.template.saveButton')}
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
  disabled = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm text-[#284342] mb-2">{label}</label>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] ${
          disabled ? 'bg-[#f8f8f6] text-[#6b6b6b]' : 'bg-white'
        }`}
      />
    </div>
  );
}