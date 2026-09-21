import { useEffect, useMemo, useState } from 'react';
import WhatsAppQueue from './WhatsAppQueue';
import { getCurrentUser } from '../../utils/session';
import {
  Bell,
  CheckCircle2,
  MessageCircle,
  Mail,
  AlertCircle,
  Clock,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';
import { useConfirm } from '../../context/ConfirmDialogContext';

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
  contact_phone?: string | null;
}

export default function NotificationCenter() {
  const { t } = useLanguage();
  const confirmDialog = useConfirm();
  const currentUser = getCurrentUser();

  // Only academy leadership manages the shared "all notifications" console
  // (matches notifications_select_leadership in RLS). Everyone else —
  // including teacher/finance/sales, who previously fell through to seeing
  // every user's notifications by accident — gets their own inbox only.
  const isLeadership =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'admin' ||
    currentUser.role === 'owner';

  const isPersonalView = !isLeadership;

  // Marking as sent / deleting is further restricted to admins (matches
  // notifications_update_admin / notifications_delete_admin in RLS) — owner
  // can see the console but doesn't manage delivery/cleanup.
  const canManageNotifications =
    currentUser.role === 'super_admin' || currentUser.role === 'admin';

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

    let query = supabase
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
        related_module,
        contact_phone
      `)
      .order('created_at', { ascending: false });

    if (isPersonalView) {
      query = query.eq('user_id', currentUser.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error.message);
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    setLoading(false);
  }

  async function markAsSent(ids: string[]) {
    if (!canManageNotifications || ids.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({
        delivery_status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .in('id', ids);

    if (error) {
      alert(t('notifications.updateFailed', { message: error.message }));
      return;
    }

    fetchNotifications();
  }

  async function deleteNotification(ids: string[]) {
    if (!canManageNotifications || ids.length === 0) return;

    const confirmed = await confirmDialog(
      ids.length > 1
        ? t('notifications.confirmDeleteMulti', { count: ids.length })
        : t('notifications.confirmDelete'),
      { variant: 'danger', confirmLabel: t('common.delete') }
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', ids);

    if (error) {
      alert(t('notifications.deleteFailed', { message: error.message }));
      return;
    }

    fetchNotifications();
  }

  function openWhatsApp(notification: NotificationItem) {
    const text = encodeURIComponent(notification.message);
    const digits = notification.contact_phone
      ? notification.contact_phone.replace(/[^\d+]/g, '').replace('+', '')
      : '';
    window.open(`https://wa.me/${digits}?text=${text}`, '_blank');
  }

  const pendingCount = notifications.filter(
    (notification) => notification.delivery_status === 'pending'
  ).length;

  const sentCount = notifications.filter(
    (notification) => notification.delivery_status === 'sent'
  ).length;

  const whatsappCount = notifications.filter(
    (notification) => notification.channel === 'whatsapp'
  ).length;

  const highPriorityCount = notifications.filter(
    (notification) => notification.priority === 'high'
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

  // The same business event (a payment reminder, a receipt, ...) fires one
  // notifications row per channel via notify()/sendEmail() — in_app, email,
  // and whatsapp for the same title/module land within the same second.
  // Grouping them back into one card (with a chip per channel) is what
  // actually declutters the feed, rather than showing 2-3 near-identical
  // full cards for a single event.
  const groupedNotifications = useMemo(
    () => groupNotifications(filteredNotifications),
    [filteredNotifications]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">
            {isPersonalView ? t('notifications.myTitle') : t('notifications.title')}
          </h1>

          <p className="text-[#6b6b6b] mt-1">
            {isPersonalView
              ? t('notifications.mySubtitle')
              : t('notifications.subtitle')}
          </p>
        </div>

        <button
          onClick={fetchNotifications}
          className="px-6 py-3 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] flex items-center gap-2"
        >
          <RefreshCw size={18} />
          {t('notifications.refresh')}
        </button>
      </div>

     {isPersonalView ? (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <SummaryCard
      icon={<Bell size={24} />}
      label={t('notifications.card.myNotifications')}
      value={notifications.length}
      color="text-[#284342]"
    />

    <SummaryCard
      icon={<AlertCircle size={24} />}
      label={t('notifications.card.important')}
      value={highPriorityCount}
      color="text-red-700"
    />
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    <SummaryCard
      icon={<Bell size={24} />}
      label={t('notifications.card.total')}
      value={notifications.length}
      color="text-[#284342]"
    />

    <SummaryCard
      icon={<AlertCircle size={24} />}
      label={t('notifications.card.pending')}
      value={pendingCount}
      color="text-yellow-700"
    />

    <SummaryCard
      icon={<CheckCircle2 size={24} />}
      label={t('notifications.card.sent')}
      value={sentCount}
      color="text-green-700"
    />

    <SummaryCard
      icon={<MessageCircle size={24} />}
      label={t('notifications.card.whatsapp')}
      value={whatsappCount}
      color="text-green-700"
    />
  </div>
)}

      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
  <div className={`grid grid-cols-1 ${isPersonalView ? '' : 'md:grid-cols-3'} gap-4`}>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t('notifications.searchPlaceholder')}
            className="px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
          />
{!isPersonalView && (
    <>
          <select
            value={channelFilter}
            onChange={(event) => setChannelFilter(event.target.value)}
            className="px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
          >
            <option value="all">{t('notifications.filter.allChannels')}</option>
            <option value="in_app">{t('notifications.channel.inApp')}</option>
            <option value="whatsapp">{t('notifications.channel.whatsapp')}</option>
            <option value="email">{t('notifications.channel.email')}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
          >
            <option value="all">{t('notifications.filter.allStatus')}</option>
            <option value="pending">{t('notifications.status.pending')}</option>
            <option value="sent">{t('notifications.status.sent')}</option>
            <option value="failed">{t('notifications.status.failed')}</option>
          </select>
           </>
)}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)] flex items-center justify-between">
          <h2 className="text-lg text-[#284342]">
            {isPersonalView ? t('notifications.recentUpdates') : t('notifications.recentNotifications')}
          </h2>

          <p className="text-sm text-[#6b6b6b]">
            {t('notifications.highPriorityCount', { count: highPriorityCount })}
          </p>
        </div>

        {!isPersonalView && canManageNotifications && (
          <WhatsAppQueue
            notifications={notifications}
            onMarkSent={(id) => markAsSent([id])}
          />
        )}

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {loading && (
            <div className="p-6 text-center text-[#6b6b6b]">
              {t('notifications.loading')}
            </div>
          )}

          {!loading && groupedNotifications.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              {t('notifications.empty')}
            </div>
          )}

          {!loading &&
            groupedNotifications.map((group) => (
              <NotificationGroupRow
                key={group.key}
                group={group}
                canManageNotifications={canManageNotifications}
                onMarkSent={markAsSent}
                onDelete={deleteNotification}
                onOpenWhatsApp={openWhatsApp}
              />
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


function PriorityBadge({ priority, t }: { priority: string; t: (key: string) => string }) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full ${
        priority === 'high'
          ? 'bg-red-100 text-red-700'
          : 'bg-[#f8f8f6] text-[#6b6b6b]'
      }`}
    >
      {translatePriority(priority, t)}
    </span>
  );
}

function translatePriority(priority: string, t: (key: string) => string) {
  const key = `notifications.priority.${String(priority || 'normal').toLowerCase()}`;
  const translated = t(key);
  return translated === key ? formatText(priority) : translated;
}

function translateStatus(status: string, t: (key: string) => string) {
  const key = `notifications.status.${String(status || '').toLowerCase()}`;
  const translated = t(key);
  return translated === key ? formatText(status) : translated;
}

function translateChannelLabel(channel: string, t: (key: string) => string) {
  const key = channel === 'in_app' ? 'notifications.channel.inApp' : `notifications.channel.${String(channel || '').toLowerCase()}`;
  const translated = t(key);
  return translated === key ? formatText(channel) : translated;
}

function getNotificationIcon(type: string) {
  if (type === 'payment') {
    return <AlertCircle size={20} className="text-red-700" />;
  }

  if (type === 'portfolio') {
    return <Bell size={20} className="text-blue-700" />;
  }

  if (type === 'attendance') {
    return <Clock size={20} className="text-yellow-700" />;
  }

  if (type === 'appointment') {
    return <Clock size={20} className="text-blue-700" />;
  }

  if (type === 'whatsapp') {
    return <MessageCircle size={20} className="text-green-700" />;
  }

  if (type === 'email') {
    return <Bell size={20} className="text-blue-700" />;
  }

  return <Bell size={20} className="text-[#284342]" />;
}

function getIconBg(type: string) {
  if (type === 'payment') return 'bg-red-100';
  if (type === 'portfolio') return 'bg-blue-100';
  if (type === 'attendance') return 'bg-yellow-100';
  if (type === 'appointment') return 'bg-blue-100';
  if (type === 'whatsapp') return 'bg-green-100';
  if (type === 'email') return 'bg-blue-100';
  return 'bg-[#e9da95]/20';
}

function formatText(value: string) {
  if (!value) return '-';

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Email-channel notifications store the full HTML email body (receipt
// templates, etc.) in `message` — rendering that raw dumps hundreds of
// characters of markup into the card. Strip tags down to plain text for
// the preview; the full content is still available via "Show full message".
function stripHtmlPreview(message: string) {
  if (!/<[a-z][\s\S]*>/i.test(message)) return message;

  const parsed = new DOMParser().parseFromString(message, 'text/html');
  return (parsed.body.textContent || '').replace(/\s+/g, ' ').trim();
}

const PRIORITY_RANK: Record<string, number> = { high: 2, normal: 1, low: 0 };

interface NotificationGroup {
  key: string;
  title: string;
  message: string;
  priority: string;
  relatedModule: string | null;
  createdAt: string;
  items: NotificationItem[];
}

// Groups rows fired together by the same business event (same title +
// module, within the same minute) into one card — this is what actually
// removes the "3 duplicate cards for one event" clutter, since notify()
// fans one logical event out to one row per channel.
function groupNotifications(items: NotificationItem[]): NotificationGroup[] {
  const groups = new Map<string, NotificationGroup>();

  items.forEach((item) => {
    const minuteBucket = Math.floor(new Date(item.created_at).getTime() / 60000);
    const key = `${item.related_module || 'system'}|${item.title}|${minuteBucket}`;

    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        key,
        title: item.title,
        message: item.message,
        priority: item.priority || 'normal',
        relatedModule: item.related_module || null,
        createdAt: item.created_at,
        items: [item],
      });
      return;
    }

    existing.items.push(item);

    // Prefer the plain-text (in_app/whatsapp) message over an HTML email
    // body for the card preview, and surface the highest priority seen.
    if (/<[a-z][\s\S]*>/i.test(existing.message) && !/<[a-z][\s\S]*>/i.test(item.message)) {
      existing.message = item.message;
    }
    if ((PRIORITY_RANK[item.priority || 'normal'] || 0) > (PRIORITY_RANK[existing.priority] || 0)) {
      existing.priority = item.priority || 'normal';
    }
    if (new Date(item.created_at) < new Date(existing.createdAt)) {
      existing.createdAt = item.created_at;
    }
  });

  return Array.from(groups.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function NotificationGroupRow({
  group,
  canManageNotifications,
  onMarkSent,
  onDelete,
  onOpenWhatsApp,
}: {
  group: NotificationGroup;
  canManageNotifications: boolean;
  onMarkSent: (ids: string[]) => void;
  onDelete: (ids: string[]) => void;
  onOpenWhatsApp: (item: NotificationItem) => void;
}) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const preview = stripHtmlPreview(group.message);
  const isLong = preview.length > 160;

  const pendingIds = group.items.filter((i) => i.delivery_status === 'pending').map((i) => i.id);
  const allIds = group.items.map((i) => i.id);
  const whatsappItem = group.items.find((i) => i.channel === 'whatsapp');
  const overallStatus = aggregateStatus(group.items);

  return (
    <div
      className={`p-6 hover:bg-[#f8f8f6] transition-colors ${
        overallStatus === 'pending' ? 'bg-[#e9da95]/10' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg shrink-0 ${getIconBg(group.items[0].type || group.items[0].channel)}`}>
          {getNotificationIcon(group.items[0].type || group.items[0].channel)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-[#284342]">{group.title}</h3>
            {group.priority === 'high' && <PriorityBadge priority="high" t={t} />}
            {/* One notification, sent through one or more channels — shown
                as small icons (not a repeated card per channel) so the
                same message never appears more than once in the list. */}
            <span className="flex items-center gap-1" title={channelSummary(group.items, t)}>
              {group.items.map((item) => (
                <ChannelIcon key={item.id} channel={item.channel} />
              ))}
            </span>
            <OverallStatusBadge status={overallStatus} t={t} />
          </div>

          <p className="text-sm text-[#6b6b6b] mb-2">
            {expanded || !isLong ? preview : `${preview.slice(0, 160)}…`}
            {isLong && (
              <button
                onClick={() => setExpanded((prev) => !prev)}
                className="ml-2 inline-flex items-center gap-0.5 text-xs text-[#284342] hover:underline"
              >
                {expanded ? (
                  <>
                    {t('notifications.showLess')} <ChevronUp size={12} />
                  </>
                ) : (
                  <>
                    {t('notifications.showMore')} <ChevronDown size={12} />
                  </>
                )}
              </button>
            )}
          </p>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-[#6b6b6b]">
              {group.relatedModule || t('notifications.systemFallback')} •{' '}
              {new Date(group.createdAt).toLocaleString()}
            </p>

            {canManageNotifications && (
              <div className="flex items-center gap-1">
                {whatsappItem && (
                  <button
                    onClick={() => onOpenWhatsApp(whatsappItem)}
                    className="p-2 hover:bg-green-50 rounded-lg"
                    title={t('notifications.openWhatsapp')}
                  >
                    <MessageCircle size={16} className="text-green-700" />
                  </button>
                )}

                {pendingIds.length > 0 && (
                  <button
                    onClick={() => onMarkSent(pendingIds)}
                    className="p-2 hover:bg-[#e9da95]/20 rounded-lg"
                    title={t('notifications.markAsSent')}
                  >
                    <CheckCircle2 size={16} className="text-[#284342]" />
                  </button>
                )}

                <button
                  onClick={() => onDelete(allIds)}
                  className="p-2 hover:bg-red-50 rounded-lg"
                  title={t('common.delete')}
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// One notification can be "sent" via several channels — the group's
// overall status is only "sent" once every channel got through, "failed"
// if any channel failed, otherwise "pending".
function aggregateStatus(items: NotificationItem[]): 'sent' | 'failed' | 'pending' {
  if (items.some((i) => i.delivery_status === 'failed')) return 'failed';
  if (items.every((i) => i.delivery_status === 'sent')) return 'sent';
  return 'pending';
}

function channelSummary(items: NotificationItem[], t: (key: string) => string) {
  return items.map((i) => `${translateChannelLabel(i.channel, t)}: ${translateStatus(i.delivery_status, t)}`).join(' • ');
}

function OverallStatusBadge({ status, t }: { status: 'sent' | 'failed' | 'pending'; t: (key: string) => string }) {
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
      {translateStatus(status, t)}
    </span>
  );
}

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === 'whatsapp') return <MessageCircle size={12} className="text-green-700" />;
  if (channel === 'email') return <Mail size={12} className="text-blue-700" />;
  return <Bell size={12} className="text-[#284342]" />;
}