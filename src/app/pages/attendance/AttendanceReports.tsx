import { useEffect, useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AttendanceStats {
  course: string;
  batch: string;
  totalClasses: number;
  avgAttendance: number;
  perfectAttendance: number;
  belowThreshold: number;
}

export default function AttendanceReports() {
  const [stats, setStats] = useState<AttendanceStats[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#284342]">Attendance Reports</h1>
          <p className="text-[#6b6b6b] mt-1">
            Generate and view attendance analytics
          </p>
        </div>

        <button className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2">
          <Download size={20} />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          label="Overall Attendance"
          value={`${overallAttendance}%`}
          color="text-green-700"
        />
        <SummaryCard
          label="Perfect Attendance"
          value={totalPerfectAttendance.toString()}
          color="text-[#284342]"
        />
        <SummaryCard
          label="Below Threshold"
          value={totalBelowThreshold.toString()}
          color="text-red-700"
        />
        <SummaryCard
          label="Total Classes"
          value={totalClasses.toString()}
          color="text-[#284342]"
        />
      </div>

      <div className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden">
        <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
          <h2 className="text-lg text-[#284342]">Attendance by Course</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Course</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Batch</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Total Classes</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Avg Attendance</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Perfect Attendance</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Below Threshold</th>
                <th className="px-6 py-4 text-left text-sm text-[#284342]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#6b6b6b]">
                    Loading attendance reports...
                  </td>
                </tr>
              )}

              {!loading && stats.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#6b6b6b]">
                    No attendance data found.
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
                      <button className="p-2 hover:bg-[#e9da95]/20 rounded-lg transition-colors">
                        <BarChart3 size={16} className="text-[#284342]" />
                      </button>
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