import { History, User, FileText, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuditLog {
  id: string;
  user: string;
  role: string;
  action: string;
  module: string;
  timestamp: string;
  details: string;
}

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('All');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

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
      user: getUserName(log.users),
      role: getUserRole(log.users),
      action: log.action || '-',
      module: log.module || '-',
      timestamp: log.created_at
        ? new Date(log.created_at).toLocaleString()
        : '-',
      details: getLogDetails(log),
    }));

    setLogs(mapped);
    setLoading(false);
  }

  async function addDemoLog() {
    const { error } = await supabase.from('audit_logs').insert({
      user_id: null,
      action: 'Demo Action',
      module: 'Audit Logs',
      target_id: null,
      old_data: null,
      new_data: {
        user: localStorage.getItem('userName') || 'Wong Jing Wen',
        role: localStorage.getItem('userRole') || 'super_admin',
        details: 'Generated a demo audit log entry.',
      },
      created_at: new Date().toISOString(),
    });

    if (error) {
      alert(`Failed to add log: ${error.message}`);
      return;
    }

    fetchLogs();
  }

  const modules = ['All', ...Array.from(new Set(logs.map((log) => log.module)))];

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = filterModule === 'All' || log.module === filterModule;

    return matchesSearch && matchesModule;
  });

  const today = new Date().toISOString().slice(0, 10);

  const actionsToday = logs.filter((log) => {
    if (!log.timestamp || log.timestamp === '-') return false;
    return new Date(log.timestamp).toISOString().slice(0, 10) === today;
  }).length;

  const activeUsers = new Set(logs.map((log) => log.user)).size;
  const totalModules = new Set(logs.map((log) => log.module)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Audit Logs</h1>
          <p className="text-[#6b6b6b] mt-1">
            Track all system activities and user actions
          </p>
        </div>

        <button
          onClick={addDemoLog}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
        >
          Add Demo Log
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b6b6b]"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by user, action, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            />
          </div>

          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
          >
            {modules.map((module) => (
              <option key={module} value={module}>
                {module === 'All' ? 'All Modules' : module}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Timestamp</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">User</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Role</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Module</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Action</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Details</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#6b6b6b]">
                    Loading audit logs...
                  </td>
                </tr>
              )}

              {!loading && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#6b6b6b]">
                    No audit logs found.
                  </td>
                </tr>
              )}

              {!loading &&
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#f8f8f6] transition-colors">
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {log.timestamp}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#e9da95]/30 flex items-center justify-center">
                          <User size={16} className="text-[#284342]" />
                        </div>
                        <span className="text-sm text-[#284342]">{log.user}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs px-3 py-1 rounded-full bg-[#f8f8f6] text-[#284342]">
                        {log.role}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {log.module}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <History size={16} className="text-[#284342]" />
                        <span className="text-sm text-[#284342]">{log.action}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-[#6b6b6b] max-w-md truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm text-[#6b6b6b]">
          <p>
            Showing {filteredLogs.length} of {logs.length} logs
          </p>

          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors">
              Previous
            </button>
            <button className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95]">
              1
            </button>
            <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
        <h2 className="text-lg text-[#284342] mb-4">Activity Summary</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard icon={<FileText size={24} />} value={actionsToday.toString()} label="Actions Today" />
          <SummaryCard icon={<User size={24} />} value={activeUsers.toString()} label="Active Users" />
          <SummaryCard icon={<History size={24} />} value={logs.length.toString()} label="Total Logs" />
          <SummaryCard icon={<FileText size={24} />} value={totalModules.toString()} label="Modules Tracked" />
        </div>
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
    <div className="text-center p-4 rounded-lg bg-[#f8f8f6]">
      <div className="mx-auto text-[#284342] mb-2 flex justify-center">{icon}</div>
      <p className="text-2xl text-[#284342] mb-1">{value}</p>
      <p className="text-xs text-[#6b6b6b]">{label}</p>
    </div>
  );
}

function getUserName(user: any) {
  if (!user) return 'System';
  if (Array.isArray(user)) return user[0]?.full_name || 'System';
  return user.full_name || 'System';
}

function getUserRole(user: any) {
  if (!user) return 'System';
  if (Array.isArray(user)) return formatRole(user[0]?.role || 'System');
  return formatRole(user.role || 'System');
}

function getLogDetails(log: any) {
  if (log.new_data) return JSON.stringify(log.new_data);
  if (log.old_data) return JSON.stringify(log.old_data);
  return log.target_id || '-';
}

function formatRole(role: string) {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'admin') return 'Admin';
  if (role === 'teacher') return 'Teacher';
  if (role === 'finance') return 'Finance Staff';
  if (role === 'owner') return 'Owner';
  if (role === 'student') return 'Student';
  return role;
}