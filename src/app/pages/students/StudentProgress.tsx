import { useEffect, useState } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Award,
  Target,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router';
import { supabase } from '../../lib/supabase';
import { notify } from '../../services/unifiedNotificationService';
import { useLanguage } from '../../context/LanguageContext';

interface StudentProgressData {
  id: string;
  studentId: string;
  userId: string | null;
  email: string | null;
  phone: string | null;
  name: string;
  course: string;
  batch: string;
  overallProgress: number;
  lessonsCompleted: number;
  totalLessons: number;
  attendanceRate: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  averageScore: number;
  hasModuleData: boolean;
  modulesCompleted: number;
  totalModules: number;
}

export default function StudentProgress() {
  const { t } = useLanguage();
  const [selectedBatch, setSelectedBatch] = useState('All Batches');
  const [students, setStudents] = useState<StudentProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReportId, setSendingReportId] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setLoading(true);

    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        student_code,
        full_name,
        user_id,
        email,
        phone,
        progress,
        status,
        enrollments(
          id,
          enrollment_status,
          class_batches(
            batch_name,
            courses(
              course_name,
              course_modules(id, is_required)
            ),
            lessons(id)
          ),
          student_module_progress(module_id, status)
        ),
        attendance(attendance_status),
       portfolio_items(
          id,
          portfolio_status,
          portfolio_feedback(score)
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching student progress:', error.message);
      setLoading(false);
      return;
    }

    const mappedStudents: StudentProgressData[] = (data || []).map((student: any) => {
      const activeEnrollment =
        (student.enrollments || []).find(
          (item: any) => item.enrollment_status === 'active'
        ) || getSingle(student.enrollments);

      const batch = getSingle(activeEnrollment?.class_batches);
      const course = getSingle(batch?.courses);

      const lessons = batch?.lessons || [];
      const totalLessons = lessons.length || 0;

      const attendance = student.attendance || [];
      const presentCount = attendance.filter((record: any) =>
        ['present', 'late'].includes(
          String(record.attendance_status).toLowerCase()
        )
      ).length;

      const attendanceRate =
        attendance.length > 0
          ? Math.round((presentCount / attendance.length) * 100)
          : 0;

      const portfolioItems = student.portfolio_items || [];
      const completedAssignments = portfolioItems.filter((item: any) =>
        ['approved', 'reviewed'].includes(
          String(item.portfolio_status).toLowerCase()
        )
      ).length;

      const scores = portfolioItems
        .map((item: any) => {
          const feedback = getSingle(item.portfolio_feedback);
          return Number(feedback?.score ?? 0);
        })
        .filter((score: number) => score > 0);

      const averageScore =
        scores.length > 0
          ? Math.round(scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length)
          : 0;

      const progressFromLessons =
        totalLessons > 0
          ? Math.round((presentCount / totalLessons) * 100)
          : Number(student.progress || 0);

      // Module-based progress: the authoritative signal once an admin has
      // defined course_modules for this course and progress has been
      // tracked per module. Falls back to the attendance/lesson-based
      // approximation above when no modules are defined yet.
      const courseModules = course?.course_modules || [];
      const totalModules = courseModules.length;
      const moduleProgressRows = activeEnrollment?.student_module_progress || [];
      const completedModuleIds = new Set(
        moduleProgressRows
          .filter((row: any) => row.status === 'completed')
          .map((row: any) => row.module_id)
      );
      const modulesCompleted = courseModules.filter((module: any) =>
        completedModuleIds.has(module.id)
      ).length;
      const hasModuleData = totalModules > 0;

      const overallProgress = hasModuleData
        ? Math.round((modulesCompleted / totalModules) * 100)
        : Math.min(100, Number(student.progress || progressFromLessons || 0));

      return {
        id: student.student_code || student.id,
        studentId: student.id,
        userId: student.user_id || null,
        email: student.email || null,
        phone: student.phone || null,
        name: student.full_name || t('students.progress.fallback.unnamedStudent'),
        course: course?.course_name || '-',
        batch: batch?.batch_name || '-',
        overallProgress: Math.min(100, overallProgress),
        lessonsCompleted: presentCount,
        totalLessons,
        attendanceRate,
        assignmentsCompleted: completedAssignments,
        totalAssignments: portfolioItems.length,
        averageScore,
        hasModuleData,
        modulesCompleted,
        totalModules,
      };
    });

    setStudents(mappedStudents);
    setLoading(false);
  }

  async function sendProgressReport(student: StudentProgressData) {
    if (!student.userId && !student.email) {
      alert(t('students.progress.error.noContact'));
      return;
    }

    setSendingReportId(student.studentId);

    const scoreSuffix = student.averageScore
      ? t('students.progress.reportMessage.scoreSuffix', { score: student.averageScore })
      : '';

    const message = t('students.progress.reportMessage', {
      name: student.name,
      course: student.course,
      progress: student.overallProgress,
      lessonsCompleted: student.lessonsCompleted,
      totalLessons: student.totalLessons,
      attendanceRate: student.attendanceRate,
      assignmentsCompleted: student.assignmentsCompleted,
      totalAssignments: student.totalAssignments,
      scoreSuffix,
    });

    await notify({
      target: {
        userId: student.userId,
        name: student.name,
        email: student.email,
        phone: student.phone,
      },
      channels: ['in_app', 'email'],
      title: t('students.progress.notificationTitle'),
      message,
      type: 'progress_report',
      relatedModule: 'Student Progress',
      relatedId: student.studentId,
    });

    setSendingReportId(null);
    alert(t('students.progress.reportSent', { name: student.name }));
  }

  const batches = [
    'All Batches',
    ...Array.from(new Set(students.map((student) => student.batch))).filter(
      (batch) => batch && batch !== '-'
    ),
  ];

  const filteredStudents =
    selectedBatch === 'All Batches'
      ? students
      : students.filter((student) => student.batch === selectedBatch);

  const avgProgress =
    students.length > 0
      ? Math.round(
          students.reduce((sum, student) => sum + student.overallProgress, 0) /
            students.length
        )
      : 0;

  const avgAttendance =
    students.length > 0
      ? Math.round(
          students.reduce((sum, student) => sum + student.attendanceRate, 0) /
            students.length
        )
      : 0;

  const avgScore =
    students.length > 0
      ? Math.round(
          students.reduce((sum, student) => sum + student.averageScore, 0) /
            students.length
        )
      : 0;

  const onTrackCount = students.filter(
    (student) => student.overallProgress >= 70
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-[#284342]">
            {t('students.progress.title')}
          </h1>
          <p className="text-[#6b6b6b] mt-1">
            {t('students.progress.subtitle')}
          </p>
        </div>

        <button
          onClick={fetchStudents}
          className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
        >
          <RefreshCw size={18} />
          {t('students.progress.refresh')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <OverviewCard value={`${avgProgress}%`} label={t('students.progress.overview.avgProgress')} color="#284342" />
        <OverviewCard value={`${avgAttendance}%`} label={t('students.progress.overview.avgAttendance')} color="green" />
        <OverviewCard value={onTrackCount.toString()} label={t('students.progress.overview.onTrack')} color="blue" />
        <OverviewCard value={`${avgScore}%`} label={t('students.progress.overview.avgScore')} color="purple" />
      </div>

      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
        <div className="flex items-center gap-4 mb-6">
          <label className="text-sm text-[#284342]">{t('students.progress.filterByBatch')}</label>

          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#284342]"
          >
            {batches.map((batch) => (
              <option key={batch}>{batch === 'All Batches' ? t('students.progress.allBatches') : batch}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {loading && (
            <div className="p-6 text-center text-[#6b6b6b]">
              {t('students.progress.loading')}
            </div>
          )}

          {!loading && filteredStudents.length === 0 && (
            <div className="p-6 text-center text-[#6b6b6b]">
              {t('students.progress.empty')}
            </div>
          )}

          {!loading &&
            filteredStudents.map((student) => (
              <div
                key={student.studentId}
                className="p-6 rounded-xl border border-[rgba(40,67,66,0.1)] hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div>
                    <h3 className="text-lg text-[#284342] mb-1">
                      {student.name}
                    </h3>
                    <p className="text-sm text-[#6b6b6b]">
                      {student.course} • {student.batch}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl text-[#284342]">
                      {student.overallProgress}%
                    </p>
                    <p className="text-xs text-[#6b6b6b]">
                      {t('students.progress.overallProgress')}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#6b6b6b]">
                      {student.hasModuleData
                        ? t('students.progress.completionModules', {
                            completed: student.modulesCompleted,
                            total: student.totalModules,
                          })
                        : t('students.progress.completionEstimate')}
                    </span>
                  </div>

                  <div className="w-full h-3 bg-[#e8e7e2] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#284342] rounded-full transition-all"
                      style={{ width: `${student.overallProgress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <MetricCard
                    icon={<CheckCircle2 size={20} className="text-[#284342]" />}
                    value={
                      student.hasModuleData
                        ? `${student.modulesCompleted}/${student.totalModules}`
                        : student.totalLessons > 0
                        ? `${student.lessonsCompleted}/${student.totalLessons}`
                        : `${student.lessonsCompleted}`
                    }
                    label={student.hasModuleData ? t('students.progress.metric.modules') : t('students.progress.metric.lessons')}
                    color="#284342"
                  />

                  <MetricCard
                    icon={<Clock size={20} className="text-green-700" />}
                    value={`${student.attendanceRate}%`}
                    label={t('students.progress.metric.attendance')}
                    color="green"
                  />

                  <MetricCard
                    icon={<Target size={20} className="text-blue-700" />}
                    value={`${student.assignmentsCompleted}/${student.totalAssignments}`}
                    label={t('students.progress.metric.portfolio')}
                    color="blue"
                  />

                  <MetricCard
                    icon={<Award size={20} className="text-purple-700" />}
                    value={`${student.averageScore}%`}
                    label={t('students.progress.metric.avgScore')}
                    color="purple"
                  />

                  <div className="text-center p-3 rounded-lg bg-[#f8f8f6]">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp
                        size={20}
                        className={
                          student.overallProgress >= 70
                            ? 'text-green-700'
                            : 'text-yellow-700'
                        }
                      />
                    </div>

                    <p
                      className={`text-lg ${
                        student.overallProgress >= 70
                          ? 'text-green-700'
                          : 'text-yellow-700'
                      }`}
                    >
                      {student.overallProgress >= 70
                        ? t('students.progress.status.onTrack')
                        : t('students.progress.status.needsSupport')}
                    </p>

                    <p className="text-xs text-[#6b6b6b]">{t('students.progress.status.label')}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 pt-4 border-t border-[rgba(40,67,66,0.1)]">
                  <Link
                    to={`/app/students/profile/${student.studentId}`}
                    className="px-4 py-2 rounded-lg bg-[#284342] text-[#e9da95] hover:bg-[#1a2f2e] transition-colors text-sm"
                  >
                    {t('students.progress.viewDetails')}
                  </Link>

                  <button
                    onClick={() => sendProgressReport(student)}
                    disabled={sendingReportId === student.studentId}
                    className="px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors text-sm disabled:opacity-50"
                  >
                    {sendingReportId === student.studentId
                      ? t('students.progress.sending')
                      : t('students.progress.sendReport')}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}) {
  const colorClass =
    color === 'green'
      ? 'text-green-700'
      : color === 'blue'
      ? 'text-blue-700'
      : color === 'purple'
      ? 'text-purple-700'
      : 'text-[#284342]';

  return (
    <div className="text-center p-3 rounded-lg bg-[#f8f8f6]">
      <div className="flex items-center justify-center mb-2">{icon}</div>
      <p className={`text-lg ${colorClass}`}>{value}</p>
      <p className="text-xs text-[#6b6b6b]">{label}</p>
    </div>
  );
}

function OverviewCard({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  const colorClass =
    color === 'green'
      ? 'text-green-700'
      : color === 'blue'
      ? 'text-blue-700'
      : color === 'purple'
      ? 'text-purple-700'
      : 'text-[#284342]';

  return (
    <div className="text-center p-4 rounded-lg bg-white border border-[rgba(40,67,66,0.1)]">
      <p className={`text-3xl mb-2 ${colorClass}`}>{value}</p>
      <p className="text-sm text-[#6b6b6b]">{label}</p>
    </div>
  );
}

function getSingle(value: any) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return value;
}
