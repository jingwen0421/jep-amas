import { MessageCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface NotificationItem {
  id: string;
  channel: string;
  title: string;
  message: string;
  delivery_status: string;
  created_at: string;
  contact_phone?: string | null;
}

interface Props {
  notifications: NotificationItem[];
  onMarkSent: (id: string) => void;
}

export default function WhatsAppQueue({ notifications, onMarkSent }: Props) {
  const { t } = useLanguage();
  const queue = notifications.filter(
    (item) =>
      item.channel === 'whatsapp' &&
      item.delivery_status === 'pending'
  );

  function openWhatsApp(message: string, phone?: string | null) {
    const digits = phone ? phone.replace(/[^\d+]/g, '').replace('+', '') : '';
    window.open(
      `https://wa.me/${digits}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg text-[#284342]">{t('notifications.whatsappQueue.title')}</h2>
          <p className="text-sm text-[#6b6b6b] mt-1">
            {t('notifications.whatsappQueue.subtitle')}
          </p>
        </div>

        <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700">
          {t('notifications.whatsappQueue.pendingCount', { count: queue.length })}
        </span>
      </div>

      <div className="space-y-3">
        {queue.length === 0 && (
          <p className="text-sm text-[#6b6b6b]">
            {t('notifications.whatsappQueue.empty')}
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
                {item.contact_phone ? `${item.contact_phone} • ` : ''}
                {new Date(item.created_at).toLocaleString()}
              </p>
              <p className="text-sm text-[#6b6b6b] mt-3 whitespace-pre-line">
                {item.message}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openWhatsApp(item.message, item.contact_phone)}
                className="p-2 rounded-lg hover:bg-green-50"
                title={item.contact_phone ? t('notifications.whatsappQueue.openFor', { phone: item.contact_phone }) : t('notifications.openWhatsapp')}
              >
                <MessageCircle size={18} className="text-green-700" />
              </button>

              <button
                onClick={() => onMarkSent(item.id)}
                className="p-2 rounded-lg hover:bg-[#e9da95]/20"
                title={t('notifications.whatsappQueue.markSent')}
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