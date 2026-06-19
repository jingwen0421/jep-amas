import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { DollarSign, Plus, Eye, Send, X, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
  student: string;
  course: string;
  totalFee: number;
  paidAmount: number;
  planType: 'Full Payment' | 'Installments' | 'Deposit + Balance';
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

  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentOption[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    enrollmentId: '',
    totalFee: '',
    planType: 'full_payment',
    installments: '1',
  });

  useEffect(() => {
    fetchPaymentPlans();
    fetchEnrollments();
  }, []);

  async function fetchPaymentPlans() {
    setLoading(true);

    const { data, error } = await supabase
      .from('payment_plans')
      .select(`
        id,
        enrollment_id,
        original_fee,
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

    if (error) {
      console.error('Error fetching payment plans:', error.message);
      setLoading(false);
      return;
    }

    const mapped: PaymentPlan[] = (data || []).map((plan: any) => {
      const installments = (plan.installments || []).sort((a: any, b: any) =>
        String(a.due_date).localeCompare(String(b.due_date))
      );

      const totalFee = Number(plan.final_amount || plan.original_fee || 0);

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
        student: getStudentName(plan.students),
        course: getCourseNameFromEnrollment(plan.enrollments),
        totalFee,
        paidAmount,
        planType: mapPlanType(plan.plan_type),
        installments: installments.length,
        nextPayment: next?.due_date || '-',
        nextAmount: Number(next?.amount || 0),
        status: mapPaymentStatus(plan.status),
        installmentDetails: installments.map((item: any, index: number) => ({
          id: item.id,
          amount: Number(item.amount || 0),
          dueDate: item.due_date || '-',
          paidDate: item.paid_date ? String(item.paid_date).slice(0, 10) : '-',
          status: formatInstallmentStatus(item.status, item.due_date),
          installmentNumber: index + 1,
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
      `);

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
      alert('This enrollment already has a payment plan.');
      return;
    }

    const totalFee = Number(formData.totalFee);

    if (!totalFee || totalFee <= 0) {
      alert('Please enter valid total fee.');
      return;
    }

    const { data: createdPlan, error } = await supabase
      .from('payment_plans')
      .insert({
        student_id: selectedEnrollment.student_id,
        enrollment_id: selectedEnrollment.id,
        original_fee: totalFee,
        discount_amount: 0,
        final_amount: totalFee,
        plan_type: formData.planType,
        status: formData.planType === 'full_payment' ? 'pending' : 'partial',
      })
      .select('id')
      .single();

    if (error) {
      alert(`Failed to create payment plan: ${error.message}`);
      return;
    }

    const installmentCount =
      formData.planType === 'full_payment' ? 1 : Number(formData.installments);

    const installmentAmount =
      Math.round((totalFee / installmentCount) * 100) / 100;

    const today = new Date();

    const installmentRows = Array.from({ length: installmentCount }).map(
      (_, index) => {
        const dueDate = new Date(today);
        dueDate.setMonth(today.getMonth() + index);

        return {
          payment_plan_id: createdPlan.id,
          amount: installmentAmount,
          due_date: dueDate.toISOString().slice(0, 10),
          status: 'pending',
        };
      }
    );

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
      user_id: null,
      action: 'Payment Plan Created',
      module: 'Payments',
      target_id: createdPlan.id,
      old_data: null,
      new_data: {
        student_id: selectedEnrollment.student_id,
        enrollment_id: selectedEnrollment.id,
        total_fee: totalFee,
        plan_type: formData.planType,
        installments: installmentCount,
      },
      created_at: new Date().toISOString(),
    });

    setFormData({
      enrollmentId: '',
      totalFee: '',
      planType: 'full_payment',
      installments: '1',
    });

    setShowModal(false);
    fetchPaymentPlans();
  }

  async function sendReminder(plan: PaymentPlan) {
    await supabase.from('audit_logs').insert({
      user_id: null,
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
      },
      created_at: new Date().toISOString(),
    });

    alert(`Reminder recorded for ${plan.student}.`);
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
          <h1 className="text-3xl text-[#284342]">Payment Plans</h1>
          <p className="text-[#6b6b6b] mt-1">
            Create plans and monitor payment progress
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Create Payment Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AmountCard title="Total Collected" amount={totalCollected} color="green" />
        <AmountCard title="Outstanding Amount" amount={totalOutstanding} color="yellow" />
        <AmountCard title="Overdue Payments" amount={overdueAmount} color="red" />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">Active Payment Plans</h2>
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
                          {plan.student}
                        </h3>

                        <StatusBadge status={plan.status} />
                      </div>

                      <p className="text-sm text-[#6b6b6b] mb-3">
                        {plan.course}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <Info label="Plan Type" value={plan.planType} />
                        <Info
                          label="Total Fee"
                          value={`RM ${plan.totalFee.toLocaleString()}`}
                        />
                        <InfoGreen
                          label="Paid Amount"
                          value={`RM ${plan.paidAmount.toLocaleString()}`}
                        />
                        <InfoRed
                          label="Outstanding"
                          value={`RM ${outstanding.toLocaleString()}`}
                        />
                        <Info label="Next Payment" value={plan.nextPayment} />
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
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)]">
                    <button
                      onClick={() => navigate('/app/payments/installments')}
                      className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm"
                    >
                      Record Payment
                    </button>

                    <button
                      onClick={() => setSelectedPlan(plan)}
                      className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-2"
                    >
                      <Eye size={16} />
                      View Details
                    </button>

                    <button
                      onClick={() => sendReminder(plan)}
                      className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-2"
                    >
                      <Send size={16} />
                      Send Reminder
                    </button>
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

      {showModal && (
        <CreatePlanModal
          enrollments={enrollments}
          formData={formData}
          setFormData={setFormData}
          onClose={() => setShowModal(false)}
          onCreate={createPaymentPlan}
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
            <Info label="Total Fee" value={`RM ${plan.totalFee.toLocaleString()}`} />
            <Info label="Outstanding" value={`RM ${outstanding.toLocaleString()}`} />
          </div>

          <div>
            <h3 className="text-lg text-[#284342] mb-4">Installment Breakdown</h3>

            <div className="space-y-3">
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
    totalFee: string;
    planType: string;
    installments: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      enrollmentId: string;
      totalFee: string;
      planType: string;
      installments: string;
    }>
  >;
  onClose: () => void;
  onCreate: () => void;
}) {
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

                setFormData((prev) => ({
                  ...prev,
                  enrollmentId: e.target.value,
                  totalFee: getCourseFeeFromEnrollment(enrollment).toString(),
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

          <div>
            <label className="block text-sm text-[#284342] mb-2">
              Total Fee (RM)
            </label>

            <input
              type="number"
              value={formData.totalFee}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  totalFee: e.target.value,
                }))
              }
              placeholder="8000"
              className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            />
          </div>

          <div>
            <label className="block text-sm text-[#284342] mb-2">
              Payment Type
            </label>

            <select
              value={formData.planType}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  planType: e.target.value,
                  installments:
                    e.target.value === 'full_payment'
                      ? '1'
                      : prev.installments,
                }))
              }
              className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
            >
              <option value="full_payment">Full Payment</option>
              <option value="deposit_balance">Deposit + Balance</option>
              <option value="installment">Installments</option>
            </select>
          </div>

          {formData.planType !== 'full_payment' && (
            <div>
              <label className="block text-sm text-[#284342] mb-2">
                Number of Installments
              </label>

              <select
                value={formData.installments}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    installments: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
              >
                <option value="2">2 Installments</option>
                <option value="3">3 Installments</option>
                <option value="4">4 Installments</option>
              </select>
            </div>
          )}
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

function mapPaymentStatus(status: string): PaymentPlan['status'] {
  if (String(status).toLowerCase() === 'paid') return 'Completed';
  if (String(status).toLowerCase() === 'overdue') return 'Overdue';
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