import { ShieldCheck, Lock, KeyRound, Activity } from 'lucide-react';
import type { SystemUser, UserActivity } from '../../types/user';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  users: SystemUser[];
  activities: UserActivity[];
}

export default function SecuritySummary({ users, activities }: Props) {
  const { t } = useLanguage();
  const activeUsers = users.filter((user) => user.status === 'Active').length;
  const inactiveUsers = users.filter((user) => user.status === 'Inactive').length;
  const recentSecurityActions = activities.length;

  const cards = [
    {
      label: t('userManagement.security.activeAccounts'),
      value: activeUsers,
      icon: <ShieldCheck size={22} />,
      color: 'text-green-700',
    },
    {
      label: t('userManagement.security.inactiveAccounts'),
      value: inactiveUsers,
      icon: <Lock size={22} />,
      color: 'text-red-700',
    },
    {
      label: t('userManagement.security.passwordResets'),
      value: activities.filter((item) =>
        item.action.toLowerCase().includes('password')
      ).length,
      icon: <KeyRound size={22} />,
      color: 'text-blue-700',
    },
    {
      label: t('userManagement.security.securityEvents'),
      value: recentSecurityActions,
      icon: <Activity size={22} />,
      color: 'text-[#284342]',
    },
  ];

  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <h2 className="text-lg text-[#284342] mb-4">{t('userManagement.security.title')}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="p-4 rounded-lg bg-[#f8f8f6]">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg bg-[#e9da95]/20 ${card.color}`}>
                {card.icon}
              </div>

              <div>
                <p className="text-sm text-[#6b6b6b]">{card.label}</p>
                <p className={`text-2xl ${card.color}`}>{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}