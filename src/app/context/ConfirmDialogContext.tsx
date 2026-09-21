import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';
import { useLanguage } from './LanguageContext';

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
}

type ConfirmFn = (message: string, options?: ConfirmOptions) => Promise<boolean>;

const ConfirmDialogContext = createContext<ConfirmFn | undefined>(undefined);

interface PendingConfirm extends ConfirmOptions {
  message: string;
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirmDialog = useCallback<ConfirmFn>((message, options) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setPending({ message, ...options });
    });
  }, []);

  function settle(result: boolean) {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setPending(null);
  }

  return (
    <ConfirmDialogContext.Provider value={confirmDialog}>
      {children}

      {pending && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            {pending.title && (
              <h2 className="text-lg text-[#284342] mb-3">{pending.title}</h2>
            )}

            <p className="text-sm text-[#284342] whitespace-pre-line">
              {pending.message}
            </p>

            <div className="flex items-center gap-3 mt-6 justify-end">
              <button
                onClick={() => settle(false)}
                className="px-5 py-2.5 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm"
              >
                {pending.cancelLabel || t('common.cancel')}
              </button>

              <button
                onClick={() => settle(true)}
                className={`px-5 py-2.5 rounded-lg text-sm transition-colors ${
                  pending.variant === 'danger'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e]'
                }`}
              >
                {pending.confirmLabel || t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmDialogProvider');
  }
  return context;
}
