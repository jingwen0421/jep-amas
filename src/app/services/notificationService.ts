import { supabase } from '../lib/supabase';

// notifications_insert_academy's RLS check is `in_my_academy(academy_id)`,
// which requires academy_id to actually match the caller's own academy —
// passing null fails that check for anyone who isn't super_admin (null
// against an academy id compares as NULL, not true). Every call site here
// used to pass academyId as null/undefined, so most notification inserts
// were silently rejected before this fix (createNotification only
// console.errors and returns null on failure, so it never surfaced).
// Resolve it once per call instead of threading it through every caller.
let cachedAcademyId: string | null | undefined;

async function resolveAcademyId(explicit?: string | null) {
  if (explicit) return explicit;

  if (cachedAcademyId !== undefined) return cachedAcademyId;

  const { data, error } = await supabase.rpc('current_academy_id');

  cachedAcademyId = error ? null : (data as string | null);
  return cachedAcademyId;
}

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
  const academyId = await resolveAcademyId(input.academyId);

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      academy_id: academyId,
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
  const academyId = await resolveAcademyId(input.academyId);

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      academy_id: academyId,
      user_id: input.userId || null,
      template_id: input.templateId || null,

      channel: 'whatsapp',
      title: input.title,
      message: input.message,
      contact_phone: input.phone || null,

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