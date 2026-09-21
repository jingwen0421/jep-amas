import { Activity } from 'lucide-react';
import type { UserActivity } from '../../types/user';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  activities: UserActivity[];
}

// audit_logs.action/module are free-form strings written across the app —
// only the small, known set that getUserActivities() actually queries for
// (module in User Management / Authentication / Settings) is mapped here;
// anything else falls back to the raw text rather than the raw key.
const ACTION_KEYS: Record<string, string> = {
  'Logged In': 'userManagement.loginActivity.action.loggedIn',
  'User Created': 'userManagement.loginActivity.action.userCreated',
  'User Updated': 'userManagement.loginActivity.action.userUpdated',
  'User Activated': 'userManagement.loginActivity.action.userActivated',
  'User Deactivated': 'userManagement.loginActivity.action.userDeactivated',
  'Account Approved': 'userManagement.loginActivity.action.accountApproved',
  'Account Rejected': 'userManagement.loginActivity.action.accountRejected',
  'User Invitation Sent': 'userManagement.loginActivity.action.invitationSent',
  'User Invitation Resent': 'userManagement.loginActivity.action.invitationResent',
};

const MODULE_KEYS: Record<string, string> = {
  Authentication: 'userManagement.loginActivity.module.authentication',
  'User Management': 'userManagement.loginActivity.module.userManagement',
  Settings: 'userManagement.loginActivity.module.settings',
};

export default function LoginActivity({ activities }: Props) {
  const { t } = useLanguage();

  function translateAction(action: string) {
    const key = ACTION_KEYS[action];
    return key ? t(key) : action;
  }

  function translateModule(module: string) {
    const key = MODULE_KEYS[module];
    return key ? t(key) : module;
  }

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
                  {translateAction(activity.action)}
                </p>

                <p className="text-xs text-[#6b6b6b] mt-1">
                  {translateModule(activity.module)}
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