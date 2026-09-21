import { Shield } from 'lucide-react';
import type { SystemUser } from '../../types/user';
import { roles, translateRole } from '../../utils/userHelpers';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  users: SystemUser[];
}

const PERMISSION_KEYS: Record<string, string[]> = {
  super_admin: [
    'userManagement.permissions.superAdmin.fullAccess',
    'userManagement.permissions.superAdmin.manageUsers',
    'userManagement.permissions.superAdmin.manageSettings',
    'userManagement.permissions.superAdmin.viewAuditLogs',
  ],
  admin: [
    'userManagement.permissions.admin.manageStudents',
    'userManagement.permissions.admin.approveRegistrations',
    'userManagement.permissions.admin.manageClasses',
    'userManagement.permissions.admin.issueCertificates',
  ],
  owner: [
    'userManagement.permissions.owner.viewReports',
    'userManagement.permissions.owner.viewRevenue',
    'userManagement.permissions.owner.viewAnalytics',
    'userManagement.permissions.owner.monitorPerformance',
  ],
  teacher: [
    'userManagement.permissions.teacher.viewAssignedClasses',
    'userManagement.permissions.teacher.takeAttendance',
    'userManagement.permissions.teacher.reviewPortfolios',
    'userManagement.permissions.teacher.giveFeedback',
  ],
  assistant_teacher: [
    'userManagement.permissions.assistantTeacher.viewAssignedClasses',
    'userManagement.permissions.assistantTeacher.takeAttendance',
    'userManagement.permissions.assistantTeacher.assistPortfolioReview',
  ],
  finance: [
    'userManagement.permissions.finance.managePayments',
    'userManagement.permissions.finance.recordInstallments',
    'userManagement.permissions.finance.generateReceipts',
    'userManagement.permissions.finance.viewOutstandingBalances',
  ],
  internal_sales: [
    'userManagement.permissions.sales.manageLeadsDeals',
    'userManagement.permissions.sales.viewAssignedStudents',
    'userManagement.permissions.sales.followUpPayments',
  ],
  external_sales: [
    'userManagement.permissions.sales.manageLeadsDeals',
    'userManagement.permissions.sales.viewAssignedStudents',
    'userManagement.permissions.sales.followUpPayments',
  ],
  student: [
    'userManagement.permissions.student.viewOwnProfile',
    'userManagement.permissions.student.submitPortfolio',
    'userManagement.permissions.student.viewCertificates',
    'userManagement.permissions.student.viewPaymentStatus',
  ],
  parent: [
    'userManagement.permissions.parent.viewChildrenProgress',
    'userManagement.permissions.parent.viewCertificates',
    'userManagement.permissions.parent.viewChildrenBalance',
  ],
};

export default function RolePermissionCards({ users }: Props) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <h2 className="text-lg text-[#284342] mb-4">{t('userManagement.permissions.title')}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <div
            key={role}
            className="p-4 rounded-lg bg-[#f8f8f6] hover:bg-[#e9da95]/10 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-[#284342]" />
                <h3 className="text-sm text-[#284342]">{translateRole(role, t)}</h3>
              </div>

              <span className="text-xs text-[#6b6b6b]">
                {t('userManagement.permissions.usersCount', {
                  count: users.filter((user) => user.rawRole === role).length,
                })}
              </span>
            </div>

            <div className="space-y-1">
              {(PERMISSION_KEYS[role] || []).map((key) => (
                <p key={key} className="text-xs text-[#6b6b6b]">
                  • {t(key)}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}