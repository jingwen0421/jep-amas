export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'owner'
  | 'teacher'
  | 'assistant_teacher'
  | 'student'
  | 'finance'
  | 'internal_sales'
  | 'external_sales'
  | 'parent';

export const ROLE_ACCESS: Record<UserRole, string[]> = {
  super_admin: ['*'],

  admin: [
    '/app/dashboard',
    '/app/notifications',
    '/app/students',
    '/app/courses',
    '/app/calendar',
    '/app/reschedule-requests',
    '/app/classes',
    '/app/attendance',
    '/app/appointments/availability',
    '/app/events',
    '/app/payments',
    '/app/portfolio',
    '/app/certificates',
    '/app/communications',
    '/app/survey',
    '/app/reports',
    '/app/documents',
    '/app/users',
    '/app/audit',
    '/app/crm',
  ],


  owner: [
    '/app/dashboard',
    '/app/notifications',
    '/app/reports',
    '/app/payments',
    '/app/documents',
    '/app/users',
    '/app/audit',
    '/app/crm',
  ],

  teacher: [
    '/app/dashboard',
    '/app/notifications',
    '/app/calendar',
    '/app/reschedule-requests',
    '/app/classes',
    '/app/attendance',
    '/app/appointments/availability',
    '/app/events',
    '/app/portfolio',
    '/app/certificates',
    '/app/documents',
  ],

  assistant_teacher: [
    '/app/dashboard',
    '/app/notifications',
    '/app/calendar',
    '/app/reschedule-requests',
    '/app/attendance/daily',
    '/app/appointments/availability',
    '/app/events',
    '/app/portfolio/gallery',
    '/app/portfolio/submissions',
    '/app/documents',
  ],

    student: [
    '/app/dashboard',
    '/app/notifications',
    '/app/calendar',
    '/app/reschedule-requests',
    '/app/events',
    '/app/portfolio/submissions',
    '/app/certificates/completion',
    '/app/certificates/attendance',
    '/app/payments/outstanding',
    '/app/payments/plans',
    '/app/payments/installments',
    '/app/payments/receipts',
    ],

  finance: [
    '/app/dashboard',
    '/app/notifications',
    '/app/students/list',
    '/app/payments',
    '/app/reports',
    '/app/documents',
  ],

  internal_sales: [
    '/app/dashboard',
    '/app/notifications',
    '/app/students/list',
    '/app/payments/outstanding',
    '/app/reports',
    '/app/crm',
  ],

  external_sales: [
    '/app/dashboard',
    '/app/notifications',
    '/app/students/list',
    '/app/payments/outstanding',
    '/app/crm',
  ],

  parent: [
    '/app/dashboard',
    '/app/notifications',
    '/app/certificates/completion',
    '/app/certificates/attendance',
    '/app/payments/outstanding',
  ],
};

export function normalizeRole(role: string) {
  return role.replace('-', '_') as UserRole;
}

export function canAccessPath(role: string, path: string) {
  const normalizedRole = normalizeRole(role);
  const allowed = ROLE_ACCESS[normalizedRole];

  if (!allowed) return false;
  if (allowed.includes('*')) return true;

  return allowed.some((allowedPath) => path.startsWith(allowedPath));
}

export function formatRoleLabel(role: string) {
  return role
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}