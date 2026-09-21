import { type PaymentPlan, formatCurrency } from '../../../services/paymentsService';
import { Modal, ModalHeader } from '../../../components/payments/Modal';
import { useLanguage } from '../../../context/LanguageContext';

export function PlanDetailsModal({
  plan,
  onClose,
}: {
  plan: PaymentPlan;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const outstanding = Math.max(plan.totalFee - plan.paidAmount, 0);

  function installmentStatusLabel(status: string) {
    if (status === 'Paid') return t('payments.installments.paid');
    if (status === 'Overdue') return t('payments.installments.overdue');
    return t('common.pending');
  }

  function planTypeLabel(rawPlanType: string) {
    if (rawPlanType === 'full_payment') return t('payments.plans.typeFullPayment');
    if (rawPlanType === 'deposit_balance') return t('payments.plans.typeDepositBalance');
    return t('payments.plans.typeInstallments');
  }

  function planStatusLabel(status: string) {
    switch (status) {
      case 'Completed':
        return t('common.completed');
      case 'Overdue':
        return t('payments.installments.overdue');
      case 'Critical':
        return t('payments.outstanding.critical');
      default:
        return t('common.pending');
    }
  }

  return (
    <Modal maxWidth="max-w-3xl" scrollable>
      <div className="p-6 border-b border-[rgba(40,67,66,0.1)]">
        <ModalHeader title={t('payments.plans.detailsTitle')} onClose={onClose} />
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Info label={t('payments.installments.colStudent')} value={plan.student} />
          <Info label={t('payments.installments.colCourse')} value={plan.course} />
          <Info label={t('payments.plans.planType')} value={planTypeLabel(plan.rawPlanType)} />
          <Info label={t('payments.installments.colStatus')} value={planStatusLabel(plan.status)} />
          <Info label={t('payments.plans.originalFee')} value={formatCurrency(plan.originalFee)} />
          <Info label={t('payments.plans.discount')} value={formatCurrency(plan.discountAmount)} />
          <Info label={t('payments.plans.finalFee')} value={formatCurrency(plan.totalFee)} />
          <Info label={t('payments.outstanding.colOutstanding')} value={formatCurrency(outstanding)} />
        </div>

        <div>
          <h3 className="text-lg text-[#284342] mb-4">{t('payments.plans.installmentBreakdown')}</h3>

          <div className="space-y-3">
            {plan.installmentDetails.length === 0 && (
              <div className="p-4 rounded-lg bg-[#f8f8f6] text-sm text-[#6b6b6b]">
                {t('payments.plans.noInstallmentRecords')}
              </div>
            )}

            {plan.installmentDetails.map((item, index) => (
              <div
                key={item.id}
                className="p-4 rounded-lg bg-[#f8f8f6] flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-[#284342]">{t('payments.plans.installmentNumber', { number: index + 1 })}</p>

                  <p className="text-xs text-[#6b6b6b] mt-1">{t('payments.plans.dueLabel', { date: item.dueDate })}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-[#284342]">{formatCurrency(item.amount)}</p>

                  <p className="text-xs text-[#6b6b6b] mt-1">{t('payments.plans.paidLabel', { date: item.paidDate })}</p>

                  <span
                    className={`inline-block mt-2 text-xs px-3 py-1 rounded-full ${
                      item.status === 'Paid'
                        ? 'bg-green-100 text-green-700'
                        : item.status === 'Overdue'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {installmentStatusLabel(item.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-[rgba(40,67,66,0.1)]">
        <button
          onClick={onClose}
          className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
        >
          {t('payments.receipts.close')}
        </button>
      </div>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6b6b6b] mb-1">{label}</p>
      <p className="text-[#284342]">{value}</p>
    </div>
  );
}
