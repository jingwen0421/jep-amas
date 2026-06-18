import { useEffect, useState } from 'react';
import {
  Building2,
  Shield,
  Bell,
  MessageSquare,
  Mail,
  Settings as SettingsIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AcademyForm {
  id: string;
  academyName: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  status: string;
}

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [academy, setAcademy] = useState<AcademyForm>({
    id: '',
    academyName: 'JEP Image Makeup Academy',
    logoUrl: '',
    primaryColor: '#284342',
    accentColor: '#e9da95',
    status: 'active',
  });

  const roles = [
    { name: 'Super Admin', description: 'Full system access' },
    { name: 'Owner', description: 'Business analytics and reports' },
    { name: 'Admin', description: 'Academy administration' },
    { name: 'Teacher', description: 'Class and student management' },
    { name: 'Finance Staff', description: 'Payment management' },
    { name: 'Student', description: 'Course and portfolio access' },
  ];

  const notifications = [
    'Payment Reminders',
    'Class Reminders',
    'Registration Notifications',
    'Certificate Ready',
    'Attendance Alerts',
  ];

  const whatsappTemplates = [
    'Class Reminder',
    'Payment Reminder',
    'Appointment Reminder',
    'Course Update',
    'Certificate Ready',
    'Attendance Warning',
  ];

  const emailTemplates = [
    'Welcome Email',
    'Registration Approved',
    'Payment Confirmation',
    'Course Completion',
    'Invoice',
    'General Announcement',
  ];

  useEffect(() => {
    fetchAcademy();
  }, []);

  async function fetchAcademy() {
    setLoading(true);

    const { data, error } = await supabase
      .from('academies')
      .select('id, academy_name, logo_url, primary_color, accent_color, status')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching academy:', error.message);
      setLoading(false);
      return;
    }

    setAcademy({
      id: data.id,
      academyName: data.academy_name || 'JEP Image Makeup Academy',
      logoUrl: data.logo_url || '',
      primaryColor: data.primary_color || '#284342',
      accentColor: data.accent_color || '#e9da95',
      status: data.status || 'active',
    });

    setLoading(false);
  }

  async function saveAcademy() {
    if (!academy.academyName.trim()) {
      alert('Academy name is required.');
      return;
    }

    if (academy.id) {
      const { error } = await supabase
        .from('academies')
        .update({
          academy_name: academy.academyName,
          logo_url: academy.logoUrl || null,
          primary_color: academy.primaryColor,
          accent_color: academy.accentColor,
          status: academy.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', academy.id);

      if (error) {
        alert(`Failed to save settings: ${error.message}`);
        return;
      }
    } else {
      const { error } = await supabase.from('academies').insert({
        academy_name: academy.academyName,
        logo_url: academy.logoUrl || null,
        primary_color: academy.primaryColor,
        accent_color: academy.accentColor,
        status: academy.status,
      });

      if (error) {
        alert(`Failed to create academy settings: ${error.message}`);
        return;
      }
    }

    alert('Academy settings saved.');
    fetchAcademy();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">Settings</h1>
        <p className="text-[#6b6b6b] mt-1">
          Configure academy system preferences
        </p>
      </div>

      {loading && (
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
          Loading settings...
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
            <SectionHeader
              icon={<Building2 size={24} className="text-[#284342]" />}
              title="Academy Information"
            />

            <div className="space-y-4">
              <Input
                label="Academy Name"
                value={academy.academyName}
                onChange={(value) =>
                  setAcademy((prev) => ({ ...prev, academyName: value }))
                }
              />

              <Input
                label="Logo URL"
                value={academy.logoUrl}
                onChange={(value) =>
                  setAcademy((prev) => ({ ...prev, logoUrl: value }))
                }
                placeholder="https://..."
              />

              <Input
                label="Primary Color"
                value={academy.primaryColor}
                onChange={(value) =>
                  setAcademy((prev) => ({ ...prev, primaryColor: value }))
                }
              />

              <Input
                label="Accent Color"
                value={academy.accentColor}
                onChange={(value) =>
                  setAcademy((prev) => ({ ...prev, accentColor: value }))
                }
              />

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Status
                </label>
                <select
                  value={academy.status}
                  onChange={(e) =>
                    setAcademy((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <button
                onClick={saveAcademy}
                className="w-full py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
            <SectionHeader
              icon={<Shield size={24} className="text-[#284342]" />}
              title="User Roles & Permissions"
            />

            <div className="space-y-4">
              {roles.map((role) => (
                <div
                  key={role.name}
                  className="p-4 rounded-lg border border-[rgba(40,67,66,0.1)] hover:border-[#e9da95] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#284342]">{role.name}</p>
                      <p className="text-xs text-[#6b6b6b] mt-1">
                        {role.description}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded text-xs bg-[#f8f8f6] text-[#284342]">
                      Demo
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
            <SectionHeader
              icon={<Bell size={24} className="text-[#284342]" />}
              title="Notification Settings"
            />

            <div className="space-y-4">
              {notifications.map((notification) => (
                <label
                  key={notification}
                  className="flex items-center justify-between p-3 rounded-lg border border-[rgba(40,67,66,0.1)] cursor-pointer hover:bg-[#f8f8f6]"
                >
                  <span className="text-sm text-[#284342]">
                    {notification}
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-[rgba(40,67,66,0.2)] text-[#284342] focus:ring-2 focus:ring-[#284342]"
                  />
                </label>
              ))}
            </div>
          </div>

          <TemplateCard
            icon={<MessageSquare size={24} className="text-[#284342]" />}
            title="WhatsApp Templates"
            templates={whatsappTemplates}
          />

          <TemplateCard
            icon={<Mail size={24} className="text-[#284342]" />}
            title="Email Templates"
            templates={emailTemplates}
          />

          <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
            <SectionHeader
              icon={<SettingsIcon size={24} className="text-[#284342]" />}
              title="System Preferences"
            />

            <div className="space-y-4">
              <Select label="Default Language" options={['English', 'Bahasa Malaysia', 'Mandarin']} />
              <Select label="Time Zone" options={['GMT+8 (Malaysia)', 'GMT+0 (UTC)']} />

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Currency
                </label>
                <input
                  type="text"
                  value="Malaysian Ringgit (RM)"
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-[#f8f8f6] text-[#6b6b6b]"
                />
              </div>

              <button
                onClick={() => alert('System preferences saved for demo.')}
                className="w-full py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 rounded-lg bg-[#e9da95]/20">{icon}</div>
      <h2 className="text-xl text-[#284342]">{title}</h2>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-[#284342] mb-2">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
      />
    </div>
  );
}

function Select({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <label className="block text-sm text-[#284342] mb-2">{label}</label>
      <select className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function TemplateCard({
  icon,
  title,
  templates,
}: {
  icon: React.ReactNode;
  title: string;
  templates: string[];
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <SectionHeader icon={icon} title={title} />

      <div className="space-y-3">
        {templates.map((template) => (
          <div
            key={template}
            className="p-3 rounded-lg border border-[rgba(40,67,66,0.1)] flex items-center justify-between hover:border-[#e9da95] transition-colors"
          >
            <span className="text-sm text-[#284342]">{template}</span>
            <button
              onClick={() => alert(`${template} template editor is demo only.`)}
              className="px-3 py-1 rounded text-xs border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}