import { useEffect, useState } from 'react';
import { Download, Eye, Receipt as ReceiptIcon, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  student: string;
  course: string;
  amount: number;
  paymentMethod: string;
  date: string;
  issuedBy: string;
  status: 'Issued' | 'Void';
}

export default function Receipts() {
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReceipts();
  }, []);

  async function fetchReceipts() {
    setLoading(true);

    const { data, error } = await supabase
      .from('receipts')
      .select(`
        id,
        receipt_number,
        receipt_url,
        issued_at,
        payments(
          amount_paid,
          payment_method,
          paid_at,
          installments(
            payment_plans(
              students(full_name),
              enrollments(
                class_batches(
                  courses(course_name)
                )
              )
            )
          )
        )
      `)
      .order('issued_at', { ascending: false });

    if (error) {
      console.error('Error fetching receipts:', error.message);
      setLoading(false);
      return;
    }

    const mapped: PaymentReceipt[] = (data || []).map((receipt: any) => {
      const payment = Array.isArray(receipt.payments)
        ? receipt.payments[0]
        : receipt.payments;

      const plan = getPaymentPlan(payment);

      return {
        id: receipt.id,
        receiptNumber: receipt.receipt_number || '-',
        student: getStudentName(plan?.students),
        course: getCourseNameFromEnrollment(plan?.enrollments),
        amount: Number(payment?.amount_paid || 0),
        paymentMethod: payment?.payment_method || '-',
        date: receipt.issued_at
          ? new Date(receipt.issued_at).toISOString().slice(0, 10)
          : '-',
        issuedBy: 'Admin',
        status: 'Issued',
      };
    });

    setReceipts(mapped);
    setLoading(false);
  }

  const totalAmount = receipts
    .filter((receipt) => receipt.status === 'Issued')
    .reduce((acc, receipt) => acc + receipt.amount, 0);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const thisMonthCount = receipts.filter((receipt) =>
    receipt.date.startsWith(currentMonth)
  ).length;

  function handlePreview(receipt: PaymentReceipt) {
    alert(
      `Receipt Preview\n\nReceipt No: ${receipt.receiptNumber}\nStudent: ${receipt.student}\nCourse: ${receipt.course}\nAmount: RM ${receipt.amount.toLocaleString()}\nPayment Method: ${receipt.paymentMethod}\nDate: ${receipt.date}`
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Payment Receipts</h1>
          <p className="text-[#6b6b6b] mt-1">
            View and manage payment receipts
          </p>
        </div>

        <button
          onClick={fetchReceipts}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors"
        >
          Refresh Receipts
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          icon={<ReceiptIcon size={24} className="text-[#284342]" />}
          label="Total Receipts"
          value={receipts.length.toString()}
          color="text-[#284342]"
        />

        <SummaryCard
          icon={<DollarSign size={24} className="text-green-700" />}
          label="Total Amount"
          value={`RM ${totalAmount.toLocaleString()}`}
          color="text-green-700"
        />

        <SummaryCard
          icon={<ReceiptIcon size={24} className="text-blue-700" />}
          label="This Month"
          value={thisMonthCount.toString()}
          color="text-blue-700"
        />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">All Receipts</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">
                  Receipt No.
                </th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">
                  Course
                </th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">
                  Payment Method
                </th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">
                  Issued By
                </th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-[#6b6b6b]"
                  >
                    Loading receipts...
                  </td>
                </tr>
              )}

              {!loading && receipts.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-[#6b6b6b]"
                  >
                    No receipts found.
                  </td>
                </tr>
              )}

              {!loading &&
                receipts.map((receipt) => (
                  <tr
                    key={receipt.id}
                    className="hover:bg-[#f8f8f6] transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-[#284342]">
                      {receipt.receiptNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {receipt.student}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {receipt.course}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#284342]">
                      RM {receipt.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {receipt.paymentMethod}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {receipt.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {receipt.issuedBy}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePreview(receipt)}
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye size={16} className="text-[#284342]" />
                        </button>

                        <button
                          onClick={() => handlePreview(receipt)}
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download size={16} className="text-[#284342]" />
                        </button>
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

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <div>
          <p className="text-sm text-[#6b6b6b]">{label}</p>
          <p className={`text-2xl ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function getPaymentPlan(payment: any) {
  const installment = Array.isArray(payment?.installments)
    ? payment.installments[0]
    : payment?.installments;

  const plan = Array.isArray(installment?.payment_plans)
    ? installment.payment_plans[0]
    : installment?.payment_plans;

  return plan;
}

function getStudentName(student: any) {
  if (!student) return 'Unnamed Student';
  if (Array.isArray(student)) return student[0]?.full_name || 'Unnamed Student';
  return student.full_name || 'Unnamed Student';
}

function getCourseNameFromEnrollment(enrollment: any) {
  if (!enrollment) return '-';

  const actualEnrollment = Array.isArray(enrollment)
    ? enrollment[0]
    : enrollment;

  const batch = actualEnrollment?.class_batches;
  const actualBatch = Array.isArray(batch) ? batch[0] : batch;

  const course = actualBatch?.courses;
  const actualCourse = Array.isArray(course) ? course[0] : course;

  return actualCourse?.course_name || '-';
}