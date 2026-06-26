import { useEffect, useState } from 'react';
import WhatsAppQueue from './WhatsAppQueue';
import {
  Bell,
  CheckCircle2,
  MessageCircle,
  AlertCircle,
  Clock,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface NotificationItem {
  id: string;
  user_id?: string | null;
  channel: string;
  title: string;
  message: string;
  delivery_status: string;
  sent_at?: string | null;
  created_at: string;
  type?: string | null;
  priority?: string | null;
  related_module?: string | null;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
const [channelFilter, setChannelFilter] = useState('all');
const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    setLoading(true);

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        user_id,
        channel,
        title,
        message,
        delivery_status,
        sent_at,
        created_at,
        type,
        priority,
        related_module
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error.message);
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    setLoading(false);
  }

  async function markAsSent(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({
        delivery_status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      alert(`Failed to update notification: ${error.message}`);
      return;
    }

    fetchNotifications();
  }

  async function deleteNotification(id: string) {
    const confirmed = confirm('Delete this notification?');
    if (!confirmed) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      alert(`Failed to delete notification: ${error.message}`);
      return;
    }

    fetchNotifications();
  }

  function openWhatsApp(notification: NotificationItem) {
    const text = encodeURIComponent(notification.message);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  const pendingCount = notifications.filter(
    (n) => n.delivery_status === 'pending'
  ).length;

  const sentCount = notifications.filter(
    (n) => n.delivery_status === 'sent'
  ).length;

  const whatsappCount = notifications.filter(
    (n) => n.channel === 'whatsapp'
  ).length;

  const highPriorityCount = notifications.filter(
    (n) => n.priority === 'high'
  ).length;

  const filteredNotifications = notifications.filter((item) => {
  const search = searchTerm.toLowerCase();

  const matchesSearch =
    item.title.toLowerCase().includes(search) ||
    item.message.toLowerCase().includes(search);

  const matchesChannel =
    channelFilter === 'all' || item.channel === channelFilter;

  const matchesStatus =
    statusFilter === 'all' || item.delivery_status === statusFilter;

  return matchesSearch && matchesChannel && matchesStatus;
});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Notification Center</h1>
          <p className="text-[#6b6b6b] mt-1">
            Manage system alerts and WhatsApp reminders
          </p>
        </div>

        <button
          onClick={fetchNotifications}
          className="px-6 py-3 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard icon={<Bell size={24} />} label="Total" value={notifications.length} color="text-[#284342]" />
        <SummaryCard icon={<AlertCircle size={24} />} label="Pending" value={pendingCount} color="text-yellow-700" />
        <SummaryCard icon={<CheckCircle2 size={24} />} label="Sent" value={sentCount} color="text-green-700" />
        <SummaryCard icon={<MessageCircle size={24} />} label="WhatsApp" value={whatsappCount} color="text-green-700" />
      </div>

      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search notifications..."
      className="px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
    />

    <select
      value={channelFilter}
      onChange={(e) => setChannelFilter(e.target.value)}
      className="px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
    >
      <option value="all">All Channels</option>
      <option value="in_app">In App</option>
      <option value="whatsapp">WhatsApp</option>
      <option value="email">Email</option>
    </select>

    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
    >
      <option value="all">All Status</option>
      <option value="pending">Pending</option>
      <option value="sent">Sent</option>
      <option value="failed">Failed</option>
    </select>
  </div>
</div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)] flex items-center justify-between">
          <h2 className="text-lg text-[#284342]">Recent Notifications</h2>
          <p className="text-sm text-[#6b6b6b]">
            {highPriorityCount} high priority
          </p>
        </div>

        <WhatsAppQueue
        notifications={notifications}
        onMarkSent={markAsSent}
        />

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {loading && (
            <div className="p-6 text-center text-[#6b6b6b]">
              Loading notifications...
            </div>
          )}

          {!loading && filteredNotifications.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              No notifications found.
            </div>
          )}

          {!loading &&
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`p-6 hover:bg-[#f8f8f6] transition-colors ${
                  item.delivery_status === 'pending' ? 'bg-[#e9da95]/10' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${getIconBg(item.type || item.channel)}`}>
                      {getNotificationIcon(item.type || item.channel)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-[#284342]">{item.title}</h3>
                        <StatusBadge status={item.delivery_status} />
                        <PriorityBadge priority={item.priority || 'normal'} />
                        <ChannelBadge channel={item.channel} />
                      </div>

                      <p className="text-sm text-[#6b6b6b] mb-2">
                        {item.message}
                      </p>

                      <p className="text-xs text-[#6b6b6b]">
                        {item.related_module || 'System'} •{' '}
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.channel === 'whatsapp' && (
                      <button
                        onClick={() => openWhatsApp(item)}
                        className="p-2 hover:bg-green-50 rounded-lg"
                        title="Open WhatsApp"
                      >
                        <MessageCircle size={18} className="text-green-700" />
                      </button>
                    )}

                    {item.delivery_status === 'pending' && (
                      <button
                        onClick={() => markAsSent(item.id)}
                        className="p-2 hover:bg-[#e9da95]/20 rounded-lg"
                        title="Mark as Sent"
                      >
                        <CheckCircle2 size={18} className="text-[#284342]" />
                      </button>
                    )}

                    <button
                      onClick={() => deleteNotification(item.id)}
                      className="p-2 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg bg-[#e9da95]/20 ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-[#6b6b6b]">{label}</p>
          <p className={`text-2xl ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full ${
        status === 'sent'
          ? 'bg-green-100 text-green-700'
          : status === 'failed'
          ? 'bg-red-100 text-red-700'
          : 'bg-yellow-100 text-yellow-700'
      }`}
    >
      {formatText(status)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full ${
        priority === 'high'
          ? 'bg-red-100 text-red-700'
          : 'bg-[#f8f8f6] text-[#6b6b6b]'
      }`}
    >
      {formatText(priority)}
    </span>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full ${
        channel === 'whatsapp'
          ? 'bg-green-100 text-green-700'
          : 'bg-blue-100 text-blue-700'
      }`}
    >
      {formatText(channel)}
    </span>
  );
}

function getNotificationIcon(type: string) {
  if (type === 'payment') return <AlertCircle size={20} className="text-red-700" />;
  if (type === 'portfolio') return <Bell size={20} className="text-blue-700" />;
  if (type === 'attendance') return <Clock size={20} className="text-yellow-700" />;
  if (type === 'whatsapp') return <MessageCircle size={20} className="text-green-700" />;
  return <Bell size={20} className="text-[#284342]" />;
}

function getIconBg(type: string) {
  if (type === 'payment') return 'bg-red-100';
  if (type === 'portfolio') return 'bg-blue-100';
  if (type === 'attendance') return 'bg-yellow-100';
  if (type === 'whatsapp') return 'bg-green-100';
  return 'bg-[#e9da95]/20';
}

function formatText(value: string) {
  if (!value) return '-';

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}