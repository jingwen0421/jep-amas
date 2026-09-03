export interface PaymentReceipt {
  id: string;
  paymentId: string;
  receiptNumber: string;
  receiptUrl: string;
  student: string;
  course: string;
  amount: number;
  paymentMethod: string;
  paymentReference: string;
  paidAt: string;
  date: string;
  issuedBy: string;
  status: 'Issued' | 'Void';
}

export function generateReceiptHtml(receipt: PaymentReceipt) {
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${receipt.receiptNumber}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #284342;
    }
    .receipt {
      border: 4px solid #284342;
      border-radius: 12px;
      padding: 40px;
      max-width: 800px;
      margin: auto;
    }
    .center { text-align: center; }
    .muted { color: #6b6b6b; font-size: 13px; }
    .line {
      border-top: 1px solid rgba(40,67,66,0.2);
      border-bottom: 1px solid rgba(40,67,66,0.2);
      padding: 16px 0;
      margin: 28px 0;
      display: flex;
      justify-content: space-between;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }
    .amount {
      background: #f8f8f6;
      border-radius: 12px;
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 50px;
    }
    .amount strong {
      font-size: 32px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 60px;
    }
    .signature {
      width: 220px;
      border-top: 1px solid #284342;
      padding-top: 8px;
      font-size: 12px;
      color: #6b6b6b;
    }
    @media print {
      button { display: none; }
      body { padding: 0; }
      .receipt { border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="center">
      <h1>JEP Image Makeup Academy</h1>
      <p class="muted">Official Payment Receipt</p>
    </div>

    <div class="line">
      <div>
        <p class="muted">Receipt No.</p>
        <p>${receipt.receiptNumber}</p>
      </div>
      <div style="text-align:right">
        <p class="muted">Issued Date</p>
        <p>${receipt.date}</p>
      </div>
    </div>

    <div class="grid">
      <div><p class="muted">Student Name</p><p>${receipt.student}</p></div>
      <div><p class="muted">Course</p><p>${receipt.course}</p></div>
      <div><p class="muted">Payment Method</p><p>${receipt.paymentMethod}</p></div>
      <div><p class="muted">Reference No.</p><p>${receipt.paymentReference}</p></div>
      <div><p class="muted">Paid Date</p><p>${receipt.paidAt}</p></div>
      <div><p class="muted">Issued By</p><p>${receipt.issuedBy}</p></div>
    </div>

    <div class="amount">
      <span>Amount Paid</span>
      <strong>RM ${receipt.amount.toLocaleString()}</strong>
    </div>

    <div class="footer">
      <div class="signature">Authorized Signature</div>
      <div style="text-align:right">
        <p>Thank you for your payment.</p>
        <p class="muted">This is a computer-generated receipt.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}
