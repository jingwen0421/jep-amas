// Shared by CreatePlanModal and EditPlanModal — the fee inputs and
// plan-type/installments/first-due-date inputs are identical in both.

import { useLanguage } from '../../../context/LanguageContext';

export function FeeFields({
  originalFee,
  discountAmount,
  finalAmount,
  onOriginalFeeChange,
  onDiscountChange,
}: {
  originalFee: string;
  discountAmount: string;
  finalAmount: string;
  onOriginalFeeChange: (value: string) => void;
  onDiscountChange: (value: string) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm text-[#284342] mb-2">
          {t('payments.plans.originalFeeRm')}
        </label>

        <input
          type="number"
          value={originalFee}
          onChange={(event) => onOriginalFeeChange(event.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
        />
      </div>

      <div>
        <label className="block text-sm text-[#284342] mb-2">
          {t('payments.plans.discountRm')}
        </label>

        <input
          type="number"
          value={discountAmount}
          onChange={(event) => onDiscountChange(event.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
        />
      </div>

      <div>
        <label className="block text-sm text-[#284342] mb-2">
          {t('payments.plans.finalAmountRm')}
        </label>

        <input
          type="number"
          value={finalAmount}
          disabled
          className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-[#f8f8f6]"
        />
      </div>
    </div>
  );
}

export function PaymentPlanFields({
  planType,
  installments,
  firstDueDate,
  setPlanType,
  setInstallments,
  setFirstDueDate,
}: {
  planType: string;
  installments: string;
  firstDueDate: string;
  setPlanType: (value: string) => void;
  setInstallments: (value: string) => void;
  setFirstDueDate: (value: string) => void;
}) {
  const { t } = useLanguage();

  return (
    <>
      <div>
        <label className="block text-sm text-[#284342] mb-2">{t('payments.plans.paymentType')}</label>

        <select
          value={planType}
          onChange={(event) => setPlanType(event.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white"
        >
          <option value="full_payment">{t('payments.plans.typeFullPayment')}</option>
          <option value="deposit_balance">{t('payments.plans.typeDepositBalance')}</option>
          <option value="installment">{t('payments.plans.typeInstallments')}</option>
        </select>
      </div>

      {planType !== 'full_payment' && (
        <div>
          <label className="block text-sm text-[#284342] mb-2">
            {t('payments.plans.numberOfInstallments')}
          </label>

          <select
            value={installments}
            onChange={(event) => setInstallments(event.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white"
          >
            <option value="2">{t('payments.plans.installmentsCount', { count: 2 })}</option>
            <option value="3">{t('payments.plans.installmentsCount', { count: 3 })}</option>
            <option value="4">{t('payments.plans.installmentsCount', { count: 4 })}</option>
            <option value="5">{t('payments.plans.installmentsCount', { count: 5 })}</option>
            <option value="6">{t('payments.plans.installmentsCount', { count: 6 })}</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm text-[#284342] mb-2">{t('payments.plans.firstDueDate')}</label>

        <input
          type="date"
          value={firstDueDate}
          onChange={(event) => setFirstDueDate(event.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
        />
      </div>
    </>
  );
}
