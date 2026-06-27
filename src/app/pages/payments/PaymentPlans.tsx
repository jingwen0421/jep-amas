import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  DollarSign,
  Plus,
  Eye,
  Send,
  X,
  Edit,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../utils/session';
import { getCurrentStudentId } from '../../utils/studentAccess';

interface InstallmentItem {
  id: string;
  amount: number;
  dueDate: string;
  paidDate: string;
  status: string;
}

interface PaymentPlan {
  id: string;
  enrollmentId: string;
  studentId: string;
  student: string;
  course: string;
  originalFee: number;
  discountAmount: number;
  totalFee: number;
  paidAmount: number;
  planType: 'Full Payment' | 'Installments' | 'Deposit + Balance';
  rawPlanType: string;
  installments: number;
  nextPayment: string;
  nextAmount: number;
  status: 'Active' | 'Completed' | 'Overdue';
  installmentDetails: InstallmentItem[];
}

interface EnrollmentOption {
  id: string;
  student_id: string;
  students?: { full_name: string }[] | { full_name: string } | null;
  class_batches?:
    | {
        courses?:
          | { course_name: string; course_fee: number }[]
          | { course_name: string; course_fee: number }
          | null;
      }[]
    | {
        courses?:
          | { course_name: string; course_fee: number }
          | { course_name: string; course_fee: number }[]
          | null;
      }
    | null;
}

