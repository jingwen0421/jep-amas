import { DollarSign, Calendar, CheckCircle2 } from 'lucide-react';

interface InstallmentSchedule {
  id: string;
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
  const installments: InstallmentSchedule[] = [
    {
      id: 'I001',
      student: 'Jessica Lim Mei Ling',
      course: 'Professional Makeup Artist Course',
      totalFee: 8000,
      installmentNumber: 3,
      totalInstallments: 4,
      amount: 2000,
      dueDate: '2026-06-15',
      status: 'Pending',
    },
    {
      id: 'I002',
      student: 'Rachel Tan Li Ying',
      course: 'Advanced Airbrush Course',
      totalFee: 7500,
      installmentNumber: 3,
      totalInstallments: 3,
      amount: 2500,
      dueDate: '2026-06-01',
      status: 'Overdue',
    },
    {
      id: 'I003',
      student: 'Melissa Chong Hui Wen',
      course: 'Bridal Makeup Specialist',
      totalFee: 6000,
      installmentNumber: 2,
      totalInstallments: 2,
      amount: 3000,
      dueDate: '2026-05-28',
      paidDate: '2026-05-28',
      status: 'Paid',
    },
    {
      id: 'I004',
      student: 'Amanda Ng Siew May',
      course: 'Special Effects Makeup',
      totalFee: 7000,
      installmentNumber: 1,
      totalInstallments: 2,
      amount: 3500,
      dueDate: '2026-06-20',
      status: 'Pending',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">Installments</h1>
        <p className="text-[#6b6b6b] mt-1">Track and manage payment installment schedules</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Total Due</p>
          <p className="text-2xl text-[#284342]">
            RM {installments.filter((i) => i.status !== 'Paid').reduce((acc, i) => acc + i.amount, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Pending</p>
          <p className="text-2xl text-yellow-700">
            {installments.filter((i) => i.status === 'Pending').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Overdue</p>
          <p className="text-2xl text-red-700">
            {installments.filter((i) => i.status === 'Overdue').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <p className="text-sm text-[#6b6b6b] mb-2">Paid</p>
          <p className="text-2xl text-green-700">
            {installments.filter((i) => i.status === 'Paid').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">Installment Schedule</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Student</th>
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
              {installments.map((inst) => (
                <tr key={inst.id} className="hover:bg-[#f8f8f6] transition-colors">
                  <td className="px-6 py-4 text-sm text-[#284342]">{inst.student}</td>
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
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        inst.status === 'Paid'
                          ? 'bg-green-100 text-green-700'
                          : inst.status === 'Overdue'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {inst.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {inst.status !== 'Paid' && (
                      <button className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm">
                        Record Payment
                      </button>
                    )}
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
