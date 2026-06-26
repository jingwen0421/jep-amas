import { createNotification, createWhatsAppReminder } from './notificationService';

export async function notifyPaymentOverdue(
  studentName: string,
  amount: number,
  dueDate: string
) {
  const message = `${studentName} has an outstanding payment of RM${amount.toFixed(
    2
  )}. Due Date: ${dueDate}.`;

  await createNotification({
    title: 'Outstanding Payment',
    message,
    channel: 'in_app',
  });

  await createWhatsAppReminder({
    title: 'Outstanding Payment Reminder',
    message: `Hi ${studentName},

This is a friendly reminder that your outstanding payment of RM${amount.toFixed(
      2
    )} is due on ${dueDate}.

Thank you.

JEP Image Makeup Academy`,
  });
}

export async function notifyPortfolioSubmitted(
  studentName: string,
  portfolioTitle: string
) {
  await createNotification({
    title: 'Portfolio Submitted',
    message: `${studentName} submitted "${portfolioTitle}" for review.`,
  });
}

export async function notifyCertificateIssued(
  studentName: string,
  certificateType: string
) {
  await createNotification({
    title: 'Certificate Generated',
    message: `${certificateType} certificate generated for ${studentName}.`,
  });
}

export async function notifyAttendanceWarning(
  studentName: string,
  attendanceRate: number
) {
  await createNotification({
    title: 'Attendance Warning',
    message: `${studentName}'s attendance has dropped to ${attendanceRate}%.`,
  });
}

export async function notifyNewStudent(
  studentName: string
) {
  await createNotification({
    title: 'New Student Registered',
    message: `${studentName} has successfully registered.`,
  });
}