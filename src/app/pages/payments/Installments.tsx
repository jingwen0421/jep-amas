import { useEffect, useState } from 'react';
import { DollarSign, Calendar, CheckCircle2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../utils/session';
import { getCurrentStudentId } from '../../utils/studentAccess';


interface InstallmentSchedule {
  id: string;
  paymentPlanId: string;
  studentId: string;
  student: string;
  course: string;
  totalFee: number;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export default function Installments() {
  const [installments, setInstallments] = useState<InstallmentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstallment, setSelectedInstallment] =
    useState<InstallmentSchedule | null>(null);

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [recording, setRecording] = useState(false);

  const currentUser = getCurrentUser();
const isStudentView = currentUser.role === 'student';

const canRecordPayment =
  currentUser.role === 'super_admin' ||
  currentUser.role === 'admin' ||
  currentUser.role === 'finance';

  useEffect(() => {
    fetchInstallments();
  }, []);

  async function fetchInstallments() {
  setLoading(true);

  let query = supabase
    .from('installments')
    .select(`
      id,
      payment_plan_id,
      amount,
      due_date,
      paid_date,
      status,
      payment_plans!inner(
        id,
        student_id,
        final_amount,
        status,
        students(full_name),
        enrollments(
          class_batches(
            courses(course_name)
          )
        ),
        installments(id, due_date)
      )
    `)
    .order('due_date', { ascending: true });

  if (isStudentView) {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
      setInstallments([]);
      setLoading(false);
      return;
    }

    query = query.eq('payment_plans.student_id', studentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching installments:', error.message);
    setLoading(false);
    return;
  }

  const mapped: InstallmentSchedule[] = (data || []).map((item: any) => {
    const plan = getSingle(item.payment_plans);
    const allInstallments = plan?.installments || [];

    const sortedInstallments = [...allInstallments].sort((a: any, b: any) =>
      String(a.due_date).localeCompare(String(b.due_date))
    );

    const installmentIndex = sortedInstallments.findIndex(
      (inst: any) => inst.id === item.id
    );

    return {
      id: item.id,
      paymentPlanId: item.payment_plan_id,
      studentId: plan?.student_id || '',
      student: getStudentName(plan?.students),
      course: getCourseNameFromPlan(plan),
      totalFee: Number(plan?.final_amount || 0),
      installmentNumber: installmentIndex >= 0 ? installmentIndex + 1 : 1,
      totalInstallments: sortedInstallments.length || 1,
      amount: Number(item.amount || 0),
      dueDate: item.due_date || '-',
      paidDate: item.paid_date ? item.paid_date.slice(0, 10) : undefined,
      status: mapInstallmentStatus(item.status, item.due_date),
    };
  });

  setInstallments(mapped);
  setLoading(false);
}

  async function recordPayment() {
    if (!selectedInstallment) return;

    setRecording(true);

    const paidAt = new Date().toISOString();

    const { error: installmentError } = await supabase
      .from('installments')
      .update({
        status: 'paid',
        paid_date: paidAt,
        updated_at: paidAt,
      })
      .eq('id', selectedInstallment.id);

    if (installmentError) {
      setRecording(false);
      alert(`Failed to update installment: ${installmentError.message}`);
      return;
    }

    const { data: payment, error: paymentError } = await supabase
      // insert payment
        .from('payments')
        .insert({
          installment_id: selectedInstallment.id,
          student_id: selectedInstallment.studentId,
          amount_paid: selectedInstallment.amount,
          payment_method: paymentMethod,
          payment_reference: referenceNo || null,
          proof_url: null,
          paid_at: paidAt,
          recorded_by: null,
        })
      .select('id')
      .single();

    if (paymentError) {
      setRecording(false);
      alert(`Installment marked paid, but payment record failed: ${paymentError.message}`);
      return;
    }

    const receiptNumber = `JEP-RCP-${new Date().getFullYear()}-${Date.now()
      .toString()
      .slice(-6)}`;

    const { error: receiptError } = await supabase
    // receipt insert
    .from('receipts')
    .insert({
      payment_id: payment.id,
      receipt_number: receiptNumber,
      receipt_url: null,
      issued_at: paidAt,
    });

    if (receiptError) {
      console.warn('Receipt creation failed:', receiptError.message);
    }

    await updatePaymentPlanStatus(selectedInstallment.paymentPlanId);

    await supabase.from('audit_logs').insert({
      user_id: null,
      action: 'Payment Recorded',
      module: 'Payments',
      target_id: selectedInstallment.id,
      old_data: { status: selectedInstallment.status },
      new_data: {
        student: selectedInstallment.student,
        amount: selectedInstallment.amount,
        payment_method: paymentMethod,
        reference_no: referenceNo || null,
        receipt_number: receiptNumber,
      },
      created_at: paidAt,
    });

    setRecording(false);
    setSelectedInstallment(null);
    setPaymentMethod('cash');
    setReferenceNo('');
    fetchInstallments();
  }

  async function updatePaymentPlanStatus(paymentPlanId: string) {
    const { data } = await supabase
      .from('installments')
      .select('status, due_date')
      .eq('payment_plan_id', paymentPlanId);

    const rows = data || [];
    const allPaid = rows.length > 0 && rows.every((item: any) => item.status === 'paid');

    const hasOverdue = rows.some((item: any) => {
      if (item.status === 'paid') return false;
      if (!item.due_date) return false;
      return new Date(item.due_date) < startOfToday();
    });

    const newStatus = allPaid ? 'paid' : hasOverdue ? 'overdue' : 'partial';

    await supabase
      .from('payment_plans')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentPlanId);
  }

  const totalDue = installments
    .filter((i) => i.status !== 'Paid')
    .reduce((acc, i) => acc + i.amount, 0);

  const pendingCount = installments.filter((i) => i.status === 'Pending').length;
  const overdueCount = installments.filter((i) => i.status === 'Overdue').length;
  const paidCount = installments.filter((i) => i.status === 'Paid').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">
          {isStudentView ? 'My Installments' : 'Installments'}
        </h1>

        <p className="text-[#6b6b6b] mt-1">
          {isStudentView
            ? 'View your installment schedule and payment due dates.'
            : 'Track and manage payment installment schedules'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard label="Total Due" value={`RM ${totalDue.toLocaleString()}`} color="text-[#284342]" />
        <SummaryCard label="Pending" value={pendingCount.toString()} color="text-yellow-700" />
        <SummaryCard label="Overdue" value={overdueCount.toString()} color="text-red-700" />
        <SummaryCard label="Paid" value={paidCount.toString()} color="text-green-700" />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">Installment Schedule</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                {!isStudentView && (
                  <th className="px-6 py-4 text-left text-sm text-[#284342]">
                    Student
                  </th>
                )}
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Course</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Installment</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Amount</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Due Date</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Paid Date</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Status</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {loading && (
                <tr>
                  <td colSpan={isStudentView ? 7 : 8} className="px-6 py-8 text-center text-[#6b6b6b]">
                    Loading installments...
                  </td>
                </tr>
              )}

              {!loading && installments.length === 0 && (
                <tr>
                  <td colSpan={isStudentView ? 7 : 8} className="px-6 py-8 text-center text-[#6b6b6b]">
                    No installments found.
                  </td>
                </tr>
              )}

              {!loading &&
                installments.map((inst) => (
                  <tr key={inst.id} className="hover:bg-[#f8f8f6] transition-colors">
                    {!isStudentView && (
                      <td className="px-6 py-4 text-sm text-[#284342]">
                        {inst.student}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">{inst.course}</td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {inst.installmentNumber}/{inst.totalInstallments}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#284342]">
                      RM {inst.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {inst.dueDate}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {inst.paidDate ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-green-700" />
                          {inst.paidDate}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={inst.status} />
                    </td>
                 <td className="px-6 py-4">
                      {canRecordPayment && inst.status !== 'Paid' ? (
                        <button
                          onClick={() => setSelectedInstallment(inst)}
                          className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm"
                        >
                          Record Payment
                        </button>
                      ) : inst.status === 'Paid' ? (
                        <span className="text-sm text-green-700">Completed</span>
                      ) : (
                        <span className="text-sm text-[#6b6b6b]">Pending Payment</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInstallment && canRecordPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              
   <h2 className="text-xl text-[#284342]">Record Payment</h2>

             
              <button onClick={() => setSelectedInstallment(null)}>
                <X size={20} className="text-[#284342]" />
              </button>
            </div>

            <div className="space-y-4">
              <Info label="Student" value={selectedInstallment.student} />
              <Info label="Course" value={selectedInstallment.course} />
              <Info
                label="Amount"
                value={`RM ${selectedInstallment.amount.toLocaleString()}`}
              />
              <Info label="Due Date" value={selectedInstallment.dueDate} />

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                  <option value="ewallet">E-Wallet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#284342] mb-2">
                  Reference No. / Transaction ID
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setSelectedInstallment(null)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={recordPayment}
                disabled={recording}
                className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors disabled:opacity-60"
              >
                {recording ? 'Recording...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <p className="text-sm text-[#6b6b6b] mb-2">{label}</p>
      <p className={`text-2xl ${color}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: InstallmentSchedule['status'] }) {
  const className =
    status === 'Paid'
      ? 'bg-green-100 text-green-700'
      : status === 'Overdue'
      ? 'bg-red-100 text-red-700'
      : 'bg-yellow-100 text-yellow-700';

  return (
    <span className={`text-xs px-3 py-1 rounded-full ${className}`}>
      {status}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6b6b6b] mb-1">{label}</p>
      <p className="text-sm text-[#284342]">{value}</p>
    </div>
  );
}

function mapInstallmentStatus(status: string, dueDate: string): InstallmentSchedule['status'] {
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

function getSingle(value: any) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

function getStudentName(student: any) {
  if (!student) return 'Unnamed Student';
  if (Array.isArray(student)) return student[0]?.full_name || 'Unnamed Student';
  return student.full_name || 'Unnamed Student';
}

function getCourseNameFromPlan(plan: any) {
  const enrollment = getSingle(plan?.enrollments);
  const batch = getSingle(enrollment?.class_batches);
  const course = getSingle(batch?.courses);
  return course?.course_name || '-';
}