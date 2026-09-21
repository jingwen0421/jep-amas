import { History, User, FileText, Search, Shield, CalendarDays } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';

type Translate = (key: string, params?: Record<string, string | number>) => string;

interface AuditLog {
  id: string;
  user: string;
  role: string;
  action: string;
  module: string;
  timestamp: string;
  rawDate: string;
  details: string;
}

export default function AuditLogs() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('All');
  const [filterAction, setFilterAction] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const pageSize = 10;

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);

    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        id,
        action,
        module,
        target_id,
        old_data,
        new_data,
        created_at,
        users(full_name, role)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit logs:', error.message);
      setLoading(false);
      return;
    }

    const mapped: AuditLog[] = (data || []).map((log: any) => ({
      id: log.id,
      user: getUserName(log.users, log.new_data),
      role: getUserRole(log.users, log.new_data),
      action: log.action || '-',
      module: log.module || '-',
      rawDate: log.created_at || '',
      timestamp: log.created_at ? new Date(log.created_at).toLocaleString() : '-',
      details: getLogDetails(log),
    }));

    setLogs(mapped);
    setLoading(false);
  }

  const modules = ['All', ...Array.from(new Set(logs.map((log) => log.module)))];
  const actions = ['All', ...Array.from(new Set(logs.map((log) => log.action)))];

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        translateUserName(log.user, t).toLowerCase().includes(search) ||
        translateRole(log.role, t).toLowerCase().includes(search) ||
        translateAction(log.action, t).toLowerCase().includes(search) ||
        translateModule(log.module, t).toLowerCase().includes(search) ||
        log.details.toLowerCase().includes(search);

      const matchesModule = filterModule === 'All' || log.module === filterModule;
      const matchesAction = filterAction === 'All' || log.action === filterAction;

      const matchesDate =
        !filterDate ||
        (log.rawDate && new Date(log.rawDate).toISOString().slice(0, 10) === filterDate);

      return matchesSearch && matchesModule && matchesAction && matchesDate;
    });
  }, [logs, searchTerm, filterModule, filterAction, filterDate, t]);

  const totalPages = Math.max(Math.ceil(filteredLogs.length / pageSize), 1);

  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  const today = new Date().toISOString().slice(0, 10);

  const actionsToday = logs.filter(
    (log) => log.rawDate && new Date(log.rawDate).toISOString().slice(0, 10) === today
  ).length;

  const activeUsers = new Set(logs.map((log) => log.user)).size;
  const totalModules = new Set(logs.map((log) => log.module)).size;
  const systemActions = logs.filter((log) => log.user === SYSTEM_MARKER).length;

  function resetFilters() {
    setSearchTerm('');
    setFilterModule('All');
    setFilterAction('All');
    setFilterDate('');
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">{t('auditLogs.title')}</h1>
        <p className="text-[#6b6b6b] mt-1">
          {t('auditLogs.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard icon={<CalendarDays size={24} />} value={actionsToday.toString()} label={t('auditLogs.stat.actionsToday')} />
        <SummaryCard icon={<User size={24} />} value={activeUsers.toString()} label={t('auditLogs.stat.activeUsers')} />
        <SummaryCard icon={<History size={24} />} value={logs.length.toString()} label={t('auditLogs.stat.totalLogs')} />
        <SummaryCard icon={<Shield size={24} />} value={systemActions.toString()} label={t('auditLogs.stat.systemActions')} />
      </div>

      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]"
              size={20}
            />
            <input
              type="text"
              placeholder={t('auditLogs.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            />
          </div>

          <select
            value={filterModule}
            onChange={(e) => {
              setFilterModule(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
          >
            {modules.map((module) => (
              <option key={module} value={module}>
                {module === 'All' ? t('auditLogs.allModules') : translateModule(module, t)}
              </option>
            ))}
          </select>

          <select
            value={filterAction}
            onChange={(e) => {
              setFilterAction(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
          >
            {actions.map((action) => (
              <option key={action} value={action}>
                {action === 'All' ? t('auditLogs.allActions') : translateAction(action, t)}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
          />
        </div>

        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-[#6b6b6b]">
            {t('auditLogs.showingCount', { shown: filteredLogs.length, total: logs.length })}
          </p>

          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-sm text-[#284342] hover:bg-[#f8f8f6]"
          >
            {t('auditLogs.resetFilters')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">{t('auditLogs.timeline')}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('auditLogs.col.time')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('auditLogs.col.user')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('auditLogs.col.module')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('auditLogs.col.action')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('auditLogs.col.details')}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#6b6b6b]">
                    {t('auditLogs.loading')}
                  </td>
                </tr>
              )}

              {!loading && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#6b6b6b]">
                    {t('auditLogs.empty')}
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#f8f8f6] transition-colors">
                    <td className="px-6 py-4 text-sm text-[#6b6b6b] whitespace-nowrap">
                      {log.timestamp}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#e9da95]/30 flex items-center justify-center">
                          <User size={16} className="text-[#284342]" />
                        </div>
                        <div>
                          <p className="text-sm text-[#284342]">{translateUserName(log.user, t)}</p>
                          <p className="text-xs text-[#6b6b6b]">{translateRole(log.role, t)}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs px-3 py-1 rounded-full bg-[#e9da95]/20 text-[#284342]">
                        {translateModule(log.module, t)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <History size={16} className="text-[#284342]" />
                        <span className="text-sm text-[#284342]">{translateAction(log.action, t)}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-[#6b6b6b] max-w-xl">
                      <span className="line-clamp-2">{log.details}</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && filteredLogs.length > 0 && (
          <div className="p-4 border-t border-[rgba(40,67,66,0.1)] flex items-center justify-between">
            <p className="text-sm text-[#6b6b6b]">
              {t('auditLogs.pageOf', { page, total: totalPages })}
            </p>

            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] disabled:opacity-40"
              >
                {t('auditLogs.previous')}
              </button>

              <button className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95]">
                {page}
              </button>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] disabled:opacity-40"
              >
                {t('auditLogs.next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-[#e9da95]/20 text-[#284342]">
          {icon}
        </div>
        <div>
          <p className="text-sm text-[#6b6b6b]">{label}</p>
          <p className="text-2xl text-[#284342]">{value}</p>
        </div>
      </div>
    </div>
  );
}

const SYSTEM_MARKER = '__system__';

function getUserName(user: any, newData?: any) {
  if (newData?.user) return newData.user;
  if (newData?.name) return newData.name;

  if (!user) return SYSTEM_MARKER;
  if (Array.isArray(user)) return user[0]?.full_name || SYSTEM_MARKER;
  return user.full_name || SYSTEM_MARKER;
}

function getUserRole(user: any, newData?: any) {
  if (newData?.role) return newData.role;

  if (!user) return SYSTEM_MARKER;
  if (Array.isArray(user)) return user[0]?.role || SYSTEM_MARKER;
  return user.role || SYSTEM_MARKER;
}

function translateUserName(user: string, t: Translate) {
  return user === SYSTEM_MARKER ? t('auditLogs.systemFallback') : user;
}

function translateRole(role: string, t: Translate) {
  if (role === SYSTEM_MARKER) return t('auditLogs.systemFallback');

  const ownKey = OWN_ROLE_KEYS[role];
  if (ownKey) return t(ownKey);

  const key = `login.role.${roleToKey(role)}`;
  const translated = t(key);
  return translated === key ? formatRole(role) : translated;
}

const OWN_ROLE_KEYS: Record<string, string> = {
  super_admin: 'auditLogs.role.superAdmin',
  owner: 'auditLogs.role.owner',
};

function roleToKey(role: string) {
  const map: Record<string, string> = {
    admin: 'admin',
    teacher: 'teacher',
    assistant_teacher: 'assistantTeacher',
    student: 'student',
    finance: 'finance',
    internal_sales: 'internalSales',
    external_sales: 'externalSales',
    parent: 'parent',
  };
  return map[role] || role;
}

function getLogDetails(log: any) {
  const data = log.new_data || log.old_data;

  if (!data) return log.target_id || '-';

  if (typeof data === 'string') return data;

  const readable = Object.entries(data)
    .map(([key, value]) => `${formatKey(key)}: ${String(value)}`)
    .join(' • ');

  return readable || '-';
}

function formatKey(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

const MODULE_KEYS: Record<string, string> = {
  'Document Center': 'auditLogs.module.documentCenter',
  Certificates: 'auditLogs.module.certificates',
  Payments: 'auditLogs.module.payments',
  'User Management': 'auditLogs.module.userManagement',
  'Student Registration': 'auditLogs.module.studentRegistration',
  Authentication: 'auditLogs.module.authentication',
  Portfolio: 'auditLogs.module.portfolio',
  'Student Management': 'auditLogs.module.studentManagement',
  Receipts: 'auditLogs.module.receipts',
  Communications: 'auditLogs.module.communications',
  Settings: 'auditLogs.module.settings',
  System: 'auditLogs.module.system',
};

function translateModule(module: string, t: Translate) {
  const key = MODULE_KEYS[module];
  return key ? t(key) : module;
}

const ACTION_KEYS: Record<string, string> = {
  'Payment Reminder Sent': 'auditLogs.action.paymentReminderSent',
  'Full Attendance Certificate Issued': 'auditLogs.action.attendanceCertIssued',
  'Document Uploaded': 'auditLogs.action.documentUploaded',
  'Completion Certificate Issued': 'auditLogs.action.completionCertIssued',
  'Logged In': 'auditLogs.action.loggedIn',
  'User Invitation Sent': 'auditLogs.action.userInvitationSent',
  'User Invitation Resent': 'auditLogs.action.userInvitationResent',
  'Payment Recorded': 'auditLogs.action.paymentRecorded',
  'Payment Plan Created': 'auditLogs.action.paymentPlanCreated',
  'Payment Plan Updated': 'auditLogs.action.paymentPlanUpdated',
  'Portfolio Submitted': 'auditLogs.action.portfolioSubmitted',
  'Portfolio Approved': 'auditLogs.action.portfolioApproved',
  'Portfolio Revision Requested': 'auditLogs.action.portfolioRevisionRequested',
  'Student Status Updated': 'auditLogs.action.studentStatusUpdated',
  'Student Profile Updated': 'auditLogs.action.studentProfileUpdated',
  'Student Registration Submitted': 'auditLogs.action.studentRegistrationSubmitted',
  'Updated Settings': 'auditLogs.action.updatedSettings',
  'Viewed User Management': 'auditLogs.action.viewedUserManagement',
  'User Created': 'auditLogs.action.userCreated',
  'User Updated': 'auditLogs.action.userUpdated',
  'User Activated': 'auditLogs.action.userActivated',
  'User Deactivated': 'auditLogs.action.userDeactivated',
  'Account Approved': 'auditLogs.action.accountApproved',
  'Account Rejected': 'auditLogs.action.accountRejected',
};

function translateAction(action: string, t: Translate) {
  const key = ACTION_KEYS[action];
  return key ? t(key) : action;
}

function formatRole(role: string) {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'admin') return 'Admin';
  if (role === 'owner') return 'Owner';
  if (role === 'teacher') return 'Teacher';
  if (role === 'assistant_teacher') return 'Assistant Teacher';
  if (role === 'student') return 'Student';
  if (role === 'finance') return 'Finance Staff';
  if (role === 'internal_sales') return 'Internal Sales';
  if (role === 'external_sales') return 'External Sales';
  if (role === 'parent') return 'Parent / Guardian';

  return role;
}