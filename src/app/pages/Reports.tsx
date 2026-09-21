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
import { useLanguage } from '../context/LanguageContext';

export default function Reports() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<DashboardAnalytics | null>(null);

  const [revenue, setRevenue] = useState<{ label: string; value: number }[]>([]);
  const [students, setStudents] = useState<{ label: string; value: number }[]>([]);
  const [attendance, setAttendance] = useState<{ label: string; value: number }[]>([]);

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

  function toLabeledPoints(points: ChartPoint[]) {
    return points.map((point) => ({
      label: t(`reports.month.${point.monthIndex}`),
      value: point.value,
    }));
  }

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

    setRevenue(toLabeledPoints(analytics.revenueTrend));

    setStudents(toLabeledPoints(analytics.studentGrowth));

    setAttendance(toLabeledPoints(analytics.attendanceTrend));

    setInsights(analytics.insights);

    setCourses(await getCourses());

    setHistory(await getGeneratedReports());

    setLoading(false);
  }

  if (loading || !stats) {
    return (
      <div className="p-10 text-center text-[#6b6b6b]">
        {t('reports.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-3xl text-[#284342]">
            {t('reports.title')}
          </h1>

          <p className="text-[#6b6b6b] mt-2">
            {t('reports.subtitle')}
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
          {t('reports.generator.title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

          <div>

            <label className="text-sm text-[#284342] block mb-2">
              {t('reports.generator.reportType')}
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
                {t('reports.type.attendance')}
              </option>

              <option value="payment">
                {t('reports.type.payment')}
              </option>

              <option value="enrollment">
                {t('reports.type.enrollment')}
              </option>

              <option value="portfolio">
                {t('reports.type.portfolio')}
              </option>

              <option value="survey">
                {t('reports.type.survey')}
              </option>

              <option value="teacher">
                {t('reports.type.teacher')}
              </option>

            </select>

          </div>

          <div>

            <label className="text-sm text-[#284342] block mb-2">
              {t('reports.generator.startDate')}
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
              {t('reports.generator.endDate')}
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
              {t('reports.generator.course')}
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
                {t('reports.generator.allCourses')}
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
            {generating ? t('reports.generating') : t('reports.previewReport')}
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
            {t('reports.exportPdf')}
          </button>

          <button
            onClick={async () => {
              const report = await generateReport(filters);
              downloadReportExcel(report);
            }}
            className="px-6 py-3 rounded-lg border flex items-center gap-2"
          >
            <FileText size={18} />
            {t('reports.exportExcel')}
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