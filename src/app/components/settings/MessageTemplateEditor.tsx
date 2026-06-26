import { useState } from 'react';
import { MessageSquare, Mail, Save, Eye } from 'lucide-react';
import { templateVariables } from '../../utils/settingsHelpers';

const defaultTemplates = [
  {
    id: 'payment-reminder',
    name: 'Payment Reminder',
    channel: 'whatsapp',
    subject: '',
    content:
      'Hi {{StudentName}}, this is a reminder that your payment of RM {{Amount}} is due on {{DueDate}}. Thank you from JEP Image Makeup Academy.',
  },
  {
    id: 'class-reminder',
    name: 'Class Reminder',
    channel: 'whatsapp',
    subject: '',
    content:
      'Hi {{StudentName}}, reminder that your {{CourseName}} class is scheduled on {{ClassDate}}.',
  },
  {
    id: 'certificate-ready',
    name: 'Certificate Ready',
    channel: 'whatsapp',
    subject: '',
    content:
      'Hi {{StudentName}}, your certificate {{CertificateNo}} is ready. You may contact the academy for collection.',
  },
  {
    id: 'welcome-email',
    name: 'Welcome Email',
    channel: 'email',
    subject: 'Welcome to JEP Image Makeup Academy',
    content:
      'Hi {{StudentName}}, welcome to JEP Image Makeup Academy. We are happy to have you in {{CourseName}}.',
  },
];

export default function MessageTemplateEditor() {
  const [templates, setTemplates] = useState(defaultTemplates);
  const [selectedId, setSelectedId] = useState(defaultTemplates[0].id);

  const selectedTemplate =
    templates.find((template) => template.id === selectedId) || templates[0];

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

  function saveTemplate() {
    alert('Template saved locally. Database save can be connected after template table is confirmed.');
  }

  return (
    <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
      <div className="p-5 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
        <h2 className="text-xl text-[#284342]">Message Template Editor</h2>
        <p className="text-sm text-[#6b6b6b] mt-1">
          Edit WhatsApp and email message templates in one place
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
                <span className="text-sm">{template.name}</span>
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
              label="Template Name"
              value={selectedTemplate.name}
              onChange={(value) => updateTemplate('name', value)}
            />

            <Input
              label="Channel"
              value={selectedTemplate.channel.toUpperCase()}
              disabled
            />
          </div>

          {selectedTemplate.channel === 'email' && (
            <Input
              label="Email Subject"
              value={selectedTemplate.subject}
              onChange={(value) => updateTemplate('subject', value)}
            />
          )}

          <div>
            <label className="block text-sm text-[#284342] mb-2">
              Message Content
            </label>
            <textarea
              value={selectedTemplate.content}
              onChange={(e) => updateTemplate('content', e.target.value)}
              rows={8}
              className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] focus:outline-none focus:ring-2 focus:ring-[#284342]"
            />
          </div>

          <div>
            <p className="text-sm text-[#284342] mb-2">Insert Variables</p>
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
              <p className="text-sm">Preview</p>
            </div>
            <p className="text-sm text-[#6b6b6b] whitespace-pre-line">
              {selectedTemplate.content}
            </p>
          </div>

          <button
            onClick={saveTemplate}
            className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] flex items-center gap-2"
          >
            <Save size={16} />
            Save Template
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