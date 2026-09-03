import type { PaymentPlan } from '../../../services/paymentsService';
import { Modal } from '../../../components/payments/Modal';
import { FeeFields, PaymentPlanFields } from './PlanFormFields';

export interface EditFormData {
  originalFee: string;
  discountAmount: string;
  finalAmount: string;
  planType: string;
  installments: string;
  firstDueDate: string;
}

export function EditPlanModal({
  plan,
  editData,
  setEditData,
  onClose,
  onUpdate,
}: {
  plan: PaymentPlan;
  editData: EditFormData;
  setEditData: React.Dispatch<React.SetStateAction<EditFormData>>;
  onClose: () => void;
  onUpdate: () => void;
}) {
  function updateFee(originalFeeValue: string, discountValue: string) {
    const originalFee = Number(originalFeeValue || 0);
    const discount = Number(discountValue || 0);
    const finalAmount = Math.max(originalFee - discount, 0);

    setEditData((prev) => ({
      ...prev,
      originalFee: originalFeeValue,
      discountAmount: discountValue,
      finalAmount: finalAmount ? String(finalAmount) : '',
    }));
  }

  const paidInstallments = plan.installmentDetails.filter(
    (item) => item.status === 'Paid'
  ).length;

  return (
    <Modal>
      <div className="p-6">
        <h2 className="text-xl text-[#284342] mb-2">Edit Payment Plan</h2>

        <p className="text-sm text-[#6b6b6b] mb-6">
          {plan.student} - {plan.course}
        </p>

        {paidInstallments > 0 && (
          <div className="mb-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
            This plan has {paidInstallments} paid installment(s). Only unpaid
            installments will be regenerated.
          </div>
        )}

        <div className="space-y-4">
          <FeeFields
            originalFee={editData.originalFee}
            discountAmount={editData.discountAmount}
            finalAmount={editData.finalAmount}
            onOriginalFeeChange={(value) => updateFee(value, editData.discountAmount)}
            onDiscountChange={(value) => updateFee(editData.originalFee, value)}
          />

          <PaymentPlanFields
            planType={editData.planType}
            installments={editData.installments}
            firstDueDate={editData.firstDueDate}
            setPlanType={(value) =>
              setEditData((prev) => ({
                ...prev,
                planType: value,
                installments: value === 'full_payment' ? '1' : prev.installments,
              }))
            }
            setInstallments={(value) =>
              setEditData((prev) => ({ ...prev, installments: value }))
            }
            setFirstDueDate={(value) =>
              setEditData((prev) => ({ ...prev, firstDueDate: value }))
            }
          />
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={onUpdate}
            className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
          >
            Update Plan
          </button>
        </div>
      </div>
    </Modal>
  );
}
