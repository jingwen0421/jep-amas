import { Bell } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const notificationTypeKeys = [
  'settings.notifType.paymentReminders',
  'settings.notifType.classReminders',
  'settings.notifType.registrationNotifications',
  'settings.notifType.certificateReady',
  'settings.notifType.attendanceAlerts',
  'settings.notifType.portfolioSubmitted',
];

export default function NotificationSettings() {
  const { t } = useLanguage();
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <SectionTitle icon={<Bell size={22} />} title={t('settings.notificationSettings')} />

      <div className="space-y-3">
        {notificationTypeKeys.map((key) => (
          <div
            key={key}
            className="p-4 rounded-lg border border-[rgba(40,67,66,0.1)]"
          >
            <p className="text-sm text-[#284342] mb-3">{t(key)}</p>

            <div className="grid grid-cols-3 gap-3">
              <Toggle label={t('settings.channel.inApp')} />
              <Toggle label={t('settings.channel.whatsapp')} />
              <Toggle label={t('settings.channel.email')} />
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