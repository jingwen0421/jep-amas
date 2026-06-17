import { useState } from 'react';
import { Search, Eye, Clock, CheckCircle, AlertCircle, Download, FileText } from 'lucide-react';

const paymentPlans = [
  {
    id: 1,
    studentName: 'Nur Aisyah Binti Ahmad',
    course: 'Makeup Artistry',
    totalFee: 3800,
    paidAmount: 2500,
    installments: [
      { id: 1, amount: 1000, dueDate: '2026-03-15', paidDate: '2026-03-14', status: 'Paid' },
      { id: 2, amount: 1000, dueDate: '2026-04-15', paidDate: '2026-04-15', status: 'Paid' },
      { id: 3, amount: 500, dueDate: '2026-05-15', paidDate: '2026-05-10', status: 'Paid' },
      { id: 4, amount: 1300, dueDate: '2026-06-15', paidDate: null, status: 'Upcoming' },
    ],
    avatar: 'NA',
  },
  {
    id: 2,
    studentName: 'Siti Nurhaliza Binti Rosli',
    course: 'Bridal Makeup Specialist',
    totalFee: 2850,
    paidAmount: 1900,
    installments: [
      { id: 1, amount: 950, dueDate: '2026-04-01', paidDate: '2026-04-01', status: 'Paid' },
      { id: 2, amount: 950, dueDate: '2026-05-01', paidDate: '2026-05-02', status: 'Paid' },
      { id: 3, amount: 950, dueDate: '2026-06-01', paidDate: null, status: 'Upcoming' },
    ],
    avatar: 'SN',
  },
  {
    id: 3,
    studentName: 'Lee Mei Ling',
    course: 'Hair Styling & Coloring',
    totalFee: 3300,
    paidAmount: 1650,
    installments: [
      { id: 1, amount: 1650, dueDate: '2026-03-20', paidDate: '2026-03-18', status: 'Paid' },
      { id: 2, amount: 1650, dueDate: '2026-05-20', paidDate: null, status: 'Overdue' },
    ],
    avatar: 'LM',
  },
  {
    id: 4,
    studentName: 'Kavitha A/P Devi',
    course: 'Skincare & Facial Treatment',
    totalFee: 2400,
    paidAmount: 2400,
    installments: [
      { id: 1, amount: 800, dueDate: '2026-02-10', paidDate: '2026-02-08', status: 'Paid' },
      { id: 2, amount: 800, dueDate: '2026-03-10', paidDate: '2026-03-10', status: 'Paid' },
      { id: 3, amount: 800, dueDate: '2026-04-10', paidDate: '2026-04-09', status: 'Paid' },
    ],
    avatar: 'KD',
  },
  {
    id: 5,
    studentName: 'Farah Amelia Binti Ismail',
    course: 'Professional Nail Art',
    totalFee: 2250,
    paidAmount: 750,
    installments: [
      { id: 1, amount: 750, dueDate: '2026-05-05', paidDate: '2026-05-05', status: 'Paid' },
      { id: 2, amount: 750, dueDate: '2026-06-05', paidDate: null, status: 'Upcoming' },
      { id: 3, amount: 750, dueDate: '2026-07-05', paidDate: null, status: 'Upcoming' },
    ],
    avatar: 'FA',
  },
  {
    id: 6,
    studentName: 'Tan Xiao Wei',
    course: 'Makeup Artistry',
    totalFee: 3800,
    paidAmount: 1900,
    installments: [
      { id: 1, amount: 1900, dueDate: '2026-04-12', paidDate: '2026-04-15', status: 'Paid' },
      { id: 2, amount: 1900, dueDate: '2026-05-25', paidDate: null, status: 'Overdue' },
    ],
    avatar: 'TX',
  },
];

