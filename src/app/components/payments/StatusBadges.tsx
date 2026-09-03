// The three payment pages track genuinely different questions (an
// installment's paid state, a plan's lifecycle, a balance's urgency), so
// they keep separate enums/colors — this just stops each badge from being
// hand-copied per page.

export function InstallmentStatusBadge({
  status,
}: {
  status: 'Paid' | 'Pending' | 'Overdue';
}) {
  const className =
    status === 'Paid'
      ? 'bg-green-100 text-green-700'
      : status === 'Overdue'
      ? 'bg-red-100 text-red-700'
      : 'bg-yellow-100 text-yellow-700';

  return (
    <span className={`text-xs px-3 py-1 rounded-full ${className}`}>{status}</span>
  );
}

export function PlanStatusBadge({
  status,
}: {
  status: 'Active' | 'Completed' | 'Overdue';
}) {
  const className =
    status === 'Completed'
      ? 'bg-green-100 text-green-700'
      : status === 'Overdue'
      ? 'bg-red-100 text-red-700'
      : 'bg-blue-100 text-blue-700';

  return (
    <span className={`text-xs px-3 py-1 rounded-full ${className}`}>{status}</span>
  );
}

export function BalanceStatusBadge({
  status,
}: {
  status: 'Pending' | 'Overdue' | 'Critical';
}) {
  const className =
    status === 'Critical'
      ? 'bg-red-100 text-red-700'
      : status === 'Overdue'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-blue-100 text-blue-700';

  return (
    <span className={`text-xs px-3 py-1 rounded-full ${className}`}>{status}</span>
  );
}
