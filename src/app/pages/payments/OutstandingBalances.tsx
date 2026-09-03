import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertTriangle, DollarSign, Send, User, CreditCard } from 'lucide-react';
import { sendPaymentReminder } from '../../services/unifiedNotificationService';
import { getCurrentUser } from '../../utils/session';
import { getCurrentStudentId } from '../../utils/studentAccess';
import {
  type OutstandingBalance,
  fetchOutstandingBalances,
  formatCurrency,
} from '../../services/paymentsService';
import { SummaryCard } from '../../components/payments/SummaryCard';
import { BalanceStatusBadge } from '../../components/payments/StatusBadges';

export default function OutstandingBalances() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const isStudentView = currentUser.role === 'student';

  const canManagePayments =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'admin' ||
    currentUser.role === 'finance' ||
    currentUser.role === 'internal_sales' ||
    currentUser.role === 'external_sales';

  const [balances, setBalances] = useState<OutstandingBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentProfileFound, setStudentProfileFound] = useState(true);

  useEffect(() => {
    fetchBalances();
  }, []);

  async function fetchBalances() {
    setLoading(true);

    let studentIdFilter: string | undefined;

    if (isStudentView) {
      const studentId = await getCurrentStudentId();

      if (!studentId) {
        setStudentProfileFound(false);
        setBalances([]);
        setLoading(false);
        return;
      }

      studentIdFilter = studentId;
    }

    const { data } = await fetchOutstandingBalances(studentIdFilter, isStudentView);
    setBalances(data);
    setLoading(false);
  }

  async function sendReminder(balance: OutstandingBalance) {
    if (!canManagePayments) return;

    const result = await sendPaymentReminder({
      studentName: balance.student,
      target: {
        userId: balance.studentUserId,
        email: balance.studentEmail,
        phone: balance.phone,
        name: balance.student,
      },
      outstandingAmount: balance.outstandingAmount,
      nextDueDate: balance.nextDueDate,
      relatedId: balance.id,
    });

    if (result.whatsapp?.waLink) {
      window.open(result.whatsapp.waLink, '_blank');
    }

    alert(`Reminder sent to ${balance.student}.`);
  }

  const totalOutstanding = balances.reduce(
    (acc, balance) => acc + balance.outstandingAmount,
    0
  );

  const totalPaid = balances.reduce((acc, balance) => acc + balance.paidAmount, 0);

  const totalFee = balances.reduce((acc, balance) => acc + balance.totalFee, 0);

  const collectionRate =
    totalPaid + totalOutstanding > 0
      ? Math.round((totalPaid / (totalPaid + totalOutstanding)) * 100)
      : 0;

  const criticalCount = balances.filter((balance) => balance.status === 'Critical').length;

  const overdueCount = balances.filter((balance) => balance.status === 'Overdue').length;

  if (isStudentView && !studentProfileFound) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl text-[#284342]">My Payments</h1>
          <p className="text-[#6b6b6b] mt-1">
            View your own tuition fee and outstanding balance.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-800">
          Your student profile was not found. Please complete student registration first or wait for admin approval.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">
          {isStudentView ? 'My Payments' : 'Outstanding Balances'}
        </h1>
        <p className="text-[#6b6b6b] mt-1">
          {isStudentView
            ? 'View your payment progress, next due date and outstanding amount.'
            : 'Follow up unpaid balances and overdue student payments.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          icon={<DollarSign size={24} className="text-red-700" />}
          label={isStudentView ? 'My Outstanding' : 'Total Outstanding'}
          value={formatCurrency(totalOutstanding)}
          valueColor="text-red-700"
        />

        <SummaryCard
          label={isStudentView ? 'Total Fee' : 'Students Owing'}
          value={isStudentView ? formatCurrency(totalFee) : balances.length.toString()}
          valueColor="text-[#284342]"
          valueSize="text-3xl"
        />

        <SummaryCard
          label={isStudentView ? 'Paid Amount' : 'Critical'}
          value={isStudentView ? formatCurrency(totalPaid) : criticalCount.toString()}
          valueColor={isStudentView ? 'text-green-700' : 'text-red-700'}
          valueSize="text-3xl"
        />

        <SummaryCard
          label="Payment Progress"
          value={`${collectionRate}%`}
          valueColor="text-green-700"
          valueSize="text-3xl"
        />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)] flex items-center justify-between">
          <h2 className="text-lg text-[#284342]">
            {isStudentView ? 'My Payment Plan' : 'Collection Follow-Up List'}
          </h2>

          {!isStudentView && (
            <p className="text-sm text-[#6b6b6b]">{overdueCount} overdue account(s)</p>
          )}
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
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Payment Progress</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Outstanding</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Next Due</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Overdue</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Status</th>
                {!isStudentView && (
                  <th className="px-6 py-4 text-left text-sm text-[#284342]">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {loading && (
                <tr>
                  <td
                    colSpan={isStudentView ? 6 : 8}
                    className="px-6 py-8 text-center text-[#6b6b6b]"
                  >
                    Loading payment information...
                  </td>
                </tr>
              )}

              {!loading && balances.length === 0 && (
                <tr>
                  <td
                    colSpan={isStudentView ? 6 : 8}
                    className="px-6 py-8 text-center text-[#6b6b6b]"
                  >
                    {isStudentView
                      ? 'No payment plan found.'
                      : 'No outstanding balances found.'}
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
                        balance.status === 'Critical' && !isStudentView
                          ? 'bg-red-50'
                          : ''
                      }`}
                    >
                      {!isStudentView && (
                        <td className="px-6 py-4">
                          <p className="text-sm text-[#284342]">{balance.student}</p>
                          <p className="text-xs text-[#6b6b6b] mt-1">
                            {balance.phone || 'No phone'}
                          </p>
                        </td>
                      )}

                      <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                        {balance.course}
                      </td>

                      <td className="px-6 py-4">
                        <div className="min-w-40">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[#6b6b6b]">
                              {formatCurrency(balance.paidAmount)} / {formatCurrency(balance.totalFee)}
                            </span>
                            <span className="text-xs text-[#284342]">{progress}%</span>
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
                        {formatCurrency(balance.outstandingAmount)}
                      </td>

                      <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                        {balance.nextDueDate}
                      </td>

                      <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                        {balance.daysOverdue > 0 ? `${balance.daysOverdue} day(s)` : '-'}
                      </td>

                      <td className="px-6 py-4">
                        <BalanceStatusBadge status={balance.status} />
                      </td>

                      {!isStudentView && (
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

                            {canManagePayments && (
                              <button
                                onClick={() => sendReminder(balance)}
                                className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                                title="Send Reminder"
                              >
                                <Send size={16} className="text-[#284342]" />
                              </button>
                            )}

                            {balance.status === 'Critical' && (
                              <AlertTriangle size={16} className="text-red-700" />
                            )}
                          </div>
                        </td>
                      )}
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
