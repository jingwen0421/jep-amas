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

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}