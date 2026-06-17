import { useState } from 'react';
import { Search, Send, MessageSquare, Mail, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Message {
  id: number;
  recipient: string;
  type: 'WhatsApp' | 'Email' | 'Broadcast';
  subject: string;
  content: string;
  sentDate: string;
  status: 'Sent' | 'Delivered' | 'Read' | 'Failed' | 'Scheduled';
  avatar: string;
}

const messagesData: Message[] = [
  {
    id: 1,
    recipient: 'Wong Xiao Ming',
    type: 'WhatsApp',
    subject: 'Class Reminder',
    content: 'Reminder: Makeup Artistry class tomorrow at 10:00 AM',
    sentDate: '2026-06-02 14:30',
    status: 'Read',
    avatar: 'WX',
  },
  {
    id: 2,
    recipient: 'All Students',
    type: 'Broadcast',
    subject: 'Payment Due Reminder',
    content: 'Your monthly installment is due on June 5th',
    sentDate: '2026-06-01 09:00',
    status: 'Delivered',
    avatar: 'ALL',
  },
  {
    id: 3,
    recipient: 'Tan Da Ai',
    type: 'Email',
    subject: 'Appointment Confirmation',
    content: 'Your appointment with Esther has been confirmed for June 3rd',
    sentDate: '2026-05-31 16:45',
    status: 'Read',
    avatar: 'TD',
  },
  {
    id: 4,
    recipient: 'Lee Mei Ling',
    type: 'WhatsApp',
    subject: 'Attendance Warning',
    content: 'Your attendance rate is below 80%. Please contact admin',
    sentDate: '2026-05-30 11:20',
    status: 'Delivered',
    avatar: 'LM',
  },
  {
    id: 5,
    recipient: 'All Teachers',
    type: 'Broadcast',
    subject: 'Staff Meeting',
    content: 'Monthly staff meeting scheduled for June 10th at 3:00 PM',
    sentDate: '2026-05-29 10:00',
    status: 'Read',
    avatar: 'ALL',
  },
  {
    id: 6,
    recipient: 'Kavitha',
    type: 'Email',
    subject: 'Certificate Ready',
    content: 'Your course completion certificate is ready for collection',
    sentDate: '2026-05-28 15:00',
    status: 'Sent',
    avatar: 'KV',
  },
];

export default function Communications() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  const filteredMessages = messagesData.filter((msg) => {
    const matchesSearch =
      msg.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'All' || msg.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sent':
        return { bg: 'rgba(233, 218, 149, 0.3)', text: '#284342' };
      case 'Delivered':
        return { bg: 'rgba(40, 67, 66, 0.1)', text: '#284342' };
      case 'Read':
        return { bg: 'rgba(40, 67, 66, 0.1)', text: '#284342' };
      case 'Failed':
        return { bg: 'rgba(212, 24, 61, 0.1)', text: '#d4183d' };
      case 'Scheduled':
        return { bg: 'rgba(233, 218, 149, 0.3)', text: '#284342' };
      default:
        return { bg: 'rgba(107, 107, 107, 0.1)', text: '#6b6b6b' };
    }
  };

  const whatsappCount = messagesData.filter((m) => m.type === 'WhatsApp').length;
  const emailCount = messagesData.filter((m) => m.type === 'Email').length;
  const broadcastCount = messagesData.filter((m) => m.type === 'Broadcast').length;
  const failedCount = messagesData.filter((m) => m.status === 'Failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={{ color: '#284342' }}>Communications</h1>
          <p style={{ color: '#6b6b6b' }}>Manage messages and notifications</p>
        </div>
        <button
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all hover:opacity-90"
          style={{ background: '#284342', color: '#e9da95' }}
        >
          <Send className="w-5 h-5" />
          Send Broadcast
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>WhatsApp Messages</p>
          <h2 style={{ color: '#284342' }}>{whatsappCount}</h2>
        </div>
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>Email Sent</p>
          <h2 style={{ color: '#284342' }}>{emailCount}</h2>
        </div>
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>Broadcast Messages</p>
          <h2 style={{ color: '#284342' }}>{broadcastCount}</h2>
        </div>
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>Failed</p>
          <h2 style={{ color: '#d4183d' }}>{failedCount}</h2>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6b6b6b' }} />
            <input
              type="text"
              placeholder="Search messages"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1"
              style={{ borderColor: 'rgba(40, 67, 66, 0.2)' }}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1"
            style={{ borderColor: 'rgba(40, 67, 66, 0.2)', color: '#284342' }}
          >
            <option>All</option>
            <option>WhatsApp</option>
            <option>Email</option>
            <option>Broadcast</option>
          </select>
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8f7f2', borderBottom: '1px solid rgba(40, 67, 66, 0.1)' }}>
                <th className="text-left px-6 py-4 text-sm" style={{ color: '#284342' }}>Recipient</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: '#284342' }}>Type</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: '#284342' }}>Subject</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: '#284342' }}>Content</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: '#284342' }}>Sent Date</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: '#284342' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map((msg) => {
                const colors = getStatusColor(msg.status);
                return (
                  <tr key={msg.id} style={{ borderBottom: '1px solid rgba(40, 67, 66, 0.1)' }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: '#284342', color: '#e9da95' }}
                        >
                          <span className="text-xs">{msg.avatar}</span>
                        </div>
                        <span style={{ color: '#284342' }}>{msg.recipient}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {msg.type === 'WhatsApp' && <MessageSquare className="w-4 h-4" style={{ color: '#25D366' }} />}
                        {msg.type === 'Email' && <Mail className="w-4 h-4" style={{ color: '#6b6b6b' }} />}
                        {msg.type === 'Broadcast' && <Send className="w-4 h-4" style={{ color: '#284342' }} />}
                        <span style={{ color: '#6b6b6b' }}>{msg.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4" style={{ color: '#284342' }}>{msg.subject}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm truncate max-w-xs" style={{ color: '#6b6b6b' }}>{msg.content}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" style={{ color: '#6b6b6b' }} />
                        <span className="text-sm" style={{ color: '#6b6b6b' }}>{msg.sentDate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="px-3 py-1 rounded-md text-sm flex items-center gap-2 w-fit"
                        style={{ background: colors.bg, color: colors.text }}
                      >
                        {msg.status === 'Read' && <CheckCircle className="w-3 h-3" />}
                        {msg.status === 'Delivered' && <CheckCircle className="w-3 h-3" />}
                        {msg.status === 'Failed' && <XCircle className="w-3 h-3" />}
                        {msg.status === 'Scheduled' && <Clock className="w-3 h-3" />}
                        {msg.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
