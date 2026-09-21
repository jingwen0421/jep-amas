import NotificationSettings from '../components/settings/NotificationSettings';
import MessageTemplateEditor from '../components/settings/MessageTemplateEditor';
import AboutSystem from '../components/settings/AboutSystem';
import { useLanguage } from '../context/LanguageContext';

export default function Settings() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">{t('settings.title')}</h1>
        <p className="text-[#6b6b6b] mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      <NotificationSettings />

      <MessageTemplateEditor />

      <AboutSystem />
    </div>
  );
}