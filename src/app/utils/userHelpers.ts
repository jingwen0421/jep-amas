export const roles = [
  'super_admin',
  'admin',
  'owner',
  'teacher',
  'finance',
  'student',
];

export const permissions: Record<string, string[]> = {
  super_admin: [
    'Full system access',
    'Manage users and roles',
    'Manage settings',
    'View audit logs',
  ],
  admin: [
    'Manage students',
    'Approve registrations',
    'Manage classes',
    'Issue certificates',
  ],
  owner: [
    'View reports',
    'View revenue',
    'View analytics',
    'Monitor academy performance',
  ],
  teacher: [
    'View assigned classes',
    'Take attendance',
    'Review portfolios',
    'Give feedback',
  ],
  finance: [
    'Manage payments',
    'Record installments',
    'Generate receipts',
    'View outstanding balances',
  ],
  student: [
    'View own profile',
    'Submit portfolio',
    'View certificates',
    'View payment status',
  ],
};

export function formatRole(role: string) {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'admin') return 'Admin';
  if (role === 'owner') return 'Owner';
  if (role === 'teacher') return 'Teacher';
  if (role === 'finance') return 'Finance Staff';
  if (role === 'student') return 'Student';
  return role;
}

type Translate = (key: string, params?: Record<string, string | number>) => string;

const ROLE_KEYS: Record<string, string> = {
  super_admin: 'auditLogs.role.superAdmin',
  owner: 'auditLogs.role.owner',
  admin: 'login.role.admin',
  teacher: 'login.role.teacher',
  finance: 'login.role.finance',
  student: 'login.role.student',
};

// Translates a raw role value (e.g. from SystemUser.rawRole) for display.
// Keeps state holding the raw enum and only formats it at render time.
export function translateRole(role: string, t: Translate) {
  const key = ROLE_KEYS[role];
  return key ? t(key) : formatRole(role);
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}