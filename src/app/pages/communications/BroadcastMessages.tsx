import { useState } from 'react';
import { Send, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';

interface Message {
  id: string;
  title: string;
  channel: 'WhatsApp' | 'Email' | 'Both';
  recipients: number;
  sent: number;
  delivered: number;
  status: 'Sent' | 'Scheduled' | 'Draft';
  sentDate: string;
}

export default function BroadcastMessages() {
  const [showComposer, setShowComposer] = useState(false);

  const messages: Message[] = [
    { id: 'M001', title: 'Class Reminder - Bridal Makeup Session', channel: 'WhatsApp', recipients: 15, sent: 15, delivered: 14, status: 'Sent', sentDate: '2026-06-01 08:00' },
    { id: 'M002', title: 'Payment Due Reminder', channel: 'Email', recipients: 8, sent: 8, delivered: 8, status: 'Sent', sentDate: '2026-05-30 10:00' },
    { id: 'M003', title: 'New Course Announcement', channel: 'Both', recipients: 150, sent: 150, delivered: 145, status: 'Sent', sentDate: '2026-05-28 14:00' },
    { id: 'M004', title: 'Certificate Ready for Collection', channel: 'WhatsApp', recipients: 5, sent: 0, delivered: 0, status: 'Scheduled', sentDate: '2026-06-05 09:00' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Broadcast Messages</h1>
          <p className="text-[#6b6b6b] mt-1">Send mass notifications via WhatsApp and Email</p>
        </div>
        <button onClick={() => setShowComposer(true)} className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2">
          <Send size={20} />
          New Broadcast
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-2">
            <Send size={24} className="text-[#284342]" />
            <div>
              <p className="text-sm text-[#6b6b6b]">Total Sent</p>
              <p className="text-2xl text-[#284342]">173</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 size={24} className="text-green-700" />
            <div>
              <p className="text-sm text-[#6b6b6b]">Delivered</p>
              <p className="text-2xl text-green-700">167</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={24} className="text-blue-700" />
            <div>
              <p className="text-sm text-[#6b6b6b]">Scheduled</p>
              <p className="text-2xl text-blue-700">1</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare size={24} className="text-[#6b6b6b]" />
            <div>
              <p className="text-sm text-[#6b6b6b]">Delivery Rate</p>
              <p className="text-2xl text-[#284342]">96.5%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">Broadcast History</h2>
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {messages.map((msg) => (
            <div key={msg.id} className="p-6 hover:bg-[#f8f8f6] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg text-[#284342]">{msg.title}</h3>
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      msg.status === 'Sent' ? 'bg-green-100 text-green-700' :
                      msg.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {msg.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-[#6b6b6b] mb-1">Channel</p>
                      <div className="flex items-center gap-1">
                        <MessageSquare size={14} className="text-[#284342]" />
                        <p className="text-[#284342]">{msg.channel}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-[#6b6b6b] mb-1">Recipients</p>
                      <p className="text-[#284342]">{msg.recipients}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6b6b6b] mb-1">Sent</p>
                      <p className="text-[#284342]">{msg.sent}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6b6b6b] mb-1">Delivered</p>
                      <p className="text-green-700">{msg.delivered}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6b6b6b] mb-1">Date & Time</p>
                      <p className="text-[#284342]">{msg.sentDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {msg.sent > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#6b6b6b]">Delivery Progress</span>
                    <span className="text-xs text-[#284342]">{Math.round((msg.delivered / msg.sent) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#e8e7e2] rounded-full overflow-hidden">
                    <div className="h-full bg-green-600 rounded-full" style={{ width: `${(msg.delivered / msg.sent) * 100}%` }} />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[rgba(40,67,66,0.1)]">
                <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm">
                  View Details
                </button>
                {msg.status === 'Sent' && (
                  <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm">
                    Resend
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showComposer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-[rgba(40,67,66,0.1)]">
              <h2 className="text-xl text-[#284342]">New Broadcast Message</h2>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm text-[#284342] mb-2">Message Title</label>
                <input
                  type="text"
                  placeholder="e.g., Class Reminder, Payment Due..."
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">Channel</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] cursor-pointer hover:bg-[#f8f8f6]">
                    <input type="radio" name="channel" value="whatsapp" className="text-[#284342]" />
                    <span className="text-sm text-[#284342]">WhatsApp</span>
                  </label>
                  <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] cursor-pointer hover:bg-[#f8f8f6]">
                    <input type="radio" name="channel" value="email" className="text-[#284342]" />
                    <span className="text-sm text-[#284342]">Email</span>
                  </label>
                  <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] cursor-pointer hover:bg-[#f8f8f6]">
                    <input type="radio" name="channel" value="both" className="text-[#284342]" defaultChecked />
                    <span className="text-sm text-[#284342]">Both</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">Recipients</label>
                <select className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]">
                  <option>All Students</option>
                  <option>All Teachers</option>
                  <option>Specific Batch</option>
                  <option>Specific Course</option>
                  <option>Custom List</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">Message</label>
                <textarea
                  rows={6}
                  placeholder="Type your message here..."
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">Send Option</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] cursor-pointer hover:bg-[#f8f8f6]">
                    <input type="radio" name="send" value="now" className="text-[#284342]" defaultChecked />
                    <span className="text-sm text-[#284342]">Send Now</span>
                  </label>
                  <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] cursor-pointer hover:bg-[#f8f8f6]">
                    <input type="radio" name="send" value="schedule" className="text-[#284342]" />
                    <span className="text-sm text-[#284342]">Schedule</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[rgba(40,67,66,0.1)] flex items-center gap-3">
              <button onClick={() => setShowComposer(false)} className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors">
                Cancel
              </button>
              <button className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors">
                Save as Draft
              </button>
              <button onClick={() => setShowComposer(false)} className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2">
                <Send size={20} />
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
