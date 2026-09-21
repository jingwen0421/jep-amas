import { useEffect, useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { downloadReportExcel } from '../../utils/reportExporter';
import { useLanguage } from '../../context/LanguageContext';

interface AttendanceStats {
  course: string;
  batch: string;
  totalClasses: number;
  avgAttendance: number;
  perfectAttendance: number;
  belowThreshold: number;
}

export default function AttendanceReports() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<AttendanceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingStat, setViewingStat] = useState<AttendanceStats | null>(null);

  useEffect(() => {
    fetchAttendanceReports();
  }, []);

  async function fetchAttendanceReports() {
    setLoading(true);

    const { data, error } = await supabase
      .from('class_batches')
      .select(`
        id,
        batch_name,
        courses(course_name),
        lessons(
          id,
          attendance(
            student_id,
            attendance_status
          )
        ),
        enrollments(
          student_id
        )
      `);

    if (error) {
      console.error('Error fetching attendance reports:', error.message);
      setLoading(false);
      return;
    }

    const mapped: AttendanceStats[] = (data || []).map((batch: any) => {
      const lessons = batch.lessons || [];
      const enrollments = batch.enrollments || [];
      const totalStudents = enrollments.length;
      const totalClasses = lessons.length;

      let totalPossibleAttendance = totalClasses * totalStudents;
      let totalPresentLike = 0;

      const studentAttendanceMap = new Map<string, { present: number; total: number }>();

      lessons.forEach((lesson: any) => {
        const attendanceRecords = lesson.attendance || [];

        attendanceRecords.forEach((record: any) => {
          const isPresentLike =
            record.attendance_status === 'present' ||
            record.attendance_status === 'late';

          if (isPresentLike) {
            totalPresentLike += 1;
          }

          if (!studentAttendanceMap.has(record.student_id)) {
            studentAttendanceMap.set(record.student_id, {
              present: 0,
              total: 0,
            });
          }

          const studentStats = studentAttendanceMap.get(record.student_id)!;
          studentStats.total += 1;

          if (isPresentLike) {
            studentStats.present += 1;
          }
        });
      });

      const avgAttendance =
        totalPossibleAttendance > 0
          ? Math.round((totalPresentLike / totalPossibleAttendance) * 100)
          : 0;

      let perfectAttendance = 0;
      let belowThreshold = 0;

      studentAttendanceMap.forEach((value) => {
        const percentage =
          value.total > 0 ? Math.round((value.present / value.total) * 100) : 0;

        if (percentage === 100) perfectAttendance += 1;
        if (percentage < 80) belowThreshold += 1;
      });

      return {
        course: getCourseName(batch.courses),
        batch: batch.batch_name || '-',
        totalClasses,
        avgAttendance,
        perfectAttendance,
        belowThreshold,
      };
    });

    setStats(mapped);
    setLoading(false);
  }

  const totalClasses = stats.reduce((sum, item) => sum + item.totalClasses, 0);

  const overallAttendance =
    stats.length > 0
      ? Math.round(
          stats.reduce((sum, item) => sum + item.avgAttendance, 0) /
            stats.length
        )
      : 0;

  const totalPerfectAttendance = stats.reduce(
    (sum, item) => sum + item.perfectAttendance,
    0
  );

  const totalBelowThreshold = stats.reduce(
    (sum, item) => sum + item.belowThreshold,
    0
  );

  function exportReport() {
    if (stats.length === 0) {
      alert(t('attendanceReports.alert.noData'));
      return;
    }

    downloadReportExcel({
      title: t('attendanceReports.exportTitle'),
      reportType: 'attendance',
      generatedAt: new Date().toLocaleString(),
      summary: [
        { label: t('attendanceReports.overallAttendance'), value: `${overallAttendance}%` },
        { label: t('attendanceReports.perfectAttendance'), value: String(totalPerfectAttendance) },
        { label: t('attendanceReports.belowThreshold'), value: String(totalBelowThreshold) },
        { label: t('attendanceReports.totalClasses'), value: String(totalClasses) },
      ],
      rows: stats.map((stat) => ({
        [t('attendanceReports.column.course')]: stat.course,
        [t('attendanceReports.column.batch')]: stat.batch,
        [t('attendanceReports.column.totalClasses')]: stat.totalClasses,
        [t('attendanceReports.column.avgAttendancePct')]: stat.avgAttendance,
        [t('attendanceReports.column.perfectAttendance')]: stat.perfectAttendance,
        [t('attendanceReports.column.belowThreshold')]: stat.belowThreshold,
      })),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">{t('attendanceReports.title')}</h1>
          <p className="text-[#6b6b6b] mt-1">
            {t('attendanceReports.subtitle')}
          </p>
        </div>

        <button
          onClick={exportReport}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
        >
          <Download size={20} />
          {t('attendanceReports.exportReport')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          label={t('attendanceReports.overallAttendance')}
          value={`${overallAttendance}%`}
          color="text-green-700"
        />
        <SummaryCard
          label={t('attendanceReports.perfectAttendance')}
          value={totalPerfectAttendance.toString()}
          color="text-[#284342]"
        />
        <SummaryCard
          label={t('attendanceReports.belowThreshold')}
          value={totalBelowThreshold.toString()}
          color="text-red-700"
        />
        <SummaryCard
          label={t('attendanceReports.totalClasses')}
          value={totalClasses.toString()}
          color="text-[#284342]"
        />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">{t('attendanceReports.attendanceByCourse')}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('attendanceReports.column.course')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('attendanceReports.column.batch')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('attendanceReports.totalClasses')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('attendanceReports.avgAttendance')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('attendanceReports.perfectAttendance')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('attendanceReports.belowThreshold')}</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">{t('attendanceReports.actions')}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#6b6b6b]">
                    {t('attendanceReports.loading')}
                  </td>
                </tr>
              )}

              {!loading && stats.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#6b6b6b]">
                    {t('attendanceReports.empty')}
                  </td>
                </tr>
              )}

              {!loading &&
                stats.map((stat, idx) => (
                  <tr
                    key={`${stat.batch}-${idx}`}
                    className="hover:bg-[#f8f8f6] transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-[#284342]">
                      {stat.course}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {stat.batch}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6b6b]">
                      {stat.totalClasses}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm ${
                          stat.avgAttendance >= 90
                            ? 'text-green-700'
                            : 'text-red-700'
                        }`}
                      >
                        {stat.avgAttendance}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#284342]">
                      {stat.perfectAttendance}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-700">
                      {stat.belowThreshold}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setViewingStat(stat)}
                        className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors"
                      >
                        <BarChart3 size={16} className="text-[#284342]" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewingStat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl text-[#284342] mb-1">
              {viewingStat.course}
            </h2>
            <p className="text-sm text-[#6b6b6b] mb-6">{viewingStat.batch}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <Info label={t('attendanceReports.totalClasses')} value={viewingStat.totalClasses} />
              <Info
                label={t('attendanceReports.avgAttendance')}
                value={`${viewingStat.avgAttendance}%`}
              />
              <Info
                label={t('attendanceReports.perfectAttendance')}
                value={viewingStat.perfectAttendance}
              />
              <Info
                label={t('attendanceReports.belowThreshold')}
                value={viewingStat.belowThreshold}
              />
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setViewingStat(null)}
                className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
              >
                {t('attendanceReports.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-[#6b6b6b] mb-1">{label}</p>
      <p className="text-[#284342]">{value}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <p className="text-sm text-[#6b6b6b] mb-2">{label}</p>
      <p className={`text-3xl ${color}`}>{value}</p>
    </div>
  );
}

function getCourseName(course: any) {
  if (!course) return '-';
  if (Array.isArray(course)) return course[0]?.course_name || '-';
  return course.course_name || '-';
}