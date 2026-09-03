import type { EnrollmentOption } from '../../../services/paymentsService';
import { Modal } from '../../../components/payments/Modal';
import { FeeFields, PaymentPlanFields } from './PlanFormFields';

export interface CreateFormData {
  enrollmentId: string;
  studentId: string;
  originalFee: string;
  discountAmount: string;
  finalAmount: string;
  planType: string;
  installments: string;
  firstDueDate: string;
}

export function CreatePlanModal({
  enrollments,
  formData,
  setFormData,
  onClose,
  onCreate,
}: {
  enrollments: EnrollmentOption[];
  formData: CreateFormData;
  setFormData: React.Dispatch<React.SetStateAction<CreateFormData>>;
  onClose: () => void;
  onCreate: () => void;
}) {
  function updateFee(originalFeeValue: string, discountValue: string) {
    const originalFee = Number(originalFeeValue || 0);
    const discount = Number(discountValue || 0);
    const finalAmount = Math.max(originalFee - discount, 0);

    setFormData((prev) => ({
      ...prev,
      originalFee: originalFeeValue,
      discountAmount: discountValue,
      finalAmount: finalAmount ? String(finalAmount) : '',
    }));
  }

  return (
    <Modal>
      <div className="p-6">
        <h2 className="text-xl text-[#284342] mb-6">Create Payment Plan</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#284342] mb-2">Student</label>

            <select
              value={formData.studentId}
              onChange={(event) => {
                const selected = enrollments.find(
                  (item) => item.studentId === event.target.value
                );

                const fee = String(selected?.courseFee || 0);

                setFormData((prev) => ({
                  ...prev,
                  studentId: selected?.studentId || '',
                  enrollmentId: selected?.id || '',
                  originalFee: fee,
                  discountAmount: '0',
                  finalAmount: fee,
                }));
              }}
              className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            >
              <option value="">Select Student</option>

              {enrollments.map((enrollment) => (
                <option key={enrollment.studentId} value={enrollment.studentId}>
                  {enrollment.studentName} - {enrollment.courseName}
                  {!enrollment.hasEnrollment ? ' (No Enrollment)' : ''}
                </option>
              ))}
            </select>

            <p className="text-xs text-[#6b6b6b] mt-2">
              Students without enrollment are shown, but payment plan can only
              be created after they are assigned to a class batch.
            </p>
          </div>

          <FeeFields
            originalFee={formData.originalFee}
            discountAmount={formData.discountAmount}
            finalAmount={formData.finalAmount}
            onOriginalFeeChange={(value) => updateFee(value, formData.discountAmount)}
            onDiscountChange={(value) => updateFee(formData.originalFee, value)}
          />

          <PaymentPlanFields
            planType={formData.planType}
            installments={formData.installments}
            firstDueDate={formData.firstDueDate}
            setPlanType={(value) =>
              setFormData((prev) => ({
                ...prev,
                planType: value,
                installments: value === 'full_payment' ? '1' : prev.installments,
              }))
            }
            setInstallments={(value) =>
              setFormData((prev) => ({ ...prev, installments: value }))
            }
            setFirstDueDate={(value) =>
              setFormData((prev) => ({ ...prev, firstDueDate: value }))
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
            onClick={onCreate}
            className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
          >
            Create Plan
          </button>
        </div>
      </div>
    </Modal>
  );
}
