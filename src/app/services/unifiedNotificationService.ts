import { createNotification, createWhatsAppReminder } from './notificationService';
import { sendEmail } from './communicationService';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../utils/session';

export interface NotifyTarget {
  userId?: string | null;
  name?: string;
  email?: string | null;
  phone?: string | null;
}

export interface NotifyInput {
  target: NotifyTarget;
  channels: Array<'in_app' | 'email' | 'whatsapp'>;
  title: string;
  message: string;
  emailHtml?: string;
  type?: string | null;
  priority?: 'low' | 'normal' | 'high' | null;
  relatedModule?: string | null;
  relatedId?: string | null;
}

export interface NotifyResult {
  inApp?: { success: boolean; error?: string };
  email?: { success: boolean; error?: string };
  whatsapp?: { success: boolean; error?: string; waLink?: string };
}

export async function notify(input: NotifyInput): Promise<NotifyResult> {
  const result: NotifyResult = {};

  const tasks: Promise<void>[] = [];

  if (input.channels.includes('in_app')) {
    tasks.push(
      createNotification({
        userId: input.target.userId || null,
        title: input.title,
        message: input.message,
        channel: 'in_app',
        deliveryStatus: 'sent',
        sentAt: new Date().toISOString(),
        type: input.type || null,
        priority: input.priority || 'normal',
        relatedModule: input.relatedModule || null,
      }).then((note) => {
        result.inApp = { success: !!note, error: note ? undefined : 'Failed to create notification.' };
      })
    );
  }

  if (input.channels.includes('email')) {
    if (!input.target.email) {
      result.email = { success: false, error: 'No email on file' };
    } else {
      tasks.push(
        sendEmail({
          to: input.target.email,
          toName: input.target.name,
          subject: input.title,
          body: input.emailHtml || input.message,
          userId: input.target.userId || null,
          relatedModule: input.relatedModule || null,
        }).then((res) => {
          result.email = res;
        })
      );
    }
  }

  if (input.channels.includes('whatsapp')) {
    const waLink = input.target.phone ? buildWaLink(input.target.phone, input.message) : undefined;

    tasks.push(
      createWhatsAppReminder({
        userId: input.target.userId || null,
        title: input.title,
        message: input.message,
        phone: input.target.phone || null,
        type: input.type || null,
        priority: input.priority || 'normal',
        relatedModule: input.relatedModule || null,
      }).then((note) => {
        result.whatsapp = {
          success: !!note,
          error: note ? undefined : 'Failed to queue WhatsApp reminder.',
          waLink,
        };
      })
    );
  }

  await Promise.all(tasks);

  return result;
}

function buildWaLink(phone: string, message: string) {
  const digits = phone.replace(/[^\d+]/g, '').replace('+', '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

// ==================== PAYMENT REMINDERS (shared by PaymentPlans & OutstandingBalances) ====================

export interface PaymentReminderInput {
  studentName: string;
  target: NotifyTarget;
  outstandingAmount: number;
  nextDueDate: string;
  relatedId: string;
}

export async function sendPaymentReminder(
  input: PaymentReminderInput
): Promise<NotifyResult> {
  const message = `Hi ${input.studentName},

This is a friendly reminder from JEP Image Makeup Academy.

Our records show an outstanding balance of RM ${input.outstandingAmount.toLocaleString()}.

Due Date: ${input.nextDueDate}

If you have already made the payment, please ignore this message.

Thank you.`;

  const result = await notify({
    target: input.target,
    channels: ['in_app', 'email', 'whatsapp'],
    title: 'Outstanding Payment Reminder',
    message,
    type: 'payment',
    priority: 'high',
    relatedModule: 'Payments',
    relatedId: input.relatedId,
  });

  const currentUser = getCurrentUser();

  await supabase.from('audit_logs').insert({
    user_id: currentUser.id || null,
    action: 'Payment Reminder Sent',
    module: 'Payments',
    target_id: input.relatedId,
    old_data: null,
    new_data: {
      student: input.studentName,
      phone: input.target.phone,
      email: input.target.email,
      outstanding_amount: input.outstandingAmount,
      next_due_date: input.nextDueDate,
      sent_by: currentUser.email,
      role: currentUser.role,
    },
    created_at: new Date().toISOString(),
  });

  return result;
}
