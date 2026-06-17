import { MessageCircle, Send, CheckCheck, Clock } from 'lucide-react';

interface WhatsAppMessage {
  id: string;
  recipient: string;
  phone: string;
  message: string;
  sentDate: string;
  status: 'Sent' | 'Delivered' | 'Read' | 'Failed';
}

export default function WhatsAppComms() {
  const messages: WhatsAppMessage[] = [
    {
      id: 'WA001',
      recipient: 'Jessica Lim Mei Ling',
      phone: '+60 12-345 6789',
      message: 'Hi Jessica, reminder that your Bridal Makeup class is tomorrow at 9:00 AM in Studio A.',
      sentDate: '2026-06-01 08:00',
      status: 'Read',
    },
    {
      id: 'WA002',
      recipient: 'Amanda Ng Siew May',
      phone: '+60 12-456 7890',
      message: 'Hi Amanda, your payment of RM 2,000 is due on June 15. Please arrange payment.',
      sentDate: '2026-06-01 10:30',
      status: 'Delivered',
    },
    {
      id: 'WA003',
      recipient: 'Rachel Tan Li Ying',
      phone: '+60 12-567 8901',
      message: 'Congratulations! Your course completion certificate is ready for collection.',
      sentDate: '2026-05-30 14:00',
      status: 'Read',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">WhatsApp Communications</h1>
          <p className="text-[#6b6b6b] mt-1">Send and track WhatsApp messages</p>
        </div>
        <button className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2">
          <Send size={20} />
          Send Message
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Total Sent</p>
          <p className="text-3xl text-[#284342]">{messages.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Delivered</p>
          <p className="text-3xl text-green-700">
            {messages.filter((m) => m.status === 'Delivered' || m.status === 'Read').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Read</p>
          <p className="text-3xl text-blue-700">
            {messages.filter((m) => m.status === 'Read').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Failed</p>
          <p className="text-3xl text-red-700">
            {messages.filter((m) => m.status === 'Failed').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">Message History</h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {messages.map((msg) => (
            <div key={msg.id} className="p-6 hover:bg-[#f8f8f6] transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-green-50">
                  <MessageCircle size={24} className="text-green-700" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-lg text-[#284342]">{msg.recipient}</h3>
                      <p className="text-sm text-[#6b6b6b]">{msg.phone}</p>
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 ${
                        msg.status === 'Read'
                          ? 'bg-blue-100 text-blue-700'
                          : msg.status === 'Delivered'
                          ? 'bg-green-100 text-green-700'
                          : msg.status === 'Failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {msg.status === 'Read' && <CheckCheck size={12} />}
                      {msg.status === 'Delivered' && <CheckCheck size={12} />}
                      {msg.status === 'Sent' && <Clock size={12} />}
                      {msg.status}
                    </span>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg mb-2">
                    <p className="text-sm text-[#284342]">{msg.message}</p>
                  </div>

                  <p className="text-xs text-[#6b6b6b]">Sent: {msg.sentDate}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
