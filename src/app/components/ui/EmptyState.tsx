import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  message: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, message, hint, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl p-10 border border-dashed border-[rgba(40,67,66,0.2)] text-center">
      {icon && (
        <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-[#e9da95]/20 flex items-center justify-center text-[#284342]">
          {icon}
        </div>
      )}

      <p className="text-[#284342]">{message}</p>

      {hint && <p className="text-sm text-[#6b6b6b] mt-1">{hint}</p>}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-5 py-2.5 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors text-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
