import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, Eye, Receipt as ReceiptIcon, DollarSign, Printer, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../utils/session';
import { getCurrentStudentId } from '../../utils/studentAccess';
import { generateReceiptHtml } from '../../lib/receiptTemplate';
import { notify } from '../../services/unifiedNotificationService';
import {
  type PaymentReceiptDetails,
  fetchReceiptsWithDetails,
  formatCurrency,
} from '../../services/paymentsService';
import { SummaryCard } from '../../components/payments/SummaryCard';
import { Modal, ModalHeader } from '../../components/payments/Modal';

export default function Receipts() {
  const currentUser = getCurrentUser();
  const isStudentView = currentUser.role === 'student';

  const [receipts, setReceipts] = useState<PaymentReceiptDetails[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceiptDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReceipts();
  }, []);

  async function fetchReceipts() {
    setLoading(true);

    let studentIdFilter: string | undefined;

    if (isStudentView) {
      const studentId = await getCurrentStudentId();

      if (!studentId) {
        setReceipts([]);
        setLoading(false);
        return;
      }

      studentIdFilter = studentId;
    }

    const { data } = await fetchReceiptsWithDetails(studentIdFilter);
    setReceipts(data);
    setLoading(false);
  }

  async function logReceiptAction(action: string, receipt: PaymentReceiptDetails) {
    await supabase.from('audit_logs').insert({
      user_id: currentUser.id || null,
      action,
      module: 'Receipts',
      target_id: receipt.id,
      old_data: null,
      new_data: {
        receipt_number: receipt.receiptNumber,
        student: receipt.student,
        amount: receipt.amount,
        action_by: currentUser.email,
        role: currentUser.role,
      },
      created_at: new Date().toISOString(),
    });
  }

  function previewReceipt(receipt: PaymentReceiptDetails) {
    setSelectedReceipt(receipt);
    logReceiptAction('Viewed Receipt', receipt);
  }

  async function downloadReceipt(receipt: PaymentReceiptDetails) {
    await logReceiptAction('Downloaded Receipt PDF', receipt);

    const hiddenContainer = document.createElement('div');
    hiddenContainer.style.position = 'fixed';
    hiddenContainer.style.left = '-9999px';
    hiddenContainer.style.top = '0';
    hiddenContainer.style.width = '800px';
    hiddenContainer.innerHTML = generateReceiptHtml(receipt);

    document.body.appendChild(hiddenContainer);

    const receiptElement = hiddenContainer.querySelector('.receipt') as HTMLElement;

    if (!receiptElement) {
      document.body.removeChild(hiddenContainer);
      alert('Unable to generate receipt PDF.');
      return;
    }

    const canvas = await html2canvas(receiptElement, {
      scale: 2,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(imgHeight, pageHeight - 20));

    pdf.save(`${receipt.receiptNumber}.pdf`);

    document.body.removeChild(hiddenContainer);
  }

  async function emailReceipt(receipt: PaymentReceiptDetails) {
    if (!receipt.studentEmail) {
      alert('This student has no email on file.');
      return;
    }

    await logReceiptAction('Emailed Receipt', receipt);

    const result = await notify({
      target: {
        userId: receipt.studentUserId,
        email: receipt.studentEmail,
        name: receipt.student,
      },
      channels: ['email'],
      title: `Your Payment Receipt — ${receipt.receiptNumber}`,
      message: `Attached is your receipt for ${formatCurrency(receipt.amount)}.`,
      emailHtml: generateReceiptHtml(receipt),
      type: 'receipt',
      relatedModule: 'Receipts',
      relatedId: receipt.paymentId,
    });

    if (result.email?.success) {
      alert(`Receipt emailed to ${receipt.student}.`);
    } else {
      alert(`Failed to send receipt email: ${result.email?.error || 'unknown error'}`);
    }
  }

  async function printReceipt(receipt: PaymentReceiptDetails) {
    await logReceiptAction('Printed Receipt', receipt);

    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      alert('Unable to open print window.');
      return;
    }

    printWindow.document.write(generateReceiptHtml(receipt));
    printWindow.document.close();
    printWindow.print();
  }

  const totalAmount = receipts
    .filter((receipt) => receipt.status === 'Issued')
    .reduce((acc, receipt) => acc + receipt.amount, 0);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const thisMonthCount = receipts.filter((receipt) =>
    receipt.date.startsWith(currentMonth)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">
            {isStudentView ? 'My Receipts' : 'Payment Receipts'}
          </h1>

          <p className="text-[#6b6b6b] mt-1">
            {isStudentView
              ? 'View, print and download your own payment receipts.'
              : 'View, preview, print and download payment receipts.'}
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
          label={isStudentView ? 'My Receipts' : 'Total Receipts'}
          value={receipts.length.toString()}
          valueColor="text-[#284342]"
        />

        <SummaryCard
          icon={<DollarSign size={24} className="text-green-700" />}
          label={isStudentView ? 'My Paid Amount' : 'Total Amount'}
          value={formatCurrency(totalAmount)}
          valueColor="text-green-700"
        />

        <SummaryCard
          icon={<ReceiptIcon size={24} className="text-blue-700" />}
          label="This Month"
          value={thisMonthCount.toString()}
          valueColor="text-blue-700"
        />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">
            {isStudentView ? 'My Receipt History' : 'All Receipts'}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">
                  Receipt No.
                </th>

                {!isStudentView && (
                  <th className="px-6 py-4 text-left text-sm text-[#284342]">
                    Student
                  </th>
                )}

                <th className="px-6 py-4 text-left text-sm text-[#284342]">Course</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Amount</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">
                  Payment Method
                </th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Reference</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">
                  Issued Date
                </th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Status</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {loading && (
                <tr>
                  <td
                    colSpan={isStudentView ? 8 : 9}
                    className="px-6 py-8 text-center text-[#6b6b6b]"
                  >
                    Loading receipts...
                  </td>
                </tr>
              )}

              {!loading && receipts.length === 0 && (
                <tr>
                  <td
                    colSpan={isStudentView ? 8 : 9}
                    className="px-6 py-8 text-center text-[#6b6b6b]"
                  >
                    {isStudentView
                      ? 'No receipts found for your account.'
                      : 'No receipts found.'}
                  </td>
                </tr>
              )}

              {!loading &&
                receipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-[#f8f8f6] transition-colors">
                    <td className="px-6 py-4 text-sm text-[#284342]">
                      {receipt.receiptNumber}
                    </td>

                    {!isStudentView && (
                      <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                        {receipt.student}
                      </td>
                    )}

                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {receipt.course}
                    </td>

                    <td className="px-6 py-4 text-sm text-[#284342]">
                      {formatCurrency(receipt.amount)}
                    </td>

                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {receipt.paymentMethod}
                    </td>

                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {receipt.paymentReference}
                    </td>

                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">{receipt.date}</td>

                    <td className="px-6 py-4">
                      <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">
                        {receipt.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => previewReceipt(receipt)}
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye size={16} className="text-[#284342]" />
                        </button>

                        <button
                          onClick={() => printReceipt(receipt)}
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                          title="Print"
                        >
                          <Printer size={16} className="text-[#284342]" />
                        </button>

                        <button
                          onClick={() => downloadReceipt(receipt)}
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download size={16} className="text-[#284342]" />
                        </button>

                        <button
                          onClick={() => emailReceipt(receipt)}
                          disabled={!receipt.studentEmail}
                          className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title={receipt.studentEmail ? 'Email Receipt' : 'No email on file'}
                        >
                          <Mail size={16} className="text-[#284342]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedReceipt && (
        <Modal maxWidth="max-w-3xl" scrollable>
          <div className="p-6 border-b border-[rgba(40,67,66,0.1)]">
            <ModalHeader title="Receipt Preview" onClose={() => setSelectedReceipt(null)} />
          </div>

          <ReceiptPreview receipt={selectedReceipt} />

          <div className="p-6 border-t border-[rgba(40,67,66,0.1)] flex items-center gap-3">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
            >
              Close
            </button>

            <button
              onClick={() => printReceipt(selectedReceipt)}
              className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
            >
              <Printer size={16} />
              Print
            </button>

            <button
              onClick={() => downloadReceipt(selectedReceipt)}
              className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              Download
            </button>

            <button
              onClick={() => emailReceipt(selectedReceipt)}
              disabled={!selectedReceipt.studentEmail}
              className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              title={selectedReceipt.studentEmail ? 'Email Receipt' : 'No email on file'}
            >
              <Mail size={16} />
              Email
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ReceiptPreview({ receipt }: { receipt: PaymentReceiptDetails }) {
  return (
    <div className="p-8">
      <div className="border-4 border-[#284342] rounded-lg p-8 bg-white">
        <div className="text-center mb-8">
          <h1 className="text-3xl text-[#284342] mb-2">JEP Image Makeup Academy</h1>
          <p className="text-sm text-[#6b6b6b]">Official Payment Receipt</p>
        </div>

        <div className="flex items-center justify-between border-y border-[rgba(40,67,66,0.2)] py-4 mb-6">
          <div>
            <p className="text-xs text-[#6b6b6b] mb-1">Receipt No.</p>
            <p className="text-sm text-[#284342]">{receipt.receiptNumber}</p>
          </div>

          <div className="text-right">
            <p className="text-xs text-[#6b6b6b] mb-1">Issued Date</p>
            <p className="text-sm text-[#284342]">{receipt.date}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <PreviewInfo label="Student Name" value={receipt.student} />
          <PreviewInfo label="Course" value={receipt.course} />
          <PreviewInfo label="Payment Method" value={receipt.paymentMethod} />
          <PreviewInfo label="Reference No." value={receipt.paymentReference} />
          <PreviewInfo label="Paid Date" value={receipt.paidAt} />
          <PreviewInfo label="Issued By" value={receipt.issuedBy} />
        </div>

        <div className="bg-[#f8f8f6] rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <p className="text-lg text-[#284342]">Amount Paid</p>
            <p className="text-3xl text-[#284342]">{formatCurrency(receipt.amount)}</p>
          </div>
        </div>

        <div className="flex justify-between items-end mt-12">
          <div>
            <div className="w-48 h-px bg-[#284342] mb-2"></div>
            <p className="text-xs text-[#6b6b6b]">Authorized Signature</p>
          </div>

          <div className="text-right">
            <p className="text-sm text-[#284342]">Thank you for your payment.</p>
            <p className="text-xs text-[#6b6b6b] mt-1">
              This is a computer-generated receipt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6b6b6b] mb-1">{label}</p>
      <p className="text-sm text-[#284342]">{value}</p>
    </div>
  );
}
