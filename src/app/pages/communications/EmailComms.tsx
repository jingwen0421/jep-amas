import { Mail, Send, Inbox } from 'lucide-react';

interface EmailMessage {
  id: string;
  recipient: string;
  email: string;
  subject: string;
  sentDate: string;
  status: 'Sent' | 'Delivered' | 'Opened' | 'Bounced';
}

export default function EmailComms() {
  const emails: EmailMessage[] = [
    {
      id: 'EM001',
      recipient: 'Jessica Lim Mei Ling',
      email: 'jessica.lim@email.com',
      subject: 'Welcome to JEP Image Makeup Academy',
      sentDate: '2026-01-15 09:00',
      status: 'Opened',
    },
    {
      id: 'EM002',
      recipient: 'Amanda Ng Siew May',
      email: 'amanda.ng@email.com',
      subject: 'Payment Reminder - RM 2,000 Due',
      sentDate: '2026-06-01 08:00',
      status: 'Delivered',
    },
    {
      id: 'EM003',
      recipient: 'Rachel Tan Li Ying',
      email: 'rachel.tan@email.com',
      subject: 'Congratulations on Course Completion!',
      sentDate: '2026-05-30 14:00',
      status: 'Opened',
    },
    {
      id: 'EM004',
      recipient: 'Melissa Chong',
      email: 'melissa.chong@email.com',
      subject: 'Appointment Confirmation with Juju Lim',
      sentDate: '2026-06-01 16:00',
      status: 'Sent',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Email Communications</h1>
          <p className="text-[#6b6b6b] mt-1">Send and track email messages</p>
        </div>
        <button className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2">
          <Send size={20} />
          Compose Email
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Total Sent</p>
          <p className="text-3xl text-[#284342]">{emails.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Delivered</p>
          <p className="text-3xl text-green-700">
            {emails.filter((e) => e.status === 'Delivered' || e.status === 'Opened').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Opened</p>
          <p className="text-3xl text-blue-700">
            {emails.filter((e) => e.status === 'Opened').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Open Rate</p>
          <p className="text-3xl text-[#284342]">
            {Math.round((emails.filter((e) => e.status === 'Opened').length / emails.length) * 100)}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">Sent Emails</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Recipient</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Email</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Subject</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Sent Date</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Status</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {emails.map((email) => (
                <tr key={email.id} className="hover:bg-[#f8f8f6] transition-colors">
                  <td className="px-6 py-4 text-sm text-[#284342]">{email.recipient}</td>
                  <td className="px-6 py-4 text-sm text-[#6b6b6b]">{email.email}</td>
                  <td className="px-6 py-4 text-sm text-[#284342]">{email.subject}</td>
                  <td className="px-6 py-4 text-sm text-[#6b6b6b]">{email.sentDate}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        email.status === 'Opened'
                          ? 'bg-blue-100 text-blue-700'
                          : email.status === 'Delivered'
                          ? 'bg-green-100 text-green-700'
                          : email.status === 'Bounced'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {email.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors">
                      <Inbox size={16} className="text-[#284342]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
