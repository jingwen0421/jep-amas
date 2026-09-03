// Shared by CreatePlanModal and EditPlanModal — the fee inputs and
// plan-type/installments/first-due-date inputs are identical in both.

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm text-[#284342] mb-2">
          Original Fee (RM)
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
          Discount (RM)
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
          Final Amount (RM)
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
  return (
    <>
      <div>
        <label className="block text-sm text-[#284342] mb-2">Payment Type</label>

        <select
          value={planType}
          onChange={(event) => setPlanType(event.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white"
        >
          <option value="full_payment">Full Payment</option>
          <option value="deposit_balance">Deposit + Balance</option>
          <option value="installment">Installments</option>
        </select>
      </div>

      {planType !== 'full_payment' && (
        <div>
          <label className="block text-sm text-[#284342] mb-2">
            Number of Installments
          </label>

          <select
            value={installments}
            onChange={(event) => setInstallments(event.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white"
          >
            <option value="2">2 Installments</option>
            <option value="3">3 Installments</option>
            <option value="4">4 Installments</option>
            <option value="5">5 Installments</option>
            <option value="6">6 Installments</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm text-[#284342] mb-2">First Due Date</label>

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
