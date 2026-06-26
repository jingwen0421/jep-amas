import { Bell } from 'lucide-react';

const notificationTypes = [
  'Payment Reminders',
  'Class Reminders',
  'Registration Notifications',
  'Certificate Ready',
  'Attendance Alerts',
  'Portfolio Submitted',
];

export default function NotificationSettings() {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <SectionTitle icon={<Bell size={22} />} title="Notification Settings" />

      <div className="space-y-3">
        {notificationTypes.map((item) => (
          <div
            key={item}
            className="p-4 rounded-lg border border-[rgba(40,67,66,0.1)]"
          >
            <p className="text-sm text-[#284342] mb-3">{item}</p>

            <div className="grid grid-cols-3 gap-3">
              <Toggle label="In App" />
              <Toggle label="WhatsApp" />
              <Toggle label="Email" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Toggle({ label }: { label: string }) {
  return (
    <label className="flex items-center justify-between text-sm text-[#6b6b6b] cursor-pointer">
      <span>{label}</span>

      <input type="checkbox" defaultChecked className="peer sr-only" />

      <span className="relative w-11 h-6 rounded-full bg-[#d9d9d9] transition-colors peer-checked:bg-[#284342]">
        <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 rounded-lg bg-[#e9da95]/20 text-[#284342]">{icon}</div>
      <h2 className="text-xl text-[#284342]">{title}</h2>
    </div>
  );
}