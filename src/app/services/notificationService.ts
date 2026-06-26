import { supabase } from '../lib/supabase';

type NotificationChannel = 'in_app' | 'email' | 'whatsapp';
type DeliveryStatus = 'pending' | 'sent' | 'failed';

interface CreateNotificationInput {
  title: string;
  message: string;
  channel?: NotificationChannel;
  userId?: string | null;
  templateId?: string | null;
}

export async function createNotification({
  title,
  message,
  channel = 'in_app',
  userId = null,
  templateId = null,
}: CreateNotificationInput) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    template_id: templateId,
    channel,
    title,
    message,
    delivery_status: 'pending' as DeliveryStatus,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Failed to create notification:', error.message);
    return false;
  }

  return true;
}

export async function createWhatsAppReminder({
  title,
  message,
  userId = null,
}: {
  title: string;
  message: string;
  userId?: string | null;
}) {
  return createNotification({
    title,
    message,
    channel: 'whatsapp',
    userId,
  });
}

export function openWhatsAppMessage(message: string, phone?: string) {
  const encodedMessage = encodeURIComponent(message);

  if (phone) {
    const cleanedPhone = normalizePhone(phone);
    window.open(`https://wa.me/${cleanedPhone}?text=${encodedMessage}`, '_blank');
    return;
  }

  window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
}

function normalizePhone(phone: string) {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('60')) return cleaned;
  if (cleaned.startsWith('0')) return `6${cleaned}`;

  return cleaned;
}

await createWhatsAppReminder({
  title: 'Payment Recorded',
  message: `Hi, your payment has been recorded successfully. Thank you from JEP Image Makeup Academy.`,
});