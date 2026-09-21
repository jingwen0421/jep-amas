import { Activity } from 'lucide-react';
import type { UserActivity } from '../../types/user';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  activities: UserActivity[];
}

export default function LoginActivity({ activities }: Props) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg text-[#284342]">
          {t('userManagement.loginActivity.title')}
        </h2>

        <Activity
          size={20}
          className="text-[#284342]"
        />
      </div>

      <div className="space-y-3">

        {activities.length === 0 && (
          <div className="text-center text-[#6b6b6b] py-8">
            {t('userManagement.loginActivity.empty')}
          </div>
        )}

        {activities.map((activity) => (
          <div
            key={activity.id}
            className="p-4 rounded-lg bg-[#f8f8f6]"
          >
            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm text-[#284342]">
                  {activity.action}
                </p>

                <p className="text-xs text-[#6b6b6b] mt-1">
                  {activity.module}
                </p>
              </div>

              <span className="text-xs text-[#6b6b6b]">
                {activity.time}
              </span>

            </div>
          </div>
        ))}

      </div>
    </div>
  );
}