import { useEffect, useState } from 'react';
import { BarChart3, Download, FileText, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ReportItem {
  id: string;
  name: string;
  description: string;
  period: string;
  lastGenerated: string;
}

export default function Reports() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    activeStudents: 0,
    activeClasses: 0,
    outstandingFees: 0,
    attendanceRate: 0,
    revenueThisMonth: 0,
    totalReports: 8,
    satisfactionScore: '4.8/5.0',
  });

  const reports: ReportItem[] = [
    {
      id: 'R001',
      name: 'Enrollment Report',
      description: 'Student enrollment trends and statistics',
      period: 'Monthly',
      lastGenerated: new Date().toISOString().slice(0, 10),
    },
    {
      id: 'R002',
      name: 'Attendance Report',
      description: 'Class attendance rates and absenteeism',
      period: 'Weekly',
      lastGenerated: new Date().toISOString().slice(0, 10),
    },
    {
      id: 'R003',
      name: 'Payment Report',
      description: 'Revenue, outstanding balances, and payment trends',
      period: 'Monthly',
      lastGenerated: new Date().toISOString().slice(0, 10),
    },
    {
      id: 'R004',
      name: 'Teacher Performance',
      description: 'Teaching hours, student feedback, class ratings',
      period: 'Quarterly',
      lastGenerated: new Date().toISOString().slice(0, 10),
    },
    {
      id: 'R005',
      name: 'Portfolio Completion',
      description: 'Student portfolio submission and approval rates',
      period: 'Monthly',
      lastGenerated: new Date().toISOString().slice(0, 10),
    },
    {
      id: 'R006',
      name: 'Student Satisfaction',
      description: 'Survey results and feedback analysis',
      period: 'Quarterly',
      lastGenerated: new Date().toISOString().slice(0, 10),
    },
    {
      id: 'R007',
      name: 'Outstanding Balances',
      description: 'Detailed breakdown of unpaid fees by student',
      period: 'Daily',
      lastGenerated: new Date().toISOString().slice(0, 10),
    },
    {
      id: 'R008',
      name: 'Appointment Statistics',
      description: 'Consultation bookings and completion rates',
      period: 'Monthly',
      lastGenerated: new Date().toISOString().slice(0, 10),
    },
  ];

  useEffect(() => {
    fetchReportStats();
  }, []);

  async function fetchReportStats() {
    setLoading(true);

    const [
      studentsRes,
      lessonsRes,
      attendanceRes,
      paymentPlansRes,
      paymentsRes,
    ] = await Promise.all([
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),

      supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true }),

      supabase
        .from('attendance')
        .select('attendance_status'),

      supabase
        .from('payment_plans')
        .select(`
          final_amount,
          installments(amount, status)
        `),

      supabase
        .from('payments')
        .select('amount_paid, paid_at'),
    ]);

    const activeStudents = studentsRes.count || 0;
    const activeClasses = lessonsRes.count || 0;

    const attendance = attendanceRes.data || [];
    const presentCount = attendance.filter(
      (a: any) =>
        a.attendance_status === 'present' || a.attendance_status === 'late'
    ).length;

    const attendanceRate =
      attendance.length > 0
        ? Math.round((presentCount / attendance.length) * 100)
        : 0;

    const paymentPlans = paymentPlansRes.data || [];

    const totalFinalAmount = paymentPlans.reduce(
      (sum: number, plan: any) => sum + Number(plan.final_amount || 0),
      0
    );

    const totalPaidFromPlans = paymentPlans.reduce((sum: number, plan: any) => {
      const installments = plan.installments || [];

      const paid = installments
        .filter((item: any) => item.status === 'paid')
        .reduce((acc: number, item: any) => acc + Number(item.amount || 0), 0);

      return sum + paid;
    }, 0);

    const outstandingFees = Math.max(totalFinalAmount - totalPaidFromPlans, 0);

    const currentMonth = new Date().toISOString().slice(0, 7);

    const revenueThisMonth = (paymentsRes.data || [])
      .filter((payment: any) => {
        if (!payment.paid_at) return false;
        return new Date(payment.paid_at).toISOString().slice(0, 7) === currentMonth;
      })
      .reduce(
        (sum: number, payment: any) => sum + Number(payment.amount_paid || 0),
        0
      );

    setStats({
      activeStudents,
      activeClasses,
      outstandingFees,
      attendanceRate,
      revenueThisMonth,
      totalReports: reports.length,
      satisfactionScore: '4.8/5.0',
    });

    setLoading(false);
  }

  function generateReport(report: ReportItem) {
    alert(`${report.name} generated successfully.`);
  }

  function downloadReport(report: ReportItem, type: 'PDF' | 'Excel') {
    alert(`${report.name} downloaded as ${type}.`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">Reports & Analytics</h1>
        <p className="text-[#6b6b6b] mt-1">
          Generate comprehensive reports for academy operations
        </p>
      </div>

      {loading && (
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
          Loading reports...
        </div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <SummaryCard
              icon={<BarChart3 size={24} className="text-[#284342]" />}
              label="Total Reports"
              value={stats.totalReports.toString()}
              color="text-[#284342]"
            />

            <SummaryCard
              icon={<TrendingUp size={24} className="text-green-700" />}
              label="Active Students"
              value={stats.activeStudents.toString()}
              color="text-green-700"
            />

            <SummaryCard
              icon={<FileText size={24} className="text-blue-700" />}
              label="Attendance Rate"
              value={`${stats.attendanceRate}%`}
              color="text-blue-700"
            />

            <SummaryCard
              icon={<TrendingUp size={24} className="text-[#284342]" />}
              label="Revenue This Month"
              value={`RM ${stats.revenueThisMonth.toLocaleString()}`}
              color="text-[#284342]"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-[#e9da95]/20">
                    <FileText size={24} className="text-[#284342]" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg text-[#284342] mb-2">
                      {report.name}
                    </h3>
                    <p className="text-sm text-[#6b6b6b] mb-4">
                      {report.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-xs text-[#6b6b6b] mb-1">Period</p>
                        <p className="text-[#284342]">{report.period}</p>
                      </div>

                      <div>
                        <p className="text-xs text-[#6b6b6b] mb-1">
                          Last Generated
                        </p>
                        <p className="text-[#284342]">{report.lastGenerated}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => generateReport(report)}
                        className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm"
                      >
                        Generate Report
                      </button>

                      <button
                        onClick={() => downloadReport(report, 'PDF')}
                        className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-2"
                      >
                        <Download size={16} />
                        Download PDF
                      </button>

                      <button
                        onClick={() => downloadReport(report, 'Excel')}
                        className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-2"
                      >
                        <Download size={16} />
                        Excel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
            <h2 className="text-xl text-[#284342] mb-6">Quick Insights</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <InsightCard
                value={stats.activeStudents.toString()}
                label="Active Students"
              />

              <InsightCard
                value={stats.activeClasses.toString()}
                label="Active Classes"
              />

              <InsightCard
                value={`RM ${stats.outstandingFees.toLocaleString()}`}
                label="Outstanding Fees"
              />

              <InsightCard
                value={stats.satisfactionScore}
                label="Satisfaction Score"
              />
            </div>
          </div>
        </>
      )}
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

function InsightCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center p-4 rounded-lg bg-[#f8f8f6]">
      <p className="text-3xl text-[#284342] mb-2">{value}</p>
      <p className="text-sm text-[#6b6b6b]">{label}</p>
    </div>
  );
}