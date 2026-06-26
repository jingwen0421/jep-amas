import NotificationSettings from '../components/settings/NotificationSettings';
import MessageTemplateEditor from '../components/settings/MessageTemplateEditor';
import AboutSystem from '../components/settings/AboutSystem';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">Settings</h1>
        <p className="text-[#6b6b6b] mt-1">
          Manage notification channels and message templates
        </p>
      </div>

      <NotificationSettings />

      <MessageTemplateEditor />

      <AboutSystem />
    </div>
  );
}