export default function PaymentTracking() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);

  const filteredPayments = paymentPlans.filter((plan) =>
    plan.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCollected = paymentPlans.reduce((sum, plan) => sum + plan.paidAmount, 0);
  const outstandingBalance = paymentPlans.reduce((sum, plan) => sum + (plan.totalFee - plan.paidAmount), 0);
  const overduePayments = paymentPlans.filter(plan =>
    plan.installments.some(inst => inst.status === 'Overdue')
  ).length;
  const studentsOnInstallment = paymentPlans.filter(plan => plan.totalFee > plan.paidAmount).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return { bg: 'rgba(40, 67, 66, 0.1)', text: '#284342' };
      case 'Upcoming':
        return { bg: 'rgba(233, 218, 149, 0.3)', text: '#284342' };
      case 'Overdue':
        return { bg: 'rgba(212, 24, 61, 0.1)', text: '#d4183d' };
      default:
        return { bg: 'rgba(107, 107, 107, 0.1)', text: '#6b6b6b' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={{ color: '#284342' }}>Payment Tracking</h1>
          <p style={{ color: '#6b6b6b' }}>Monitor student payment plans and installments</p>
        </div>
        <button
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all hover:opacity-90"
          style={{ background: '#284342', color: '#e9da95' }}
        >
          <Download className="w-5 h-5" />
          Export Payment Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>Total Collected</p>
          <h2 style={{ color: '#284342' }}>RM {totalCollected.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        </div>
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>Outstanding Balance</p>
          <h2 style={{ color: '#284342' }}>RM {outstandingBalance.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        </div>
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>Overdue Payments</p>
          <h2 style={{ color: '#d4183d' }}>{overduePayments}</h2>
        </div>
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>Students on Installment Plan</p>
          <h2 style={{ color: '#284342' }}>{studentsOnInstallment}</h2>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6b6b6b' }} />
          <input
            type="text"
            placeholder="Search by student name or course"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1"
            style={{ borderColor: 'rgba(40, 67, 66, 0.2)', background: '#fff' }}
          />
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8f8f6', borderBottom: '1px solid rgba(40, 67, 66, 0.1)' }}>
                <th className="text-left px-6 py-4 text-sm" style={{ color: '#284342' }}>Student Name</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: '#284342' }}>Course</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: '#284342' }}>Total Fee</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: '#284342' }}>Paid Amount</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: '#284342' }}>Balance</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: '#284342' }}>Next Due Date</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: '#284342' }}>Status</th>
                <th className="text-left px-6 py-4 text-sm" style={{ color: '#284342' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((plan) => {
                const balance = plan.totalFee - plan.paidAmount;
                const nextDue = plan.installments.find(inst => inst.status !== 'Paid');
                const hasOverdue = plan.installments.some(inst => inst.status === 'Overdue');
                let status = 'Paid';
                if (balance > 0 && !hasOverdue) status = plan.paidAmount > 0 ? 'Partial' : 'Pending';
                if (hasOverdue) status = 'Overdue';

                return (
                  <tr key={plan.id} style={{ borderBottom: '1px solid rgba(40, 67, 66, 0.1)' }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: '#284342', color: '#e9da95' }}
                        >
                          <span className="text-sm">{plan.avatar}</span>
                        </div>
                        <span style={{ color: '#284342' }}>{plan.studentName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4" style={{ color: '#6b6b6b' }}>{plan.course}</td>
                    <td className="px-6 py-4" style={{ color: '#284342' }}>RM {plan.totalFee.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4" style={{ color: '#284342' }}>RM {plan.paidAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4" style={{ color: balance > 0 ? '#d4183d' : '#284342' }}>
                      RM {balance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4" style={{ color: '#6b6b6b' }}>
                      {nextDue ? nextDue.dueDate : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="px-3 py-1 rounded-md text-sm"
                        style={{
                          background: status === 'Paid' ? 'rgba(40, 67, 66, 0.1)' :
                                     status === 'Partial' ? 'rgba(233, 218, 149, 0.3)' :
                                     status === 'Overdue' ? 'rgba(212, 24, 61, 0.1)' : 'rgba(107, 107, 107, 0.1)',
                          color: status === 'Overdue' ? '#d4183d' : '#284342'
                        }}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedStudent(selectedStudent === plan.id ? null : plan.id)}
                          className="px-3 py-1.5 rounded-lg text-sm transition-all hover:opacity-80"
                          style={{ background: 'rgba(40, 67, 66, 0.1)', color: '#284342' }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="px-3 py-1.5 rounded-lg text-sm transition-all hover:opacity-80"
                          style={{ background: '#284342', color: '#e9da95' }}
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details */}
      {selectedStudent && (
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          {filteredPayments.filter(plan => plan.id === selectedStudent).map((plan) => {
            const progress = (plan.paidAmount / plan.totalFee) * 100;

            return (
              <div key={plan.id} className="space-y-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 style={{ color: '#284342' }}>Payment History - {plan.studentName}</h3>
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="text-sm hover:underline"
                      style={{ color: '#6b6b6b' }}
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-lg" style={{ background: '#f8f8f6' }}>
                      <p className="text-sm mb-1" style={{ color: '#6b6b6b' }}>Total Fee</p>
                      <p className="text-lg" style={{ color: '#284342' }}>RM {plan.totalFee.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ background: '#f8f8f6' }}>
                      <p className="text-sm mb-1" style={{ color: '#6b6b6b' }}>Paid Amount</p>
                      <p className="text-lg" style={{ color: '#284342' }}>RM {plan.paidAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ background: '#f8f8f6' }}>
                      <p className="text-sm mb-1" style={{ color: '#6b6b6b' }}>Balance</p>
                      <p className="text-lg" style={{ color: '#d4183d' }}>
                        RM {(plan.totalFee - plan.paidAmount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span style={{ color: '#6b6b6b' }}>Payment Progress</span>
                      <span style={{ color: '#284342' }}>{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: 'rgba(40, 67, 66, 0.1)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progress}%`, background: '#284342' }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-4" style={{ color: '#284342' }}>Installment Schedule</h4>
                  <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
                    <table className="w-full">
                      <thead>
                        <tr style={{ background: '#f8f8f6', borderBottom: '1px solid rgba(40, 67, 66, 0.1)' }}>
                          <th className="text-left px-4 py-3 text-sm" style={{ color: '#284342' }}>Installment</th>
                          <th className="text-left px-4 py-3 text-sm" style={{ color: '#284342' }}>Amount</th>
                          <th className="text-left px-4 py-3 text-sm" style={{ color: '#284342' }}>Due Date</th>
                          <th className="text-left px-4 py-3 text-sm" style={{ color: '#284342' }}>Paid Date</th>
                          <th className="text-left px-4 py-3 text-sm" style={{ color: '#284342' }}>Status</th>
                          <th className="text-left px-4 py-3 text-sm" style={{ color: '#284342' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.installments.map((installment) => {
                          const colors = getStatusColor(installment.status);
                          return (
                            <tr key={installment.id} style={{ borderBottom: '1px solid rgba(40, 67, 66, 0.1)' }}>
                              <td className="px-4 py-3" style={{ color: '#284342' }}>#{installment.id}</td>
                              <td className="px-4 py-3" style={{ color: '#284342' }}>
                                RM {installment.amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3" style={{ color: '#6b6b6b' }}>{installment.dueDate}</td>
                              <td className="px-4 py-3" style={{ color: '#6b6b6b' }}>{installment.paidDate || '-'}</td>
                              <td className="px-4 py-3">
                                <span
                                  className="px-3 py-1 rounded-md text-sm"
                                  style={{ background: colors.bg, color: colors.text }}
                                >
                                  {installment.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {installment.status !== 'Paid' && (
                                  <button
                                    className="px-3 py-1.5 rounded-lg text-sm transition-all hover:opacity-90"
                                    style={{ background: '#284342', color: '#e9da95' }}
                                  >
                                    Record Payment
                                  </button>
                                )}
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
          })}
        </div>
      )}
    </div>
  );
}
