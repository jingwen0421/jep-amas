import type { ReactNode } from 'react';

// Covers the 4 near-duplicate stat-tile components that had accumulated
// across the payments pages (plain label/value, icon+label/value, and
// icon-in-a-colored-box+label/value) behind one component, reproducing
// each page's existing markup exactly via props rather than changing how
// anything looks.
export function SummaryCard({
  label,
  value,
  valueColor = 'text-[#284342]',
  valueSize = 'text-2xl',
  icon,
  iconBoxClass,
}: {
  label: string;
  value: string;
  valueColor?: string;
  valueSize?: 'text-2xl' | 'text-3xl';
  icon?: ReactNode;
  iconBoxClass?: string;
}) {
  if (icon && iconBoxClass) {
    return (
      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-lg ${iconBoxClass}`}>{icon}</div>
          <div>
            <p className="text-sm text-[#6b6b6b]">{label}</p>
            <p className={`text-2xl ${valueColor}`}>{value}</p>
          </div>
        </div>
      </div>
    );
  }

  if (icon) {
    return (
      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
        <div className="flex items-center gap-3 mb-2">
          {icon}
          <div>
            <p className="text-sm text-[#6b6b6b]">{label}</p>
            <p className={`text-2xl ${valueColor}`}>{value}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <p className="text-sm text-[#6b6b6b] mb-2">{label}</p>
      <p className={`${valueSize} ${valueColor}`}>{value}</p>
    </div>
  );
}
