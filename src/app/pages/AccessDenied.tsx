import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router';
import { useLanguage } from '../context/LanguageContext';

export default function AccessDenied() {
  const { t } = useLanguage();
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="bg-white rounded-xl p-10 border border-[rgba(40,67,66,0.1)] text-center max-w-md">
        <ShieldAlert size={56} className="mx-auto text-red-700 mb-4" />

        <h1 className="text-2xl text-[#284342] mb-2">{t('accessDenied.title')}</h1>

        <p className="text-[#6b6b6b] mb-6">
          {t('accessDenied.message')}
        </p>

        <Link
          to="/app/dashboard"
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg inline-block"
        >
          {t('accessDenied.backToDashboard')}
        </Link>
      </div>
    </div>
  );
}