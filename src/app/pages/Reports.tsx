import { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  Eye,
} from 'lucide-react';

import {
  getDashboardAnalytics,
  getCourses,
  getGeneratedReports,
  DashboardAnalytics,
  ChartPoint,
  BusinessInsight,
} from '../services/analyticsService';

import { generateReport } from '../services/reportService';

import {
  downloadReportPDF,
  downloadReportExcel,
  printReport,
  GeneratedReport,
} from '../utils/reportExporter';

import KPISection from '../components/reports/KPISection';
import RevenueChart from '../components/reports/RevenueChart';
import StudentGrowthChart from '../components/reports/StudentGrowthChart';
import AttendanceChart from '../components/reports/AttendanceChart';
import PaymentCollectionChart from '../components/reports/PaymentCollectionChart';
import BusinessInsights from '../components/reports/BusinessInsights';
import ReportHistory from '../components/reports/ReportHistory';
import ReportPreview from '../components/reports/ReportPreview';

export default function Reports() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<DashboardAnalytics | null>(null);

  const [revenue, setRevenue] = useState<ChartPoint[]>([]);
  const [students, setStudents] = useState<ChartPoint[]>([]);
  const [attendance, setAttendance] = useState<ChartPoint[]>([]);

  const [courses, setCourses] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);

  const [filters, setFilters] = useState({
    reportType: 'attendance',
    startDate: '',
    endDate: new Date().toISOString().slice(0, 10),
    course: 'all',
  });

  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null);
  const [generating, setGenerating] = useState(false);  

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handlePreviewReport() {
  setGenerating(true);

  const report = await generateReport(filters);

  setSelectedReport(report);
  setGenerating(false);
}

async function handleDownloadPDF() {
    if (!selectedReport) return;

    await downloadReportPDF(selectedReport, filters);

    setHistory(await getGeneratedReports());
  }

  function handleDownloadExcel() {
    if (!selectedReport) return;

    downloadReportExcel(selectedReport);
  }

  function handlePrint() {
    if (!selectedReport) return;

    printReport(selectedReport);
  }

  async function loadDashboard() {
    setLoading(true);

    const analytics = await getDashboardAnalytics();

    setStats(analytics.stats);

    setRevenue(analytics.revenueTrend);

    setStudents(analytics.studentGrowth);

    setAttendance(analytics.attendanceTrend);

    setInsights(analytics.insights);

    setCourses(await getCourses());

    setHistory(await getGeneratedReports());

    setLoading(false);
  }

  if (loading || !stats) {
    return (
      <div className="p-10 text-center text-[#6b6b6b]">
        Loading Reports...
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-3xl text-[#284342]">
            Reports & Analytics
          </h1>

          <p className="text-[#6b6b6b] mt-2">
            Academy performance dashboard and report generation
          </p>

        </div>

      </div>

      {/* KPI */}

      <KPISection stats={stats} />

      {/* Charts */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <RevenueChart data={revenue} />

        <StudentGrowthChart data={students} />

        <AttendanceChart data={attendance} />

        <PaymentCollectionChart
          collected={stats.collectedRate}
        />

      </div>

      {/* Report Generator */}

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] p-6">

        <h2 className="text-xl text-[#284342] mb-6">
          Report Generator
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

          <div>

            <label className="text-sm text-[#284342] block mb-2">
              Report Type
            </label>

            <select
              className="w-full rounded-lg border px-4 py-3"
              value={filters.reportType}
              onChange={(e)=>
                setFilters({
                  ...filters,
                  reportType:e.target.value
                })
              }
            >

              <option value="attendance">
                Attendance Report
              </option>

              <option value="payment">
                Payment Report
              </option>

              <option value="enrollment">
                Enrollment Report
              </option>

              <option value="portfolio">
                Portfolio Report
              </option>

              <option value="survey">
                Student Satisfaction
              </option>

              <option value="teacher">
                Teacher Performance
              </option>

            </select>

          </div>

          <div>

            <label className="text-sm text-[#284342] block mb-2">
              Start Date
            </label>

            <input
              type="date"
              className="w-full rounded-lg border px-4 py-3"
              value={filters.startDate}
              onChange={(e)=>
                setFilters({
                  ...filters,
                  startDate:e.target.value
                })
              }
            />

          </div>

          <div>

            <label className="text-sm text-[#284342] block mb-2">
              End Date
            </label>

            <input
              type="date"
              className="w-full rounded-lg border px-4 py-3"
              value={filters.endDate}
              onChange={(e)=>
                setFilters({
                  ...filters,
                  endDate:e.target.value
                })
              }
            />

          </div>

          <div>

            <label className="text-sm text-[#284342] block mb-2">
              Course
            </label>

            <select
              className="w-full rounded-lg border px-4 py-3"
              value={filters.course}
              onChange={(e)=>
                setFilters({
                  ...filters,
                  course:e.target.value
                })
              }
            >

              <option value="all">
                All Courses
              </option>

              {courses.map(course=>(
                <option
                  key={course.id}
                  value={course.id}
                >
                  {course.course_name}
                </option>
              ))}

            </select>

          </div>

        </div>

        <div className="flex gap-4 mt-8">

         <div className="flex gap-4 mt-8 flex-wrap">
          <button
            onClick={handlePreviewReport}
            disabled={generating}
            className="px-6 py-3 rounded-lg bg-[#284342] text-[#e9da95] flex items-center gap-2 disabled:opacity-60"
          >
            <Eye size={18} />
            {generating ? 'Generating...' : 'Preview Report'}
          </button>

          <button
            onClick={async () => {
              const report = await generateReport(filters);
              await downloadReportPDF(report, filters);
              setHistory(await getGeneratedReports());
            }}
            className="px-6 py-3 rounded-lg border flex items-center gap-2"
          >
            <Download size={18} />
            Export PDF
          </button>

          <button
            onClick={async () => {
              const report = await generateReport(filters);
              downloadReportExcel(report);
            }}
            className="px-6 py-3 rounded-lg border flex items-center gap-2"
          >
            <FileText size={18} />
            Export Excel
          </button>
        </div>
        </div>

      </div>

      {/* Bottom */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <ReportHistory reports={history}/>

        <BusinessInsights
          insights={insights}
        />

      </div>

      {selectedReport && (
        <ReportPreview
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onDownloadPDF={handleDownloadPDF}
          onDownloadExcel={handleDownloadExcel}
          onPrint={handlePrint}
        />
      )}

    </div>
  );
}