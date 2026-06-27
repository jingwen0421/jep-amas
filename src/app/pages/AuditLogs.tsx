import { History, User, FileText, Search, Shield, CalendarDays } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

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
        log.user.toLowerCase().includes(search) ||
        log.role.toLowerCase().includes(search) ||
        log.action.toLowerCase().includes(search) ||
        log.module.toLowerCase().includes(search) ||
        log.details.toLowerCase().includes(search);

      const matchesModule = filterModule === 'All' || log.module === filterModule;
      const matchesAction = filterAction === 'All' || log.action === filterAction;

      const matchesDate =
        !filterDate ||
        (log.rawDate && new Date(log.rawDate).toISOString().slice(0, 10) === filterDate);

      return matchesSearch && matchesModule && matchesAction && matchesDate;
    });
  }, [logs, searchTerm, filterModule, filterAction, filterDate]);

  const totalPages = Math.max(Math.ceil(filteredLogs.length / pageSize), 1);

  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  const today = new Date().toISOString().slice(0, 10);

  const actionsToday = logs.filter(
    (log) => log.rawDate && new Date(log.rawDate).toISOString().slice(0, 10) === today
  ).length;

  const activeUsers = new Set(logs.map((log) => log.user)).size;
  const totalModules = new Set(logs.map((log) => log.module)).size;
  const systemActions = logs.filter((log) => log.user === 'System').length;

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
        <h1 className="text-3xl text-[#284342]">Audit Logs</h1>
        <p className="text-[#6b6b6b] mt-1">
          Track system activities, user actions, and important security events
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard icon={<CalendarDays size={24} />} value={actionsToday.toString()} label="Actions Today" />
        <SummaryCard icon={<User size={24} />} value={activeUsers.toString()} label="Active Users" />
        <SummaryCard icon={<History size={24} />} value={logs.length.toString()} label="Total Logs" />
        <SummaryCard icon={<Shield size={24} />} value={systemActions.toString()} label="System Actions" />
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
              placeholder="Search user, action, module, or details..."
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
                {module === 'All' ? 'All Modules' : module}
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
                {action === 'All' ? 'All Actions' : action}
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
            Showing {filteredLogs.length} of {logs.length} logs
          </p>

          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-sm text-[#284342] hover:bg-[#f8f8f6]"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">System Activity Timeline</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Time</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">User</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Module</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Action</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Details</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#6b6b6b]">
                    Loading audit logs...
                  </td>
                </tr>
              )}

              {!loading && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#6b6b6b]">
                    No audit logs found.
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
                          <p className="text-sm text-[#284342]">{log.user}</p>
                          <p className="text-xs text-[#6b6b6b]">{log.role}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs px-3 py-1 rounded-full bg-[#e9da95]/20 text-[#284342]">
                        {log.module}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <History size={16} className="text-[#284342]" />
                        <span className="text-sm text-[#284342]">{log.action}</span>
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
              Page {page} of {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] disabled:opacity-40"
              >
                Previous
              </button>

              <button className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95]">
                {page}
              </button>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] disabled:opacity-40"
              >
                Next
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

function getUserName(user: any, newData?: any) {
  if (newData?.user) return newData.user;
  if (newData?.name) return newData.name;

  if (!user) return 'System';
  if (Array.isArray(user)) return user[0]?.full_name || 'System';
  return user.full_name || 'System';
}

function getUserRole(user: any, newData?: any) {
  if (newData?.role) return formatRole(newData.role);

  if (!user) return 'System';
  if (Array.isArray(user)) return formatRole(user[0]?.role || 'System');
  return formatRole(user.role || 'System');
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