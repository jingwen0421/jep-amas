import { X } from 'lucide-react';
import type { ReactNode } from 'react';

// The backdrop + white card chrome was hand-copied identically 5 times
// across the payments pages. Callers keep control of their own header/
// footer layout (they differ enough — bordered header+footer vs. inline
// title — that forcing one shape would change how pages look).
export function Modal({
  maxWidth = 'max-w-2xl',
  scrollable = false,
  children,
}: {
  maxWidth?: string;
  scrollable?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-xl ${maxWidth} w-full ${
          scrollable ? 'max-h-[90vh] overflow-auto' : ''
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl text-[#284342]">{title}</h2>
      <button onClick={onClose}>
        <X size={20} className="text-[#284342]" />
      </button>
    </div>
  );
}
