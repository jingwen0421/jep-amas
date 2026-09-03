import { type PaymentPlan, formatCurrency } from '../../../services/paymentsService';
import { Modal, ModalHeader } from '../../../components/payments/Modal';

export function PlanDetailsModal({
  plan,
  onClose,
}: {
  plan: PaymentPlan;
  onClose: () => void;
}) {
  const outstanding = Math.max(plan.totalFee - plan.paidAmount, 0);

  return (
    <Modal maxWidth="max-w-3xl" scrollable>
      <div className="p-6 border-b border-[rgba(40,67,66,0.1)]">
        <ModalHeader title="Payment Plan Details" onClose={onClose} />
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Info label="Student" value={plan.student} />
          <Info label="Course" value={plan.course} />
          <Info label="Plan Type" value={plan.planType} />
          <Info label="Status" value={plan.status} />
          <Info label="Original Fee" value={formatCurrency(plan.originalFee)} />
          <Info label="Discount" value={formatCurrency(plan.discountAmount)} />
          <Info label="Final Fee" value={formatCurrency(plan.totalFee)} />
          <Info label="Outstanding" value={formatCurrency(outstanding)} />
        </div>

        <div>
          <h3 className="text-lg text-[#284342] mb-4">Installment Breakdown</h3>

          <div className="space-y-3">
            {plan.installmentDetails.length === 0 && (
              <div className="p-4 rounded-lg bg-[#f8f8f6] text-sm text-[#6b6b6b]">
                No installment records found.
              </div>
            )}

            {plan.installmentDetails.map((item, index) => (
              <div
                key={item.id}
                className="p-4 rounded-lg bg-[#f8f8f6] flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-[#284342]">Installment {index + 1}</p>

                  <p className="text-xs text-[#6b6b6b] mt-1">Due: {item.dueDate}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-[#284342]">{formatCurrency(item.amount)}</p>

                  <p className="text-xs text-[#6b6b6b] mt-1">Paid: {item.paidDate}</p>

                  <span
                    className={`inline-block mt-2 text-xs px-3 py-1 rounded-full ${
                      item.status === 'Paid'
                        ? 'bg-green-100 text-green-700'
                        : item.status === 'Overdue'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {item.status}
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
          Close
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
