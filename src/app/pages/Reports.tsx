import { BarChart3, Download, FileText, TrendingUp } from 'lucide-react';

export default function Reports() {
  const reports = [
    { id: 'R001', name: 'Enrollment Report', description: 'Student enrollment trends and statistics', period: 'Monthly', lastGenerated: '2026-06-01' },
    { id: 'R002', name: 'Attendance Report', description: 'Class attendance rates and absenteeism', period: 'Weekly', lastGenerated: '2026-05-30' },
    { id: 'R003', name: 'Payment Report', description: 'Revenue, outstanding balances, and payment trends', period: 'Monthly', lastGenerated: '2026-06-01' },
    { id: 'R004', name: 'Teacher Performance', description: 'Teaching hours, student feedback, class ratings', period: 'Quarterly', lastGenerated: '2026-05-15' },
    { id: 'R005', name: 'Portfolio Completion', description: 'Student portfolio submission and approval rates', period: 'Monthly', lastGenerated: '2026-06-01' },
    { id: 'R006', name: 'Student Satisfaction', description: 'Survey results and feedback analysis', period: 'Quarterly', lastGenerated: '2026-05-01' },
    { id: 'R007', name: 'Outstanding Balances', description: 'Detailed breakdown of unpaid fees by student', period: 'Daily', lastGenerated: '2026-06-02' },
    { id: 'R008', name: 'Appointment Statistics', description: 'Consultation bookings and completion rates', period: 'Monthly', lastGenerated: '2026-06-01' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">Reports & Analytics</h1>
        <p className="text-[#6b6b6b] mt-1">Generate comprehensive reports for academy operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 size={24} className="text-[#284342]" />
            <div>
              <p className="text-sm text-[#6b6b6b]">Total Reports</p>
              <p className="text-2xl text-[#284342]">{reports.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={24} className="text-green-700" />
            <div>
              <p className="text-sm text-[#6b6b6b]">Enrollment Growth</p>
              <p className="text-2xl text-green-700">+24%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={24} className="text-blue-700" />
            <div>
              <p className="text-sm text-[#6b6b6b]">Attendance Rate</p>
              <p className="text-2xl text-blue-700">94.2%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={24} className="text-[#284342]" />
            <div>
              <p className="text-sm text-[#6b6b6b]">Revenue This Month</p>
              <p className="text-2xl text-[#284342]">RM 182,450</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-[#e9da95]/20">
                <FileText size={24} className="text-[#284342]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg text-[#284342] mb-2">{report.name}</h3>
                <p className="text-sm text-[#6b6b6b] mb-4">{report.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-xs text-[#6b6b6b] mb-1">Period</p>
                    <p className="text-[#284342]">{report.period}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6b6b6b] mb-1">Last Generated</p>
                    <p className="text-[#284342]">{report.lastGenerated}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm">
                    Generate Report
                  </button>
                  <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-2">
                    <Download size={16} />
                    Download PDF
                  </button>
                  <button className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm flex items-center gap-2">
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
          <div className="text-center p-4 rounded-lg bg-[#f8f8f6]">
            <p className="text-3xl text-[#284342] mb-2">148</p>
            <p className="text-sm text-[#6b6b6b]">Active Students</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-[#f8f8f6]">
            <p className="text-3xl text-[#284342] mb-2">23</p>
            <p className="text-sm text-[#6b6b6b]">Active Classes</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-[#f8f8f6]">
            <p className="text-3xl text-[#284342] mb-2">RM 45,280</p>
            <p className="text-sm text-[#6b6b6b]">Outstanding Fees</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-[#f8f8f6]">
            <p className="text-3xl text-[#284342] mb-2">4.8/5.0</p>
            <p className="text-sm text-[#6b6b6b]">Satisfaction Score</p>
          </div>
        </div>
      </div>
    </div>
  );
}
