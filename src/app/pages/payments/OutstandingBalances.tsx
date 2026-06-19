import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertTriangle,
  DollarSign,
  Send,
  User,
  CreditCard,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OutstandingBalance {
  id: string;
  studentId: string;
  student: string;
  phone: string;
  course: string;
  totalFee: number;
  paidAmount: number;
  outstandingAmount: number;
  lastPaymentDate: string;
  nextDueDate: string;
  daysOverdue: number;
  status: 'Pending' | 'Overdue' | 'Critical';
}

export default function OutstandingBalances() {
  const navigate = useNavigate();

  const [balances, setBalances] = useState<OutstandingBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOutstandingBalances();
  }, []);

  async function fetchOutstandingBalances() {
    setLoading(true);

    const { data, error } = await supabase
      .from('payment_plans')
      .select(`
        id,
        student_id,
        final_amount,
        original_fee,
        students!payment_plans_student_id_fkey(full_name, phone),
        enrollments!payment_plans_enrollment_id_fkey(
          class_batches(
            courses(course_name)
          )
        ),
        installments(
          amount,
          due_date,
          paid_date,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching outstanding balances:', error.message);
      setLoading(false);
      return;
    }

    const mapped: OutstandingBalance[] = (data || [])
      .map((plan: any) => {
        const installments = plan.installments || [];
        const totalFee = Number(plan.final_amount || plan.original_fee || 0);

        const paidAmount = installments
          .filter((item: any) => String(item.status).toLowerCase() === 'paid')
          .reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

        const outstandingAmount = Math.max(totalFee - paidAmount, 0);

        const paidInstallments = installments
          .filter((item: any) => item.paid_date)
          .sort((a: any, b: any) =>
            String(b.paid_date).localeCompare(String(a.paid_date))
          );

        const lastPaymentDate = paidInstallments[0]?.paid_date
          ? String(paidInstallments[0].paid_date).slice(0, 10)
          : '-';

        const unpaidInstallments = installments
          .filter((item: any) => String(item.status).toLowerCase() !== 'paid')
          .sort((a: any, b: any) =>
            String(a.due_date).localeCompare(String(b.due_date))
          );

        const nextDueDate = unpaidInstallments[0]?.due_date || '-';

        const overdueDays = unpaidInstallments.map((item: any) =>
          calculateDaysOverdue(item.due_date)
        );

        const daysOverdue = Math.max(0, ...overdueDays);

        let status: OutstandingBalance['status'] = 'Pending';

        if (daysOverdue > 30) status = 'Critical';
        else if (daysOverdue > 0) status = 'Overdue';

        return {
          id: plan.id,
          studentId: plan.student_id,
          student: getStudentName(plan.students),
          phone: getStudentPhone(plan.students),
          course: getCourseNameFromEnrollment(plan.enrollments),
          totalFee,
          paidAmount,
          outstandingAmount,
          lastPaymentDate,
          nextDueDate,
          daysOverdue,
          status,
        };
      })
      .filter((item: OutstandingBalance) => item.outstandingAmount > 0);

    setBalances(mapped);
    setLoading(false);
  }

  async function sendReminder(balance: OutstandingBalance) {
    await supabase.from('audit_logs').insert({
      user_id: null,
      action: 'Payment Reminder Sent',
      module: 'Payments',
      target_id: balance.id,
      old_data: null,
      new_data: {
        student: balance.student,
        phone: balance.phone,
        outstanding_amount: balance.outstandingAmount,
        next_due_date: balance.nextDueDate,
        days_overdue: balance.daysOverdue,
      },
      created_at: new Date().toISOString(),
    });

    alert(
      `Reminder recorded for ${balance.student}.\nOutstanding: RM ${balance.outstandingAmount.toLocaleString()}`
    );
  }

  const totalOutstanding = balances.reduce(
    (acc, balance) => acc + balance.outstandingAmount,
    0
  );

  const totalPaid = balances.reduce(
    (acc, balance) => acc + balance.paidAmount,
    0
  );

  const collectionRate =
    totalPaid + totalOutstanding > 0
      ? Math.round((totalPaid / (totalPaid + totalOutstanding)) * 100)
      : 0;

  const criticalCount = balances.filter(
    (balance) => balance.status === 'Critical'
  ).length;

  const overdueCount = balances.filter(
    (balance) => balance.status === 'Overdue'
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">Outstanding Balances</h1>
        <p className="text-[#6b6b6b] mt-1">
          Follow up unpaid balances and overdue student payments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={24} className="text-red-700" />
            <div>
              <p className="text-sm text-[#6b6b6b]">Total Outstanding</p>
              <p className="text-2xl text-red-700">
                RM {totalOutstanding.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <SummaryCard
          label="Students Owing"
          value={balances.length.toString()}
          color="text-[#284342]"
        />
        <SummaryCard
          label="Critical"
          value={criticalCount.toString()}
          color="text-red-700"
        />
        <SummaryCard
          label="Collection Rate"
          value={`${collectionRate}%`}
          color="text-green-700"
        />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)] flex items-center justify-between">
          <h2 className="text-lg text-[#284342]">
            Collection Follow-Up List
          </h2>

          <p className="text-sm text-[#6b6b6b]">
            {overdueCount} overdue account(s)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Student</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Course</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Payment Progress</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Outstanding</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Next Due</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Overdue</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Status</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-[#6b6b6b]">
                    Loading outstanding balances...
                  </td>
                </tr>
              )}

              {!loading && balances.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-[#6b6b6b]">
                    No outstanding balances found.
                  </td>
                </tr>
              )}

              {!loading &&
                balances.map((balance) => {
                  const progress =
                    balance.totalFee > 0
                      ? Math.round((balance.paidAmount / balance.totalFee) * 100)
                      : 0;

                  return (
                    <tr
                      key={balance.id}
                      className={`hover:bg-[#f8f8f6] transition-colors ${
                        balance.status === 'Critical' ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#284342]">{balance.student}</p>
                        <p className="text-xs text-[#6b6b6b] mt-1">
                          {balance.phone || 'No phone'}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                        {balance.course}
                      </td>

                      <td className="px-6 py-4">
                        <div className="min-w-40">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[#6b6b6b]">
                              RM {balance.paidAmount.toLocaleString()} / RM{' '}
                              {balance.totalFee.toLocaleString()}
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
                      </td>

                      <td className="px-6 py-4 text-sm text-red-700">
                        RM {balance.outstandingAmount.toLocaleString()}
                      </td>

                      <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                        {balance.nextDueDate}
                      </td>

                      <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                        {balance.daysOverdue > 0
                          ? `${balance.daysOverdue} day(s)`
                          : '-'}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={balance.status} />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              navigate(`/app/students/profile/${balance.studentId}`)
                            }
                            className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                            title="View Student"
                          >
                            <User size={16} className="text-[#284342]" />
                          </button>

                          <button
                            onClick={() => navigate('/app/payments/installments')}
                            className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                            title="Record Payment"
                          >
                            <CreditCard size={16} className="text-[#284342]" />
                          </button>

                          <button
                            onClick={() => sendReminder(balance)}
                            className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                            title="Send Reminder"
                          >
                            <Send size={16} className="text-[#284342]" />
                          </button>

                          {balance.status === 'Critical' && (
                            <AlertTriangle size={16} className="text-red-700" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function calculateDaysOverdue(dueDate: string) {
  if (!dueDate) return 0;

  const today = new Date();
  const due = new Date(dueDate);
  const diff = today.getTime() - due.getTime();

  if (diff <= 0) return 0;

  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getStudentName(student: any) {
  if (!student) return 'Unnamed Student';
  if (Array.isArray(student)) return student[0]?.full_name || 'Unnamed Student';
  return student.full_name || 'Unnamed Student';
}

function getStudentPhone(student: any) {
  if (!student) return '';
  if (Array.isArray(student)) return student[0]?.phone || '';
  return student.phone || '';
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
      <p className={`text-3xl ${color}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: OutstandingBalance['status'] }) {
  const className =
    status === 'Critical'
      ? 'bg-red-100 text-red-700'
      : status === 'Overdue'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-blue-100 text-blue-700';

  return (
    <span className={`text-xs px-3 py-1 rounded-full ${className}`}>
      {status}
    </span>
  );
}