export default function PaymentPlans() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const isStudentView = currentUser.role === 'student';

  const canManagePaymentPlans =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'admin' ||
    currentUser.role === 'finance';

  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentOption[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [editingPlan, setEditingPlan] = useState<PaymentPlan | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    enrollmentId: '',
    originalFee: '',
    discountAmount: '0',
    finalAmount: '',
    planType: 'full_payment',
    installments: '1',
    firstDueDate: new Date().toISOString().slice(0, 10),
  });

  const [editData, setEditData] = useState({
    originalFee: '',
    discountAmount: '0',
    finalAmount: '',
    planType: 'full_payment',
    installments: '1',
    firstDueDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    fetchPaymentPlans();

    if (canManagePaymentPlans) {
      fetchEnrollments();
    }
  }, []);

  async function fetchPaymentPlans() {
    setLoading(true);

    let query = supabase
      .from('payment_plans')
      .select(`
        id,
        enrollment_id,
        student_id,
        original_fee,
        discount_amount,
        final_amount,
        plan_type,
        status,
        students!payment_plans_student_id_fkey(full_name),
        enrollments!payment_plans_enrollment_id_fkey(
          class_batches(
            courses(course_name)
          )
        ),
        installments(
          id,
          amount,
          due_date,
          paid_date,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (isStudentView) {
      const studentId = await getCurrentStudentId();

      if (!studentId) {
        setPlans([]);
        setLoading(false);
        return;
      }

      query = query.eq('student_id', studentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching payment plans:', error.message);
      setLoading(false);
      return;
    }

    const mapped: PaymentPlan[] = (data || []).map((plan: any) => {
      const installments = (plan.installments || []).sort((a: any, b: any) =>
        String(a.due_date).localeCompare(String(b.due_date))
      );

      const originalFee = Number(plan.original_fee || 0);
      const discountAmount = Number(plan.discount_amount || 0);
      const totalFee = Number(plan.final_amount || originalFee - discountAmount);

      const paidAmount = installments
        .filter((item: any) => String(item.status).toLowerCase() === 'paid')
        .reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

      const unpaidInstallments = installments.filter(
        (item: any) => String(item.status).toLowerCase() !== 'paid'
      );

      const next = unpaidInstallments[0];

      return {
        id: plan.id,
        enrollmentId: plan.enrollment_id,
        studentId: plan.student_id,
        student: getStudentName(plan.students),
        course: getCourseNameFromEnrollment(plan.enrollments),
        originalFee,
        discountAmount,
        totalFee,
        paidAmount,
        planType: mapPlanType(plan.plan_type),
        rawPlanType: plan.plan_type || 'full_payment',
        installments: installments.length,
        nextPayment: next?.due_date || '-',
        nextAmount: Number(next?.amount || 0),
        status: mapPaymentStatus(plan.status, installments),
        installmentDetails: installments.map((item: any) => ({
          id: item.id,
          amount: Number(item.amount || 0),
          dueDate: item.due_date || '-',
          paidDate: item.paid_date ? String(item.paid_date).slice(0, 10) : '-',
          status: formatInstallmentStatus(item.status, item.due_date),
        })),
      };
    });

    setPlans(mapped);
    setLoading(false);
  }

  async function fetchEnrollments() {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        students(full_name),
        class_batches(
          courses(course_name, course_fee)
        )
      `)
      .eq('enrollment_status', 'active');

    if (error) {
      console.error('Error fetching enrollments:', error.message);
      return;
    }

    setEnrollments((data || []) as unknown as EnrollmentOption[]);
  }

  async function createPaymentPlan() {
    const selectedEnrollment = enrollments.find(
      (item) => item.id === formData.enrollmentId
    );

    if (!selectedEnrollment) {
      alert('Please select student enrollment.');
      return;
    }

    const { data: existingPlan } = await supabase
      .from('payment_plans')
      .select('id')
      .eq('enrollment_id', selectedEnrollment.id)
      .maybeSingle();

    if (existingPlan) {
      alert('This enrollment already has a payment plan. Please edit the existing plan instead.');
      return;
    }

    const originalFee = Number(formData.originalFee);
    const discountAmount = Number(formData.discountAmount || 0);
    const finalAmount = originalFee - discountAmount;

    if (!originalFee || originalFee <= 0) {
      alert('Please enter valid original fee.');
      return;
    }

    if (discountAmount < 0 || discountAmount >= originalFee) {
      alert('Discount must be lower than original fee.');
      return;
    }

    const { data: createdPlan, error } = await supabase
      .from('payment_plans')
      .insert({
        student_id: selectedEnrollment.student_id,
        enrollment_id: selectedEnrollment.id,
        original_fee: originalFee,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        plan_type: formData.planType,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      alert(`Failed to create payment plan: ${error.message}`);
      return;
    }

    const installmentRows = buildInstallmentRows({
      paymentPlanId: createdPlan.id,
      finalAmount,
      planType: formData.planType,
      installmentCount: Number(formData.installments || 1),
      firstDueDate: formData.firstDueDate,
    });

    const { error: installmentError } = await supabase
      .from('installments')
      .insert(installmentRows);

    if (installmentError) {
      alert(
        `Plan created, but failed to create installments: ${installmentError.message}`
      );
      return;
    }

    await supabase.from('audit_logs').insert({
      user_id: currentUser.id || null,
      action: 'Payment Plan Created',
      module: 'Payments',
      target_id: createdPlan.id,
      old_data: null,
      new_data: {
        student_id: selectedEnrollment.student_id,
        enrollment_id: selectedEnrollment.id,
        original_fee: originalFee,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        plan_type: formData.planType,
        installments: installmentRows.length,
        created_by: currentUser.email,
      },
      created_at: new Date().toISOString(),
    });

    resetCreateForm();
    setShowCreateModal(false);
    fetchPaymentPlans();
  }

  function openEditPlan(plan: PaymentPlan) {
    const firstPending =
      plan.installmentDetails.find((item) => item.status !== 'Paid') ||
      plan.installmentDetails[0];

    setEditingPlan(plan);
    setEditData({
      originalFee: String(plan.originalFee || plan.totalFee),
      discountAmount: String(plan.discountAmount || 0),
      finalAmount: String(plan.totalFee),
      planType: plan.rawPlanType || 'full_payment',
      installments:
        plan.rawPlanType === 'full_payment'
          ? '1'
          : String(Math.max(plan.installmentDetails.length, 2)),
      firstDueDate:
        firstPending?.dueDate && firstPending.dueDate !== '-'
          ? firstPending.dueDate
          : new Date().toISOString().slice(0, 10),
    });
  }

  async function updatePaymentPlan() {
    if (!editingPlan) return;

    const paidInstallments = editingPlan.installmentDetails.filter(
      (item) => item.status === 'Paid'
    );

    if (paidInstallments.length > 0) {
      const confirmed = confirm(
        'This plan already has paid installment(s). Updating will only regenerate unpaid installments. Continue?'
      );

      if (!confirmed) return;
    }

    const originalFee = Number(editData.originalFee);
    const discountAmount = Number(editData.discountAmount || 0);
    const finalAmount = originalFee - discountAmount;

    if (!originalFee || originalFee <= 0) {
      alert('Please enter valid original fee.');
      return;
    }

    if (discountAmount < 0 || discountAmount >= originalFee) {
      alert('Discount must be lower than original fee.');
      return;
    }

    const paidAmount = editingPlan.paidAmount;
    const remainingAmount = Math.max(finalAmount - paidAmount, 0);

    const { error: planError } = await supabase
      .from('payment_plans')
      .update({
        original_fee: originalFee,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        plan_type: editData.planType,
        status: remainingAmount <= 0 ? 'paid' : 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingPlan.id);

    if (planError) {
      alert(`Failed to update payment plan: ${planError.message}`);
      return;
    }

    const unpaidIds = editingPlan.installmentDetails
      .filter((item) => item.status !== 'Paid')
      .map((item) => item.id);

    if (unpaidIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('installments')
        .delete()
        .in('id', unpaidIds);

      if (deleteError) {
        alert(`Plan updated, but failed to remove old unpaid installments: ${deleteError.message}`);
        return;
      }
    }

    if (remainingAmount > 0) {
      const installmentRows = buildInstallmentRows({
        paymentPlanId: editingPlan.id,
        finalAmount: remainingAmount,
        planType: editData.planType,
        installmentCount: Number(editData.installments || 1),
        firstDueDate: editData.firstDueDate,
      });

      const { error: installmentError } = await supabase
        .from('installments')
        .insert(installmentRows);

      if (installmentError) {
        alert(`Plan updated, but failed to regenerate installments: ${installmentError.message}`);
        return;
      }
    }

    await supabase.from('audit_logs').insert({
      user_id: currentUser.id || null,
      action: 'Payment Plan Updated',
      module: 'Payments',
      target_id: editingPlan.id,
      old_data: {
        original_fee: editingPlan.originalFee,
        discount_amount: editingPlan.discountAmount,
        final_amount: editingPlan.totalFee,
        plan_type: editingPlan.rawPlanType,
      },
      new_data: {
        original_fee: originalFee,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        plan_type: editData.planType,
        paid_amount: paidAmount,
        remaining_amount: remainingAmount,
        updated_by: currentUser.email,
      },
      created_at: new Date().toISOString(),
    });

    setEditingPlan(null);
    fetchPaymentPlans();
    alert('Payment plan updated successfully.');
  }

  async function sendReminder(plan: PaymentPlan) {
    await supabase.from('audit_logs').insert({
      user_id: currentUser.id || null,
      action: 'Payment Reminder Sent',
      module: 'Payments',
      target_id: plan.id,
      old_data: null,
      new_data: {
        student: plan.student,
        course: plan.course,
        outstanding: Math.max(plan.totalFee - plan.paidAmount, 0),
        next_payment: plan.nextPayment,
        next_amount: plan.nextAmount,
        sent_by: currentUser.email,
      },
      created_at: new Date().toISOString(),
    });

    alert(`Reminder recorded for ${plan.student}.`);
  }

  function resetCreateForm() {
    setFormData({
      enrollmentId: '',
      originalFee: '',
      discountAmount: '0',
      finalAmount: '',
      planType: 'full_payment',
      installments: '1',
      firstDueDate: new Date().toISOString().slice(0, 10),
    });
  }

  const totalCollected = plans.reduce((sum, item) => sum + item.paidAmount, 0);

  const totalOutstanding = plans.reduce(
    (sum, item) => sum + Math.max(item.totalFee - item.paidAmount, 0),
    0
  );

  const overdueAmount = plans
    .filter((item) => item.status === 'Overdue')
    .reduce(
      (sum, item) => sum + Math.max(item.totalFee - item.paidAmount, 0),
      0
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">
            {isStudentView ? 'My Payment Plan' : 'Payment Plans'}
          </h1>

          <p className="text-[#6b6b6b] mt-1">
            {isStudentView
              ? 'View your tuition fee, payment plan and installment progress.'
              : 'Create, edit and monitor student payment plans.'}
          </p>
        </div>

        {canManagePaymentPlans && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Create Payment Plan
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AmountCard
          title={isStudentView ? 'My Paid Amount' : 'Total Collected'}
          amount={totalCollected}
          color="green"
        />

        <AmountCard
          title={isStudentView ? 'My Outstanding' : 'Outstanding Amount'}
          amount={totalOutstanding}
          color="yellow"
        />

        <AmountCard
          title={isStudentView ? 'Overdue Amount' : 'Overdue Payments'}
          amount={overdueAmount}
          color="red"
        />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)] flex items-center justify-between">
          <h2 className="text-lg text-[#284342]">
            {isStudentView ? 'My Active Payment Plan' : 'Active Payment Plans'}
          </h2>

          {canManagePaymentPlans && (
            <button
              onClick={fetchPaymentPlans}
              className="text-sm text-[#284342] flex items-center gap-2 hover:underline"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          )}
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {loading && (
            <div className="p-6 text-center text-[#6b6b6b]">
              Loading payment plans...
            </div>
          )}

          {!loading && plans.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              No payment plans found.
            </div>
          )}

          {!loading &&
            plans.map((plan) => {
              const outstanding = Math.max(plan.totalFee - plan.paidAmount, 0);
              const progress =
                plan.totalFee > 0
                  ? Math.round((plan.paidAmount / plan.totalFee) * 100)
                  : 0;

              return (
                <div
                  key={plan.id}
                  className="p-6 hover:bg-[#f8f8f6] transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg text-[#284342]">
                          {isStudentView ? plan.course : plan.student}
                        </h3>

                        <StatusBadge status={plan.status} />
                      </div>

                      {!isStudentView && (
                        <p className="text-sm text-[#6b6b6b] mb-3">
                          {plan.course}
                        </p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                        <Info label="Plan Type" value={plan.planType} />
                        <Info
                          label="Original Fee"
                          value={`RM ${plan.originalFee.toLocaleString()}`}
                        />
                        <Info
                          label="Discount"
                          value={`RM ${plan.discountAmount.toLocaleString()}`}
                        />
                        <Info
                          label="Final Fee"
                          value={`RM ${plan.totalFee.toLocaleString()}`}
                        />
                        <InfoGreen
                          label="Paid"
                          value={`RM ${plan.paidAmount.toLocaleString()}`}
                        />
                        <InfoRed
                          label="Outstanding"
                          value={`RM ${outstanding.toLocaleString()}`}
                        />
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-[#6b6b6b]">
                            Payment Progress
                          </span>
                          <span className="text-xs text-[#284342]">
                            {progress}%
                          </span>
                        </div>

                        <div className="w-full h-2 bg-[#e8e7e2] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#284342] rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-xs text-[#6b6b6b] mt-3">
                        Next payment: {plan.nextPayment} • RM{' '}
                        {plan.nextAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)] flex-wrap">
                    {canManagePaymentPlans && (
                      <button
                        onClick={() => navigate('/app/payments/installments')}
                        className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm"
                      >
                        Record Payment
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedPlan(plan)}
                      className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-2"
                    >
                      <Eye size={16} />
                      View Details
                    </button>

                    {canManagePaymentPlans && (
                      <button
                        onClick={() => openEditPlan(plan)}
                        className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-2"
                      >
                        <Edit size={16} />
                        Edit Plan
                      </button>
                    )}

                    {canManagePaymentPlans && (
                      <button
                        onClick={() => sendReminder(plan)}
                        className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-2"
                      >
                        <Send size={16} />
                        Send Reminder
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {selectedPlan && (
        <PlanDetailsModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
        />
      )}

      {showCreateModal && (
        <CreatePlanModal
          enrollments={enrollments}
          formData={formData}
          setFormData={setFormData}
          onClose={() => setShowCreateModal(false)}
          onCreate={createPaymentPlan}
        />
      )}

      {editingPlan && (
        <EditPlanModal
          plan={editingPlan}
          editData={editData}
          setEditData={setEditData}
          onClose={() => setEditingPlan(null)}
          onUpdate={updatePaymentPlan}
        />
      )}
    </div>
  );
}

function PlanDetailsModal({
  plan,
  onClose,
}: {
  plan: PaymentPlan;
  onClose: () => void;
}) {
  const outstanding = Math.max(plan.totalFee - plan.paidAmount, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-[rgba(40,67,66,0.1)] flex items-center justify-between">
          <h2 className="text-xl text-[#284342]">Payment Plan Details</h2>
          <button onClick={onClose}>
            <X size={20} className="text-[#284342]" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Info label="Student" value={plan.student} />
            <Info label="Course" value={plan.course} />
            <Info label="Plan Type" value={plan.planType} />
            <Info label="Status" value={plan.status} />
            <Info
              label="Original Fee"
              value={`RM ${plan.originalFee.toLocaleString()}`}
            />
            <Info
              label="Discount"
              value={`RM ${plan.discountAmount.toLocaleString()}`}
            />
            <Info
              label="Final Fee"
              value={`RM ${plan.totalFee.toLocaleString()}`}
            />
            <Info
              label="Outstanding"
              value={`RM ${outstanding.toLocaleString()}`}
            />
          </div>

          <div>
            <h3 className="text-lg text-[#284342] mb-4">
              Installment Breakdown
            </h3>

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
                    <p className="text-sm text-[#284342]">
                      Installment {index + 1}
                    </p>
                    <p className="text-xs text-[#6b6b6b] mt-1">
                      Due: {item.dueDate}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-[#284342]">
                      RM {item.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-[#6b6b6b] mt-1">
                      Paid: {item.paidDate}
                    </p>
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
      </div>
    </div>
  );
}

function CreatePlanModal({
  enrollments,
  formData,
  setFormData,
  onClose,
  onCreate,
}: {
  enrollments: EnrollmentOption[];
  formData: {
    enrollmentId: string;
    originalFee: string;
    discountAmount: string;
    finalAmount: string;
    planType: string;
    installments: string;
    firstDueDate: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      enrollmentId: string;
      originalFee: string;
      discountAmount: string;
      finalAmount: string;
      planType: string;
      installments: string;
      firstDueDate: string;
    }>
  >;
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6">
        <h2 className="text-xl text-[#284342] mb-6">Create Payment Plan</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#284342] mb-2">
              Student Enrollment
            </label>

            <select
              value={formData.enrollmentId}
              onChange={(e) => {
                const enrollment = enrollments.find(
                  (item) => item.id === e.target.value
                );

                const fee = getCourseFeeFromEnrollment(enrollment).toString();

                setFormData((prev) => ({
                  ...prev,
                  enrollmentId: e.target.value,
                  originalFee: fee,
                  discountAmount: '0',
                  finalAmount: fee,
                }));
              }}
              className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            >
              <option value="">Select Student</option>
              {enrollments.map((enrollment) => (
                <option key={enrollment.id} value={enrollment.id}>
                  {getStudentName(enrollment.students)} -{' '}
                  {getCourseNameFromEnrollment(enrollment)}
                </option>
              ))}
            </select>
          </div>

          <FeeFields
            originalFee={formData.originalFee}
            discountAmount={formData.discountAmount}
            finalAmount={formData.finalAmount}
            onOriginalFeeChange={(value) =>
              updateFee(value, formData.discountAmount)
            }
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
    </div>
  );
}

function EditPlanModal({
  plan,
  editData,
  setEditData,
  onClose,
  onUpdate,
}: {
  plan: PaymentPlan;
  editData: {
    originalFee: string;
    discountAmount: string;
    finalAmount: string;
    planType: string;
    installments: string;
    firstDueDate: string;
  };
  setEditData: React.Dispatch<
    React.SetStateAction<{
      originalFee: string;
      discountAmount: string;
      finalAmount: string;
      planType: string;
      installments: string;
      firstDueDate: string;
    }>
  >;
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6">
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
            onOriginalFeeChange={(value) =>
              updateFee(value, editData.discountAmount)
            }
            onDiscountChange={(value) =>
              updateFee(editData.originalFee, value)
            }
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
    </div>
  );
}

function FeeFields({
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
          onChange={(e) => onOriginalFeeChange(e.target.value)}
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
          onChange={(e) => onDiscountChange(e.target.value)}
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

function PaymentPlanFields({
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
        <label className="block text-sm text-[#284342] mb-2">
          Payment Type
        </label>

        <select
          value={planType}
          onChange={(e) => setPlanType(e.target.value)}
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
            onChange={(e) => setInstallments(e.target.value)}
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
        <label className="block text-sm text-[#284342] mb-2">
          First Due Date
        </label>

        <input
          type="date"
          value={firstDueDate}
          onChange={(e) => setFirstDueDate(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)]"
        />
      </div>
    </>
  );
}

function buildInstallmentRows({
  paymentPlanId,
  finalAmount,
  planType,
  installmentCount,
  firstDueDate,
}: {
  paymentPlanId: string;
  finalAmount: number;
  planType: string;
  installmentCount: number;
  firstDueDate: string;
}) {
  const count = planType === 'full_payment' ? 1 : Math.max(2, installmentCount);
  const amount = Math.round((finalAmount / count) * 100) / 100;
  const rows = [];

  for (let index = 0; index < count; index += 1) {
    const dueDate = new Date(firstDueDate);
    dueDate.setMonth(dueDate.getMonth() + index);

    rows.push({
      payment_plan_id: paymentPlanId,
      amount:
        index === count - 1
          ? Math.round((finalAmount - amount * (count - 1)) * 100) / 100
          : amount,
      due_date: dueDate.toISOString().slice(0, 10),
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return rows;
}

function StatusBadge({ status }: { status: PaymentPlan['status'] }) {
  const className =
    status === 'Completed'
      ? 'bg-green-100 text-green-700'
      : status === 'Overdue'
      ? 'bg-red-100 text-red-700'
      : 'bg-blue-100 text-blue-700';

  return (
    <span className={`text-xs px-3 py-1 rounded-full ${className}`}>
      {status}
    </span>
  );
}

function mapPlanType(type: string): PaymentPlan['planType'] {
  if (type === 'full_payment') return 'Full Payment';
  if (type === 'deposit_balance') return 'Deposit + Balance';
  return 'Installments';
}

function mapPaymentStatus(status: string, installments: any[]): PaymentPlan['status'] {
  if (String(status).toLowerCase() === 'paid') return 'Completed';

  const hasOverdue = (installments || []).some(
    (item: any) =>
      String(item.status).toLowerCase() !== 'paid' &&
      item.due_date &&
      new Date(item.due_date) < startOfToday()
  );

  if (hasOverdue) return 'Overdue';

  return 'Active';
}

function formatInstallmentStatus(status: string, dueDate: string) {
  if (String(status).toLowerCase() === 'paid') return 'Paid';

  if (dueDate && new Date(dueDate) < startOfToday()) {
    return 'Overdue';
  }

  return 'Pending';
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getStudentName(student: any) {
  if (!student) return 'Unnamed Student';
  if (Array.isArray(student)) return student[0]?.full_name || 'Unnamed Student';
  return student.full_name || 'Unnamed Student';
}

function getCourseNameFromEnrollment(enrollment: any) {
  if (!enrollment) return '-';

  const actualEnrollment = Array.isArray(enrollment) ? enrollment[0] : enrollment;
  const batch = actualEnrollment?.class_batches;
  const actualBatch = Array.isArray(batch) ? batch[0] : batch;
  const course = actualBatch?.courses;
  const actualCourse = Array.isArray(course) ? course[0] : course;

  return actualCourse?.course_name || '-';
}

function getCourseFeeFromEnrollment(enrollment: any) {
  if (!enrollment) return 0;

  const batch = enrollment.class_batches;
  const actualBatch = Array.isArray(batch) ? batch[0] : batch;
  const course = actualBatch?.courses;
  const actualCourse = Array.isArray(course) ? course[0] : course;

  return Number(actualCourse?.course_fee || 0);
}

function AmountCard({
  title,
  amount,
  color,
}: {
  title: string;
  amount: number;
  color: 'green' | 'yellow' | 'red';
}) {
  const colorClass =
    color === 'green'
      ? 'text-green-700'
      : color === 'yellow'
      ? 'text-yellow-700'
      : 'text-red-700';

  const bgClass =
    color === 'green'
      ? 'bg-green-50'
      : color === 'yellow'
      ? 'bg-yellow-50'
      : 'bg-red-50';

  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-lg ${bgClass}`}>
          <DollarSign size={24} className={colorClass} />
        </div>

        <div>
          <p className="text-sm text-[#6b6b6b]">{title}</p>
          <p className="text-2xl text-[#284342]">
            RM {amount.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
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

function InfoGreen({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6b6b6b] mb-1">{label}</p>
      <p className="text-green-700">{value}</p>
    </div>
  );
}

function InfoRed({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6b6b6b] mb-1">{label}</p>
      <p className="text-[#d4183d]">{value}</p>
    </div>
  );
}