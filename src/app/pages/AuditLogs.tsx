import { History, User, FileText, Search } from 'lucide-react';
import { useState } from 'react';

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

  const logs: AuditLog[] = [
    { id: 'A001', user: 'Admin Sarah', role: 'Admin', action: 'Approved Registration', module: 'Student Management', timestamp: '2026-06-02 14:30', details: 'Approved Jessica Lim (REG001)' },
    { id: 'A002', user: 'Finance Staff Lisa', role: 'Finance', action: 'Payment Updated', module: 'Payments', timestamp: '2026-06-02 14:15', details: 'Recorded RM 2,000 payment for Amanda Ng' },
    { id: 'A003', user: 'Teacher Michelle', role: 'Teacher', action: 'Attendance Modified', module: 'Attendance', timestamp: '2026-06-02 11:45', details: 'Updated attendance for Bridal Makeup class' },
    { id: 'A004', user: 'Admin Sarah', role: 'Admin', action: 'Certificate Generated', module: 'Certificates', timestamp: '2026-06-02 10:20', details: 'Generated certificate JEP-PMAC-2026-001' },
    { id: 'A005', user: 'Teacher Emily', role: 'Teacher', action: 'Student Edited', module: 'Student Management', timestamp: '2026-06-02 09:00', details: 'Updated student profile for Rachel Tan' },
    { id: 'A006', user: 'Admin Sarah', role: 'Admin', action: 'Class Scheduled', module: 'Class Management', timestamp: '2026-06-01 16:30', details: 'Scheduled Airbrush Techniques for June 10' },
    { id: 'A007', user: 'Finance Staff Lisa', role: 'Finance', action: 'Payment Plan Created', module: 'Payments', timestamp: '2026-06-01 15:20', details: 'Created 4-installment plan for Jennifer Wong' },
    { id: 'A008', user: 'Teacher Michelle', role: 'Teacher', action: 'Portfolio Approved', module: 'Portfolio', timestamp: '2026-06-01 14:00', details: 'Approved portfolio submission P002' },
  ];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) || log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = filterModule === 'All' || log.module === filterModule;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">Audit Logs</h1>
        <p className="text-[#6b6b6b] mt-1">Track all system activities and user actions</p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b6b6b]" size={20} />
            <input
              type="text"
              placeholder="Search by user or action..."
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
            <option>All Modules</option>
            <option>Student Management</option>
            <option>Payments</option>
            <option>Attendance</option>
            <option>Certificates</option>
            <option>Class Management</option>
            <option>Portfolio</option>
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
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#f8f8f6] transition-colors">
                  <td className="px-6 py-4 text-sm text-[#6b6b6b]">{log.timestamp}</td>
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
                  <td className="px-6 py-4 text-sm text-[#6b6b6b]">{log.module}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <History size={16} className="text-[#284342]" />
                      <span className="text-sm text-[#284342]">{log.action}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6b6b6b]">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm text-[#6b6b6b]">
          <p>Showing {filteredLogs.length} of {logs.length} logs</p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors">
              Previous
            </button>
            <button className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95]">1</button>
            <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
        <h2 className="text-lg text-[#284342] mb-4">Activity Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-[#f8f8f6]">
            <FileText size={24} className="mx-auto text-[#284342] mb-2" />
            <p className="text-2xl text-[#284342] mb-1">142</p>
            <p className="text-xs text-[#6b6b6b]">Actions Today</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-[#f8f8f6]">
            <User size={24} className="mx-auto text-[#284342] mb-2" />
            <p className="text-2xl text-[#284342] mb-1">18</p>
            <p className="text-xs text-[#6b6b6b]">Active Users</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-[#f8f8f6]">
            <History size={24} className="mx-auto text-[#284342] mb-2" />
            <p className="text-2xl text-[#284342] mb-1">1,247</p>
            <p className="text-xs text-[#6b6b6b]">Total Logs</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-[#f8f8f6]">
            <FileText size={24} className="mx-auto text-[#284342] mb-2" />
            <p className="text-2xl text-[#284342] mb-1">12</p>
            <p className="text-xs text-[#6b6b6b]">Modules Tracked</p>
          </div>
        </div>
      </div>
    </div>
  );
}
