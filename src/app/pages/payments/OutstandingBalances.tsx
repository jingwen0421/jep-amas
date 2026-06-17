import { useEffect, useState } from 'react';
import { AlertTriangle, DollarSign, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OutstandingBalance {
  id: string;
  student: string;
  course: string;
  totalFee: number;
  paidAmount: number;
  outstandingAmount: number;
  lastPaymentDate: string;
  daysOverdue: number;
  status: 'Pending' | 'Overdue' | 'Critical';
}

export default function OutstandingBalances() {
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
        final_amount,
        original_fee,
        students!payment_plans_student_id_fkey(full_name),
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
          .filter((item: any) => item.status === 'paid')
          .reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

        const outstandingAmount = Math.max(totalFee - paidAmount, 0);

        const paidInstallments = installments
          .filter((item: any) => item.paid_date)
          .sort((a: any, b: any) =>
            String(b.paid_date).localeCompare(String(a.paid_date))
          );

        const lastPaymentDate = paidInstallments[0]?.paid_date || '-';

        const unpaidInstallments = installments.filter(
          (item: any) => item.status !== 'paid'
        );

        const overdueDays = unpaidInstallments.map((item: any) =>
          calculateDaysOverdue(item.due_date)
        );

        const daysOverdue = Math.max(0, ...overdueDays);

        let status: OutstandingBalance['status'] = 'Pending';

        if (daysOverdue > 30) status = 'Critical';
        else if (daysOverdue > 0) status = 'Overdue';

        return {
          id: plan.id,
          student: getStudentName(plan.students),
          course: getCourseNameFromEnrollment(plan.enrollments),
          totalFee,
          paidAmount,
          outstandingAmount,
          lastPaymentDate,
          daysOverdue,
          status,
        };
      })
      .filter((item: OutstandingBalance) => item.outstandingAmount > 0);

    setBalances(mapped);
    setLoading(false);
  }

  const totalOutstanding = balances.reduce(
    (acc, balance) => acc + balance.outstandingAmount,
    0
  );

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
          Track and manage unpaid student balances
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

        <SummaryCard label="Students" value={balances.length} color="text-[#284342]" />
        <SummaryCard label="Critical" value={criticalCount} color="text-red-700" />
        <SummaryCard label="Overdue" value={overdueCount} color="text-yellow-700" />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">
            Outstanding Student Balances
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Student</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Course</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Total Fee</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Paid</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Outstanding</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Last Payment</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Days Overdue</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Status</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {loading && (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-[#6b6b6b]">
                    Loading outstanding balances...
                  </td>
                </tr>
              )}

              {!loading && balances.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-[#6b6b6b]">
                    No outstanding balances found.
                  </td>
                </tr>
              )}

              {!loading &&
                balances.map((balance) => (
                  <tr
                    key={balance.id}
                    className={`hover:bg-[#f8f8f6] transition-colors ${
                      balance.status === 'Critical' ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 text-sm text-[#284342]">
                      {balance.student}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {balance.course}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      RM {balance.totalFee.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-green-700">
                      RM {balance.paidAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-700">
                      RM {balance.outstandingAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {balance.lastPaymentDate}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {balance.daysOverdue > 0 ? balance.daysOverdue : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${
                          balance.status === 'Critical'
                            ? 'bg-red-100 text-red-700'
                            : balance.status === 'Overdue'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {balance.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
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
                ))}
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
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <p className="text-sm text-[#6b6b6b] mb-2">{label}</p>
      <p className={`text-3xl ${color}`}>{value}</p>
    </div>
  );
}