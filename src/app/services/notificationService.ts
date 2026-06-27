import { supabase } from '../lib/supabase';

export interface CreateNotificationInput {
  userId?: string | null;
  academyId?: string | null;
  templateId?: string | null;

  title: string;
  message: string;

  channel?: 'in_app' | 'whatsapp' | 'email';
  deliveryStatus?: 'pending' | 'sent' | 'failed';

  sentAt?: string | null;

  type?: string | null;
  priority?: 'low' | 'normal' | 'high' | null;
  relatedModule?: string | null;
}

export interface CreateWhatsAppReminderInput {
  userId?: string | null;
  academyId?: string | null;
  templateId?: string | null;

  title: string;
  message: string;
  phone?: string | null;

  type?: string | null;
  priority?: 'low' | 'normal' | 'high' | null;
  relatedModule?: string | null;
}

export async function createNotification(input: CreateNotificationInput) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      academy_id: input.academyId || null,
      user_id: input.userId || null,
      template_id: input.templateId || null,

      channel: input.channel || 'in_app',
      title: input.title,
      message: input.message,

      delivery_status: input.deliveryStatus || 'pending',
      sent_at: input.sentAt || null,

      type: input.type || null,
      priority: input.priority || 'normal',
      related_module: input.relatedModule || null,

      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }

  return data;
}

export async function createWhatsAppReminder(
  input: CreateWhatsAppReminderInput
) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      academy_id: input.academyId || null,
      user_id: input.userId || null,
      template_id: input.templateId || null,

      channel: 'whatsapp',
      title: input.title,
      message: input.message,

      delivery_status: 'pending',
      sent_at: null,

      type: input.type || 'whatsapp',
      priority: input.priority || 'normal',
      related_module: input.relatedModule || null,

      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create WhatsApp reminder:', error.message);
    return null;
  }

  return data;
}

export async function markNotificationAsSent(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({
      delivery_status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) {
    console.error('Failed to mark notification as sent:', error.message);
    return false;
  }

  return true;
}

export async function markNotificationAsFailed(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({
      delivery_status: 'failed',
    })
    .eq('id', notificationId);

  if (error) {
    console.error('Failed to mark notification as failed:', error.message);
    return false;
  }

  return true;
}