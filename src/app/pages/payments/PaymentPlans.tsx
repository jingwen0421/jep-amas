import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { DollarSign, Plus, Eye, Send, Edit, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../utils/session';
import { getCurrentStudentId } from '../../utils/studentAccess';
import { sendPaymentReminder } from '../../services/unifiedNotificationService';
import {
  type PaymentPlan,
  type EnrollmentOption,
  fetchPaymentPlansWithDetails,
  fetchEnrollmentOptions,
  buildInstallmentRows,
  formatCurrency,
} from '../../services/paymentsService';
import { SummaryCard } from '../../components/payments/SummaryCard';
import { PlanStatusBadge } from '../../components/payments/StatusBadges';
import { PlanDetailsModal } from './components/PlanDetailsModal';
import { CreatePlanModal, type CreateFormData } from './components/CreatePlanModal';
import { EditPlanModal, type EditFormData } from './components/EditPlanModal';
import { useLanguage } from '../../context/LanguageContext';
import { useConfirm } from '../../context/ConfirmDialogContext';

export default function PaymentPlans() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const { t } = useLanguage();
  const confirmDialog = useConfirm();

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

  const [formData, setFormData] = useState<CreateFormData>({
    enrollmentId: '',
    studentId: '',
    originalFee: '',
    discountAmount: '0',
    finalAmount: '',
    planType: 'full_payment',
    installments: '1',
    firstDueDate: new Date().toISOString().slice(0, 10),
  });

  const [editData, setEditData] = useState<EditFormData>({
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
      loadEnrollmentOptions();
    }
  }, []);

  async function fetchPaymentPlans() {
    setLoading(true);

    let studentIdFilter: string | undefined;

    if (isStudentView) {
      const studentId = await getCurrentStudentId();

      if (!studentId) {
        setPlans([]);
        setLoading(false);
        return;
      }

      studentIdFilter = studentId;
    }

    const { data } = await fetchPaymentPlansWithDetails(studentIdFilter);
    setPlans(data);
    setLoading(false);
  }

  async function loadEnrollmentOptions() {
    const { data } = await fetchEnrollmentOptions();
    setEnrollments(data);
  }

  async function createPaymentPlan() {
    const selectedStudent = enrollments.find(
      (item) => item.studentId === formData.studentId
    );

    if (!selectedStudent) {
      alert(t('payments.plans.selectStudent'));
      return;
    }

    if (!selectedStudent.hasEnrollment || !selectedStudent.id) {
      alert(t('payments.plans.noEnrollment'));
      return;
    }

    const { data: existingPlan } = await supabase
      .from('payment_plans')
      .select('id')
      .eq('enrollment_id', selectedStudent.id)
      .maybeSingle();

    if (existingPlan) {
      alert(t('payments.plans.alreadyHasPlan'));
      return;
    }

    const originalFee = Number(formData.originalFee);
    const discountAmount = Number(formData.discountAmount || 0);
    const finalAmount = originalFee - discountAmount;

    if (!originalFee || originalFee <= 0) {
      alert(t('payments.plans.invalidOriginalFee'));
      return;
    }

    if (discountAmount < 0 || discountAmount >= originalFee) {
      alert(t('payments.plans.discountTooHigh'));
      return;
    }

    const { data: createdPlan, error } = await supabase
      .from('payment_plans')
      .insert({
        student_id: selectedStudent.studentId,
        enrollment_id: selectedStudent.id,
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
      alert(t('payments.plans.errorCreateFailed', { message: error.message }));
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
      alert(t('payments.plans.errorCreateInstallmentsFailed', { message: installmentError.message }));
      return;
    }

    await supabase.from('audit_logs').insert({
      user_id: currentUser.id || null,
      action: 'Payment Plan Created',
      module: 'Payments',
      target_id: createdPlan.id,
      old_data: null,
      new_data: {
        student_id: selectedStudent.studentId,
        enrollment_id: selectedStudent.id,
        student_name: selectedStudent.studentName,
        course: selectedStudent.courseName,
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
    loadEnrollmentOptions();
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
      const confirmed = await confirmDialog(t('payments.plans.confirmRegenerateUnpaid'), {
        variant: 'danger',
      });

      if (!confirmed) return;
    }

    const originalFee = Number(editData.originalFee);
    const discountAmount = Number(editData.discountAmount || 0);
    const finalAmount = originalFee - discountAmount;

    if (!originalFee || originalFee <= 0) {
      alert(t('payments.plans.invalidOriginalFee'));
      return;
    }

    if (discountAmount < 0 || discountAmount >= originalFee) {
      alert(t('payments.plans.discountTooHigh'));
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
      alert(t('payments.plans.errorUpdateFailed', { message: planError.message }));
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
        alert(t('payments.plans.errorRemoveInstallmentsFailed', { message: deleteError.message }));
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
        alert(t('payments.plans.errorRegenerateInstallmentsFailed', { message: installmentError.message }));
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
    alert(t('payments.plans.updateSuccess'));
  }

  async function sendReminder(plan: PaymentPlan) {
    const result = await sendPaymentReminder({
      studentName: plan.student,
      target: {
        userId: plan.studentUserId,
        email: plan.studentEmail,
        phone: plan.studentPhone,
        name: plan.student,
      },
      outstandingAmount: Math.max(plan.totalFee - plan.paidAmount, 0),
      nextDueDate: plan.nextPayment,
      relatedId: plan.id,
    });

    if (result.whatsapp?.waLink) {
      window.open(result.whatsapp.waLink, '_blank');
    }

    alert(t('payments.outstanding.reminderSent', { name: plan.student }));
  }

  function resetCreateForm() {
    setFormData({
      enrollmentId: '',
      studentId: '',
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
    .reduce((sum, item) => sum + Math.max(item.totalFee - item.paidAmount, 0), 0);

  function planTypeLabel(rawPlanType: string) {
    if (rawPlanType === 'full_payment') return t('payments.plans.typeFullPayment');
    if (rawPlanType === 'deposit_balance') return t('payments.plans.typeDepositBalance');
    return t('payments.plans.typeInstallments');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-[#284342]">
            {isStudentView ? t('payments.plans.titleStudent') : t('payments.plans.title')}
          </h1>

          <p className="text-[#6b6b6b] mt-1">
            {isStudentView
              ? t('payments.plans.subtitleStudent')
              : t('payments.plans.subtitle')}
          </p>
        </div>

        {canManagePaymentPlans && (
          <button
            onClick={() => {
              loadEnrollmentOptions();
              setShowCreateModal(true);
            }}
            className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            {t('payments.plans.createButton')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          icon={<DollarSign size={24} className="text-green-700" />}
          iconBoxClass="bg-green-50"
          label={isStudentView ? t('payments.receipts.myPaidAmount') : t('payments.plans.totalCollected')}
          value={formatCurrency(totalCollected)}
        />

        <SummaryCard
          icon={<DollarSign size={24} className="text-yellow-700" />}
          iconBoxClass="bg-yellow-50"
          label={isStudentView ? t('payments.outstanding.myOutstanding') : t('payments.plans.outstandingAmount')}
          value={formatCurrency(totalOutstanding)}
        />

        <SummaryCard
          icon={<DollarSign size={24} className="text-red-700" />}
          iconBoxClass="bg-red-50"
          label={isStudentView ? t('payments.plans.overdueAmount') : t('payments.plans.overduePayments')}
          value={formatCurrency(overdueAmount)}
        />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)] flex items-center justify-between">
          <h2 className="text-lg text-[#284342]">
            {isStudentView ? t('payments.plans.myActivePlan') : t('payments.plans.activePlans')}
          </h2>

          {canManagePaymentPlans && (
            <button
              onClick={fetchPaymentPlans}
              className="text-sm text-[#284342] flex items-center gap-2 hover:underline"
            >
              <RefreshCw size={15} />
              {t('payments.plans.refresh')}
            </button>
          )}
        </div>

        <div className="divide-y divide-[rgba(40,67,66,0.1)]">
          {loading && (
            <div className="p-6 text-center text-[#6b6b6b]">{t('payments.plans.loading')}</div>
          )}

          {!loading && plans.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">{t('payments.plans.empty')}</div>
          )}

          {!loading &&
            plans.map((plan) => {
              const outstanding = Math.max(plan.totalFee - plan.paidAmount, 0);
              const progress =
                plan.totalFee > 0 ? Math.round((plan.paidAmount / plan.totalFee) * 100) : 0;

              return (
                <div key={plan.id} className="p-6 hover:bg-[#f8f8f6] transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg text-[#284342]">
                          {isStudentView ? plan.course : plan.student}
                        </h3>

                        <PlanStatusBadge status={plan.status} />
                      </div>

                      {!isStudentView && (
                        <p className="text-sm text-[#6b6b6b] mb-3">{plan.course}</p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                        <Info label={t('payments.plans.planType')} value={planTypeLabel(plan.rawPlanType)} />
                        <Info label={t('payments.plans.originalFee')} value={formatCurrency(plan.originalFee)} />
                        <Info label={t('payments.plans.discount')} value={formatCurrency(plan.discountAmount)} />
                        <Info label={t('payments.plans.finalFee')} value={formatCurrency(plan.totalFee)} />
                        <InfoGreen label={t('dashboard.paid')} value={formatCurrency(plan.paidAmount)} />
                        <InfoRed label={t('payments.outstanding.colOutstanding')} value={formatCurrency(outstanding)} />
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-[#6b6b6b]">{t('payments.outstanding.paymentProgress')}</span>

                          <span className="text-xs text-[#284342]">{progress}%</span>
                        </div>

                        <div className="w-full h-2 bg-[#e8e7e2] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#284342] rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-xs text-[#6b6b6b] mt-3">
                        {t('payments.plans.nextPayment', { date: plan.nextPayment, amount: formatCurrency(plan.nextAmount) })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)] flex-wrap">
                    {canManagePaymentPlans && (
                      <button
                        onClick={() => navigate('/app/payments/installments')}
                        className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm"
                      >
                        {t('payments.installments.recordPayment')}
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedPlan(plan)}
                      className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-2"
                    >
                      <Eye size={16} />
                      {t('payments.plans.viewDetails')}
                    </button>

                    {canManagePaymentPlans && (
                      <button
                        onClick={() => openEditPlan(plan)}
                        className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-2"
                      >
                        <Edit size={16} />
                        {t('payments.plans.editPlan')}
                      </button>
                    )}

                    {canManagePaymentPlans && (
                      <button
                        onClick={() => sendReminder(plan)}
                        className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-2"
                      >
                        <Send size={16} />
                        {t('payments.plans.sendReminder')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {selectedPlan && (
        <PlanDetailsModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
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
