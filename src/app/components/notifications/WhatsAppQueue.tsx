import { MessageCircle, CheckCircle2 } from 'lucide-react';

interface NotificationItem {
  id: string;
  channel: string;
  title: string;
  message: string;
  delivery_status: string;
  created_at: string;
}

interface Props {
  notifications: NotificationItem[];
  onMarkSent: (id: string) => void;
}

export default function WhatsAppQueue({ notifications, onMarkSent }: Props) {
  const queue = notifications.filter(
    (item) =>
      item.channel === 'whatsapp' &&
      item.delivery_status === 'pending'
  );

  function openWhatsApp(message: string) {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg text-[#284342]">WhatsApp Reminder Queue</h2>
          <p className="text-sm text-[#6b6b6b] mt-1">
            Pending reminders waiting to be sent manually
          </p>
        </div>

        <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700">
          {queue.length} pending
        </span>
      </div>

      <div className="space-y-3">
        {queue.length === 0 && (
          <p className="text-sm text-[#6b6b6b]">
            No pending WhatsApp reminders.
          </p>
        )}

        {queue.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-lg bg-[#f8f8f6] flex items-start justify-between gap-4"
          >
            <div>
              <p className="text-sm text-[#284342]">{item.title}</p>
              <p className="text-xs text-[#6b6b6b] mt-1">
                {new Date(item.created_at).toLocaleString()}
              </p>
              <p className="text-sm text-[#6b6b6b] mt-3 whitespace-pre-line">
                {item.message}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openWhatsApp(item.message)}
                className="p-2 rounded-lg hover:bg-green-50"
                title="Open WhatsApp"
              >
                <MessageCircle size={18} className="text-green-700" />
              </button>

              <button
                onClick={() => onMarkSent(item.id)}
                className="p-2 rounded-lg hover:bg-[#e9da95]/20"
                title="Mark Sent"
              >
                <CheckCircle2 size={18} className="text-[#284342]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}