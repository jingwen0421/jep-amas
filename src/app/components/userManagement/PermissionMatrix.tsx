import { CheckCircle2, XCircle } from 'lucide-react';
import { roles, translateRole } from '../../utils/userHelpers';
import { useLanguage } from '../../context/LanguageContext';

const modules = [
  'Students',
  'Courses',
  'Classes',
  'Attendance',
  'Payments',
  'Portfolio',
  'Certificates',
  'Reports',
  'Documents',
  'Settings',
  'Users',
  'Audit Logs',
];

const MODULE_KEYS: Record<string, string> = {
  Students: 'userManagement.permissionMatrix.module.students',
  Courses: 'userManagement.permissionMatrix.module.courses',
  Classes: 'userManagement.permissionMatrix.module.classes',
  Attendance: 'userManagement.permissionMatrix.module.attendance',
  Payments: 'userManagement.permissionMatrix.module.payments',
  Portfolio: 'userManagement.permissionMatrix.module.portfolio',
  Certificates: 'userManagement.permissionMatrix.module.certificates',
  Reports: 'userManagement.permissionMatrix.module.reports',
  Documents: 'userManagement.permissionMatrix.module.documents',
  Settings: 'userManagement.permissionMatrix.module.settings',
  Users: 'userManagement.permissionMatrix.module.users',
  'Audit Logs': 'userManagement.permissionMatrix.module.auditLogs',
};

const matrix: Record<string, string[]> = {
  super_admin: modules,
  admin: [
    'Students',
    'Courses',
    'Classes',
    'Attendance',
    'Portfolio',
    'Certificates',
    'Reports',
    'Documents',
  ],
  owner: ['Reports', 'Audit Logs', 'Documents'],
  teacher: ['Classes', 'Attendance', 'Portfolio', 'Certificates'],
  assistant_teacher: ['Attendance', 'Portfolio', 'Documents'],
  finance: ['Payments', 'Reports', 'Documents'],
  internal_sales: ['Students', 'Payments', 'Reports'],
  external_sales: ['Students', 'Payments'],
  student: ['Portfolio', 'Certificates', 'Documents'],
  parent: ['Certificates', 'Payments'],
};

export default function PermissionMatrix() {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <h2 className="text-lg text-[#284342] mb-4">{t('userManagement.permissionMatrix.title')}</h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#f8f8f6]">
            <tr>
              <th className="px-4 py-3 text-left text-sm text-[#284342]">
                {t('userManagement.permissionMatrix.module')}
              </th>

              {roles.map((role) => (
                <th key={role} className="px-4 py-3 text-center text-sm text-[#284342]">
                  {translateRole(role, t)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
            {modules.map((module) => (
              <tr key={module} className="hover:bg-[#f8f8f6]">
                <td className="px-4 py-3 text-sm text-[#284342]">
                  {t(MODULE_KEYS[module])}
                </td>

                {roles.map((role) => {
                  const allowed = matrix[role]?.includes(module);

                  return (
                    <td key={`${role}-${module}`} className="px-4 py-3">
                      <div className="flex justify-center">
                        {allowed ? (
                          <CheckCircle2 size={18} className="text-green-700" />
                        ) : (
                          <XCircle size={18} className="text-red-300" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}