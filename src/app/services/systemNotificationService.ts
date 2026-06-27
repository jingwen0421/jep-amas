import {
  createNotification,
  createWhatsAppReminder,
} from './notificationService';

interface NotifyTarget {
  userId?: string | null;
  studentName?: string;
  studentPhone?: string;
}

export async function notifyPaymentOverdue(
  studentName: string,
  amount: number,
  dueDate: string,
  target?: NotifyTarget
) {
  const message = `${studentName} has an outstanding payment of RM ${amount.toFixed(
    2
  )}. Due Date: ${dueDate}.`;

  await createNotification({
    userId: target?.userId || null,
    title: 'Outstanding Payment',
    message,
    channel: 'in_app',
    deliveryStatus: 'pending',
    type: 'payment',
    priority: 'high',
    relatedModule: 'Payments',
  });

  await createWhatsAppReminder({
    userId: target?.userId || null,
    title: 'Outstanding Payment Reminder',
    message: `Hi ${studentName},

This is a friendly reminder that your outstanding payment of RM ${amount.toFixed(
      2
    )} is due on ${dueDate}.

If you have already made the payment, please ignore this message.

Thank you.

JEP Image Makeup Academy`,
    phone: target?.studentPhone || null,
    type: 'payment',
    priority: 'high',
    relatedModule: 'Payments',
  });
}

export async function notifyPortfolioSubmitted(
  studentName: string,
  portfolioTitle: string,
  target?: NotifyTarget
) {
  await createNotification({
    userId: target?.userId || null,
    title: 'Portfolio Submitted',
    message: `${studentName} submitted "${portfolioTitle}" for review.`,
    channel: 'in_app',
    deliveryStatus: 'pending',
    type: 'portfolio',
    priority: 'normal',
    relatedModule: 'Portfolio',
  });
}

export async function notifyPortfolioReviewed(
  studentName: string,
  portfolioTitle: string,
  target?: NotifyTarget
) {
  await createNotification({
    userId: target?.userId || null,
    title: 'Portfolio Reviewed',
    message: `Your portfolio "${portfolioTitle}" has been reviewed.`,
    channel: 'in_app',
    deliveryStatus: 'pending',
    type: 'portfolio',
    priority: 'normal',
    relatedModule: 'Portfolio',
  });
}

export async function notifyCertificateIssued(
  studentName: string,
  certificateType: string,
  target?: NotifyTarget
) {
  await createNotification({
    userId: target?.userId || null,
    title: 'Certificate Generated',
    message: `${certificateType} certificate generated for ${studentName}.`,
    channel: 'in_app',
    deliveryStatus: 'pending',
    type: 'certificate',
    priority: 'normal',
    relatedModule: 'Certificates',
  });
}

export async function notifyAttendanceWarning(
  studentName: string,
  attendanceRate: number,
  target?: NotifyTarget
) {
  await createNotification({
    userId: target?.userId || null,
    title: 'Attendance Warning',
    message: `${studentName}'s attendance has dropped to ${attendanceRate}%.`,
    channel: 'in_app',
    deliveryStatus: 'pending',
    type: 'attendance',
    priority: 'high',
    relatedModule: 'Attendance',
  });
}

export async function notifyNewStudent(
  studentName: string,
  target?: NotifyTarget
) {
  await createNotification({
    userId: target?.userId || null,
    title: 'New Student Registered',
    message: `${studentName} has successfully registered.`,
    channel: 'in_app',
    deliveryStatus: 'pending',
    type: 'student',
    priority: 'normal',
    relatedModule: 'Students',
  });
}

export async function notifyStudentRegistrationSubmitted(
  studentName: string,
  target?: NotifyTarget
) {
  await createNotification({
    userId: target?.userId || null,
    title: 'Student Registration Submitted',
    message: `${studentName} has submitted a student registration application.`,
    channel: 'in_app',
    deliveryStatus: 'pending',
    type: 'student',
    priority: 'normal',
    relatedModule: 'Student Registration',
  });
}

export async function notifyStudentRegistrationApproved(
  studentName: string,
  target?: NotifyTarget
) {
  await createNotification({
    userId: target?.userId || null,
    title: 'Registration Approved',
    message: `Hi ${studentName}, your student registration has been approved.`,
    channel: 'in_app',
    deliveryStatus: 'pending',
    type: 'student',
    priority: 'normal',
    relatedModule: 'Student Registration',
  });
}

export async function notifyStudentRegistrationRejected(
  studentName: string,
  target?: NotifyTarget
) {
  await createNotification({
    userId: target?.userId || null,
    title: 'Registration Rejected',
    message: `Hi ${studentName}, your student registration application was rejected.`,
    channel: 'in_app',
    deliveryStatus: 'pending',
    type: 'student',
    priority: 'high',
    relatedModule: 'Student Registration',
  });
}

export async function notifyAppointmentBooked(
  studentName: string,
  appointmentDateTime: string,
  target?: NotifyTarget
) {
  await createNotification({
    userId: target?.userId || null,
    title: 'Appointment Booked',
    message: `${studentName} booked an appointment on ${appointmentDateTime}.`,
    channel: 'in_app',
    deliveryStatus: 'pending',
    type: 'appointment',
    priority: 'normal',
    relatedModule: 'Appointments',
  });
}

export async function notifyAppointmentConfirmed(
  appointmentDateTime: string,
  target?: NotifyTarget
) {
  await createNotification({
    userId: target?.userId || null,
    title: 'Appointment Confirmed',
    message: `Your appointment on ${appointmentDateTime} has been confirmed.`,
    channel: 'in_app',
    deliveryStatus: 'pending',
    type: 'appointment',
    priority: 'normal',
    relatedModule: 'Appointments',
  });
}

export async function notifyAppointmentCancelled(
  appointmentDateTime: string,
  target?: NotifyTarget
) {
  await createNotification({
    userId: target?.userId || null,
    title: 'Appointment Cancelled',
    message: `Your appointment on ${appointmentDateTime} has been cancelled.`,
    channel: 'in_app',
    deliveryStatus: 'pending',
    type: 'appointment',
    priority: 'high',
    relatedModule: 'Appointments',
  });
}