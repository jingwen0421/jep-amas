import { supabase } from '../lib/supabase';
import { createNotification, createWhatsAppReminder } from './notificationService';

// ==================== MESSAGE TEMPLATES ====================
// Backed by the real `message_templates` table (previously the
// Communications pages used hardcoded mock arrays and never touched it).

export type TemplateChannel = 'in_app' | 'whatsapp' | 'email';

export interface MessageTemplate {
  id: string;
  name: string;
  channel: TemplateChannel;
  language: string;
  body: string;
  status: string;
  updatedAt: string;
}

function mapTemplate(row: any): MessageTemplate {
  return {
    id: row.id,
    name: row.template_name,
    channel: row.channel,
    language: row.language,
    body: row.message_body,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

export async function fetchTemplates(channel?: TemplateChannel) {
  let query = supabase
    .from('message_templates')
    .select('*')
    .eq('status', 'active')
    .order('template_name', { ascending: true });

  if (channel) query = query.eq('channel', channel);

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch templates:', error.message);
    return [];
  }

  return (data || []).map(mapTemplate);
}

export async function saveTemplate(input: {
  id?: string;
  name: string;
  channel: TemplateChannel;
  language?: string;
  body: string;
}) {
  const payload = {
    template_name: input.name,
    channel: input.channel,
    language: input.language || 'en',
    message_body: input.body,
  };

  if (input.id) {
    const { error } = await supabase
      .from('message_templates')
      .update(payload)
      .eq('id', input.id);

    return { success: !error, error: error?.message };
  }

  const { error } = await supabase.from('message_templates').insert(payload);
  return { success: !error, error: error?.message };
}

export async function deleteTemplate(id: string) {
  // Soft-delete: templates may already be referenced by past notification
  // rows (notifications.template_id), so we deactivate rather than hard
  // delete to avoid orphaning that history.
  const { error } = await supabase
    .from('message_templates')
    .update({ status: 'inactive' })
    .eq('id', id);

  return { success: !error, error: error?.message };
}

// Fills {variableName} placeholders in a template body with actual values.
export function fillTemplate(body: string, values: Record<string, string>) {
  return body.replace(/\{(\w+)\}/g, (match, key) =>
    values[key] !== undefined ? values[key] : match
  );
}

// ==================== EMAIL (via Gmail, through the send-email Edge Function) ====================

export interface SendEmailInput {
  to: string;
  toName?: string;
  subject: string;
  body: string;
  userId?: string | null;
  templateId?: string | null;
  relatedModule?: string | null;
}

export async function sendEmail(input: SendEmailInput) {
  if (!input.to.trim()) {
    return { success: false, error: 'Recipient email address is required.' };
  }

  // Log it first so it shows up in the Email Communications / Notification
  // Center history even if the actual send fails — the Edge Function
  // flips this row to sent/failed once it knows the outcome.
  const note = await createNotification({
    userId: input.userId || null,
    templateId: input.templateId || null,
    title: input.subject,
    message: input.body,
    channel: 'email',
    deliveryStatus: 'pending',
    type: 'email',
    relatedModule: input.relatedModule || null,
  });

  if (!note) {
    return { success: false, error: 'Failed to log the email before sending.' };
  }

  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      to: input.to,
      subject: input.subject,
      html: input.body.replace(/\n/g, '<br/>'),
      text: input.body,
      notificationId: note.id,
    },
  });

  if (error) {
    return { success: false, error: error.message || 'Failed to reach the email service.' };
  }

  if (data?.error) {
    return { success: false, error: data.error as string };
  }

  return { success: true };
}

// ==================== WHATSAPP (manual — no automated sending) ====================
// WhatsApp Business API access has security/verification overhead the
// academy hasn't set up, so this stays a manual flow: we log the message
// and open a wa.me deep link for a human to actually press send, same as
// before — just now properly tied to real data instead of mock rows.

export async function queueWhatsAppMessage(input: {
  to: string;
  toName?: string;
  message: string;
  userId?: string | null;
  templateId?: string | null;
  relatedModule?: string | null;
}) {
  const result = await createWhatsAppReminder({
    userId: input.userId || null,
    templateId: input.templateId || null,
    title: input.toName ? `WhatsApp to ${input.toName}` : 'WhatsApp message',
    message: input.message,
    phone: input.to || null,
    relatedModule: input.relatedModule || null,
  });

  return { success: !!result, error: result ? undefined : 'Failed to queue message.' };
}

export function openWhatsAppChat(phone: string, message: string) {
  const digits = phone.replace(/[^\d+]/g, '');
  window.open(
    `https://wa.me/${digits.replace('+', '')}?text=${encodeURIComponent(message)}`,
    '_blank'
  );
}

// ==================== RECIPIENT GROUPS (for Broadcast Messages) ====================

export interface Recipient {
  userId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
}

export async function fetchRecipientGroup(
  group: 'all_students' | 'all_teachers' | 'course' | 'batch',
  refId?: string
): Promise<Recipient[]> {
  if (group === 'all_students') {
    const { data, error } = await supabase
      .from('students')
      .select('user_id, full_name, email, phone')
      .eq('status', 'active');

    if (error) {
      console.error('Failed to fetch students:', error.message);
      return [];
    }

    return (data || []).map((s: any) => ({
      userId: s.user_id || null,
      name: s.full_name,
      email: s.email,
      phone: s.phone,
    }));
  }

  if (group === 'all_teachers') {
    const { data, error } = await supabase
      .from('teachers')
      .select('user_id, users(full_name, email, phone)')
      .eq('status', 'active');

    if (error) {
      console.error('Failed to fetch teachers:', error.message);
      return [];
    }

    return (data || []).map((t: any) => {
      const user = Array.isArray(t.users) ? t.users[0] : t.users;
      return {
        userId: t.user_id || null,
        name: user?.full_name || 'Teacher',
        email: user?.email || null,
        phone: user?.phone || null,
      };
    });
  }

  if (group === 'course' && refId) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('students(user_id, full_name, email, phone), class_batches!inner(course_id)')
      .eq('class_batches.course_id', refId)
      .eq('enrollment_status', 'active');

    if (error) {
      console.error('Failed to fetch course recipients:', error.message);
      return [];
    }

    return dedupeRecipients(
      (data || []).map((row: any) => {
        const s = Array.isArray(row.students) ? row.students[0] : row.students;
        return {
          userId: s?.user_id || null,
          name: s?.full_name || 'Student',
          email: s?.email || null,
          phone: s?.phone || null,
        };
      })
    );
  }

  if (group === 'batch' && refId) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('students(user_id, full_name, email, phone)')
      .eq('batch_id', refId)
      .eq('enrollment_status', 'active');

    if (error) {
      console.error('Failed to fetch batch recipients:', error.message);
      return [];
    }

    return dedupeRecipients(
      (data || []).map((row: any) => {
        const s = Array.isArray(row.students) ? row.students[0] : row.students;
        return {
          userId: s?.user_id || null,
          name: s?.full_name || 'Student',
          email: s?.email || null,
          phone: s?.phone || null,
        };
      })
    );
  }

  return [];
}

function dedupeRecipients(list: Recipient[]) {
  const seen = new Set<string>();
  return list.filter((r) => {
    const key = r.userId || r.email || r.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
