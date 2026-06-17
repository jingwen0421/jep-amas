import { Building2, Shield, Bell, MessageSquare, Mail, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">Settings</h1>
        <p className="text-[#6b6b6b] mt-1">Configure academy system preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-[#e9da95]/20">
              <Building2 size={24} className="text-[#284342]" />
            </div>
            <h2 className="text-xl text-[#284342]">Academy Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#284342] mb-2">Academy Name</label>
              <input type="text" value="JEP Image Makeup Academy" className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]" />
            </div>
            <div>
              <label className="block text-sm text-[#284342] mb-2">Contact Email</label>
              <input type="email" value="info@jepacademy.com" className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]" />
            </div>
            <div>
              <label className="block text-sm text-[#284342] mb-2">Phone Number</label>
              <input type="tel" value="+60 3-1234 5678" className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]" />
            </div>
            <div>
              <label className="block text-sm text-[#284342] mb-2">Address</label>
              <textarea rows={3} value="123 Beauty Street, Kuala Lumpur, Malaysia" className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]" />
            </div>
            <button className="w-full py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors">
              Save Changes
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-[#e9da95]/20">
              <Shield size={24} className="text-[#284342]" />
            </div>
            <h2 className="text-xl text-[#284342]">User Roles & Permissions</h2>
          </div>

          <div className="space-y-4">
            {['Super Admin', 'Admin', 'Teacher', 'Finance Staff', 'Student', 'Owner'].map((role) => (
              <div key={role} className="p-4 rounded-lg border border-[rgba(40,67,66,0.1)] hover:border-[#e9da95] transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#284342]">{role}</p>
                    <p className="text-xs text-[#6b6b6b] mt-1">
                      {role === 'Super Admin' && 'Full system access'}
                      {role === 'Admin' && 'Academy administration'}
                      {role === 'Teacher' && 'Class and student management'}
                      {role === 'Finance Staff' && 'Payment management'}
                      {role === 'Student' && 'Course and portfolio access'}
                      {role === 'Owner' && 'Business analytics'}
                    </p>
                  </div>
                  <button className="px-3 py-1 rounded text-xs border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-[#e9da95]/20">
              <Bell size={24} className="text-[#284342]" />
            </div>
            <h2 className="text-xl text-[#284342]">Notification Settings</h2>
          </div>

          <div className="space-y-4">
            {['Payment Reminders', 'Class Reminders', 'Registration Notifications', 'Certificate Ready', 'Attendance Alerts'].map((notification) => (
              <label key={notification} className="flex items-center justify-between p-3 rounded-lg border border-[rgba(40,67,66,0.1)] cursor-pointer hover:bg-[#f8f8f6]">
                <span className="text-sm text-[#284342]">{notification}</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-[rgba(40,67,66,0.2)] text-[#284342] focus:ring-2 focus:ring-[#284342]" />
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-[#e9da95]/20">
              <MessageSquare size={24} className="text-[#284342]" />
            </div>
            <h2 className="text-xl text-[#284342]">WhatsApp Templates</h2>
          </div>

          <div className="space-y-3">
            {['Class Reminder', 'Payment Reminder', 'Appointment Reminder', 'Course Update', 'Certificate Ready', 'Attendance Warning'].map((template) => (
              <div key={template} className="p-3 rounded-lg border border-[rgba(40,67,66,0.1)] flex items-center justify-between hover:border-[#e9da95] transition-colors cursor-pointer">
                <span className="text-sm text-[#284342]">{template}</span>
                <button className="px-3 py-1 rounded text-xs border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors">
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-[#e9da95]/20">
              <Mail size={24} className="text-[#284342]" />
            </div>
            <h2 className="text-xl text-[#284342]">Email Templates</h2>
          </div>

          <div className="space-y-3">
            {['Welcome Email', 'Registration Approved', 'Payment Confirmation', 'Course Completion', 'Invoice', 'General Announcement'].map((template) => (
              <div key={template} className="p-3 rounded-lg border border-[rgba(40,67,66,0.1)] flex items-center justify-between hover:border-[#e9da95] transition-colors cursor-pointer">
                <span className="text-sm text-[#284342]">{template}</span>
                <button className="px-3 py-1 rounded text-xs border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors">
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-[#e9da95]/20">
              <SettingsIcon size={24} className="text-[#284342]" />
            </div>
            <h2 className="text-xl text-[#284342]">System Preferences</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#284342] mb-2">Default Language</label>
              <select className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]">
                <option>English</option>
                <option>Bahasa Malaysia</option>
                <option>Mandarin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#284342] mb-2">Time Zone</label>
              <select className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]">
                <option>GMT+8 (Malaysia)</option>
                <option>GMT+0 (UTC)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#284342] mb-2">Currency</label>
              <input type="text" value="Malaysian Ringgit (RM)" disabled className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-[#f8f8f6] text-[#6b6b6b]" />
            </div>
            <button className="w-full py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors">
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
