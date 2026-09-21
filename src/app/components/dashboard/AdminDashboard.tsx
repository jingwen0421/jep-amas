import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Users,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  CreditCard,
  UserPlus,
  PartyPopper,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';

interface TodayClass {
  id: string;
  time: string;
  course: string;
  teacher: string;
  room: string;
  students: number;
}

type ActionType = 'registration' | 'portfolio' | 'event' | 'outstanding';

interface ActionItem {
  id: string;
  type: ActionType;
  description: string;
  link: string;
  icon: React.ReactNode;
  color: string;
}

interface RecentStudent {
  id: string;
  name: string;
  course: string;
  date: string;
}

interface Activity {
  id: string;
  log: any;
  time: string;
}

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [userRole, setUserRole] = useState('admin');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    activeStudents: 0,
    totalExpected: 0,
    totalPaid: 0,
    outstandingFees: 0,
    collectionRate: 0,
    todayLessonsCount: 0,
    totalLessons: 0,
  });
  const [todaysClasses, setTodaysClasses] = useState<TodayClass[]>([]);
  const [pendingActions, setPendingActions] = useState<ActionItem[]>([]);
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'admin';
    setUserRole(role);
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const today = new Date().toISOString().slice(0, 10);

    const [
      studentsRes,
      recentStudentsRes,
      lessonsRes,
      attendanceRes,
      paymentPlansRes,
      applicationsRes,
      portfolioRes,
      eventsRes,
      auditRes,
    ] = await Promise.all([
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),

      supabase
        .from('enrollments')
        .select(`
          id,
          created_at,
          enrollment_status,
          students(id, full_name),
          class_batches(
            courses(course_name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5),

      supabase
        .from('lessons')
        .select(`
          id,
          lesson_title,
          lesson_datetime,
          class_batches(
            batch_name,
            courses(course_name),
            enrollments(id, enrollment_status)
          ),
          teachers(
            specialization,
            users(full_name)
          ),
          classrooms(room_name)
        `)
        .order('lesson_datetime', { ascending: true }),

      supabase
        .from('attendance')
        .select('attendance_status, marked_at'),

      supabase
        .from('payment_plans')
        .select(`
          id,
          final_amount,
          installments(amount, status)
        `),

      supabase
        .from('registration_applications')
        .select(`
          id,
          submitted_at,
          students(full_name, course),
          courses(course_name)
        `)
        .eq('application_status', 'pending')
        .order('submitted_at', { ascending: false })
        .limit(3),

      supabase
        .from('portfolio_items')
        .select('id, title, portfolio_status, submitted_at, students(full_name)')
        .eq('portfolio_status', 'submitted')
        .order('submitted_at', { ascending: false })
        .limit(3),

      supabase
        .from('event_occurrences')
        .select('id, starts_at, status, events(title, event_kind)')
        .eq('status', 'scheduled')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(3),

      supabase
        .from('audit_logs')
        .select('id, action, module, target_id, old_data, new_data, created_at')
        .order('created_at', { ascending: false })
        .limit(6),
    ]);

    const activeStudents = studentsRes.count || 0;
    const lessons = lessonsRes.data || [];

    const todayLessons = lessons.filter((lesson: any) => {
      if (!lesson.lesson_datetime) return false;
      return new Date(lesson.lesson_datetime).toISOString().slice(0, 10) === today;
    });

    const monthAttendance = (attendanceRes.data || []).filter((record: any) => {
      if (!record.marked_at) return false;
      return String(record.marked_at).slice(0, 7) === currentMonth;
    });

    const presentCount = monthAttendance.filter((a: any) =>
      ['present', 'late'].includes(String(a.attendance_status).toLowerCase())
    ).length;

    const attendanceRate =
      monthAttendance.length > 0
        ? Math.round((presentCount / monthAttendance.length) * 100)
        : 0;

    const paymentPlans = paymentPlansRes.data || [];

    const totalExpected = paymentPlans.reduce(
      (sum: number, plan: any) => sum + Number(plan.final_amount || 0),
      0
    );

    const totalPaid = paymentPlans.reduce((sum: number, plan: any) => {
      const paidAmount = (plan.installments || [])
        .filter((item: any) => String(item.status).toLowerCase() === 'paid')
        .reduce((acc: number, item: any) => acc + Number(item.amount || 0), 0);

      return sum + paidAmount;
    }, 0);

    const outstandingFees = Math.max(totalExpected - totalPaid, 0);
    const collectionRate =
      totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;

    setStats({
      activeStudents,
      totalExpected,
      totalPaid,
      outstandingFees,
      collectionRate,
      todayLessonsCount: todayLessons.length,
      totalLessons: lessons.length,
    });

    const actions: ActionItem[] = [];

    (applicationsRes.data || []).forEach((app: any) => {
      actions.push({
        id: `app-${app.id}`,
        type: 'registration',
        description: `${getStudentName(app.students, t)} • ${getApplicationCourse(app)}`,
        link: '/app/students/approval',
        icon: <UserPlus size={18} />,
        color: 'text-[#d4183d]',
      });
    });

    (portfolioRes.data || []).forEach((item: any) => {
      actions.push({
        id: `portfolio-${item.id}`,
        type: 'portfolio',
        description: `${getStudentName(item.students, t)} • ${item.title || t('dashboard.portfolioSubmissionFallback')}`,
        link: '/app/portfolio/feedback',
        icon: <MessageSquare size={18} />,
        color: 'text-blue-700',
      });
    });

    (eventsRes.data || []).forEach((occurrence: any) => {
      const eventInfo = Array.isArray(occurrence.events)
        ? occurrence.events[0]
        : occurrence.events;

      actions.push({
        id: `event-${occurrence.id}`,
        type: 'event',
        description: `${eventInfo?.title || t('dashboard.academyEventFallback')} • ${formatDateTime(occurrence.starts_at)}`,
        link: '/app/events',
        icon: <PartyPopper size={18} />,
        color: 'text-purple-700',
      });
    });

    if (outstandingFees > 0) {
      actions.push({
        id: 'outstanding-fees',
        type: 'outstanding',
        description: t('dashboard.action.outstandingDesc', {
          amount: `RM ${outstandingFees.toLocaleString()}`,
        }),
        link: '/app/payments/outstanding',
        icon: <CreditCard size={18} />,
        color: 'text-[#d4183d]',
      });
    }

    setPendingActions(actions.slice(0, 6));

    setTodaysClasses(
      todayLessons.map((lesson: any) => {
        const enrollments = lesson.class_batches?.enrollments || [];
        const activeEnrollments = enrollments.filter(
          (e: any) => String(e.enrollment_status).toLowerCase() === 'active'
        );

        return {
          id: lesson.id,
          time: new Date(lesson.lesson_datetime).toTimeString().slice(0, 5),
          course:
            lesson.class_batches?.courses?.course_name ||
            lesson.lesson_title ||
            t('dashboard.fallback.class'),
          teacher: getTeacherName(lesson.teachers),
          room: lesson.classrooms?.room_name || '-',
          students: activeEnrollments.length,
        };
      })
    );

    setRecentStudents(
      (recentStudentsRes.data || []).map((enrollment: any) => {
        const student = getSingle(enrollment.students);
        const batch = getSingle(enrollment.class_batches);
        const course = getSingle(batch?.courses);

        return {
          id: student?.id || enrollment.id,
          name: student?.full_name || t('dashboard.fallback.unnamedStudent'),
          course: course?.course_name || '-',
          date: enrollment.created_at
            ? new Date(enrollment.created_at).toISOString().slice(0, 10)
            : '-',
        };
      })
    );

    setActivities(
      (auditRes.data || []).map((log: any) => ({
        id: log.id,
        log,
        time: log.created_at ? new Date(log.created_at).toLocaleString() : '-',
      }))
    );

    setLoading(false);
  }

  const roleTitle =
    userRole === 'owner'
      ? t('dashboard.title.owner')
      : userRole === 'super_admin'
      ? t('dashboard.title.superAdmin')
      : t('dashboard.title.admin');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342] mb-2">{roleTitle}</h1>
        <p className="text-[#6b6b6b]">
          {t('dashboard.welcome')}
        </p>
      </div>

      {loading && (
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
          {t('dashboard.loading')}
        </div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardStatCard
              title={t('dashboard.card.activeStudents')}
              value={stats.activeStudents}
              subtitle={t('dashboard.card.activeStudentsSub')}
              icon={<Users size={24} />}
              color="#284342"
            />
            <DashboardStatCard
              title={t('dashboard.card.revenue')}
              value={`RM ${stats.totalPaid.toLocaleString()}`}
              subtitle={t('dashboard.card.revenueSub', { rate: stats.collectionRate })}
              icon={<DollarSign size={24} />}
              color="#2d8659"
            />
            <DashboardStatCard
              title={t('dashboard.card.outstanding')}
              value={`RM ${stats.outstandingFees.toLocaleString()}`}
              subtitle={t('dashboard.card.outstandingSub')}
              icon={<CreditCard size={24} />}
              color="#d4183d"
            />
            <DashboardStatCard
              title={t('dashboard.card.todayClasses')}
              value={stats.todayLessonsCount}
              subtitle={t('dashboard.card.todayClassesSub', { count: stats.totalLessons })}
              icon={<Calendar size={24} />}
              color="#6b8e8d"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <AlertCircle size={20} className="text-[#d4183d]" />
                <h2 className="text-xl text-[#284342]">{t('dashboard.pendingActions')}</h2>
              </div>

              <div className="space-y-3">
                {pendingActions.length === 0 && (
                  <p className="text-sm text-[#6b6b6b]">
                    {t('dashboard.noUrgentActions')}
                  </p>
                )}

                {pendingActions.map((item) => (
                  <Link
                    key={item.id}
                    to={item.link}
                    className="flex items-start gap-3 p-4 rounded-lg bg-[#f8f8f6] hover:bg-[#e9da95]/20 transition-colors"
                  >
                    <div className={`${item.color} mt-0.5`}>{item.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm text-[#284342]">{t(`dashboard.action.${item.type}`)}</p>
                      <p className="text-xs text-[#6b6b6b] mt-1">
                        {item.description}
                      </p>
                    </div>
                    <span className="text-xs text-[#284342]">{t('dashboard.open')}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
              <h2 className="text-xl text-[#284342] mb-6">{t('dashboard.revenueSnapshot')}</h2>

              <div className="space-y-4">
                <RevenueLine
                  label={t('dashboard.totalExpected')}
                  value={`RM ${stats.totalExpected.toLocaleString()}`}
                  color="text-[#284342]"
                />
                <RevenueLine
                  label={t('dashboard.paid')}
                  value={`RM ${stats.totalPaid.toLocaleString()}`}
                  color="text-green-700"
                />
                <RevenueLine
                  label={t('dashboard.outstanding')}
                  value={`RM ${stats.outstandingFees.toLocaleString()}`}
                  color="text-[#d4183d]"
                />
                <RevenueLine
                  label={t('dashboard.collectionRate')}
                  value={`${stats.collectionRate}%`}
                  color="text-[#284342]"
                />

                <div className="w-full h-3 bg-[#f8f8f6] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#284342]"
                    style={{ width: `${stats.collectionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardPanel
              title={t('dashboard.todaysClasses')}
              actionLabel={t('dashboard.viewCalendar')}
              actionLink="/app/calendar"
            >
              <div className="space-y-4">
                {todaysClasses.length === 0 && (
                  <p className="text-sm text-[#6b6b6b]">{t('dashboard.noClassesToday')}</p>
                )}

                {todaysClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-[#f8f8f6]"
                  >
                    <div className="flex flex-col items-center">
                      <Clock size={20} className="text-[#284342] mb-1" />
                      <span className="text-xs text-[#6b6b6b]">{cls.time}</span>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-sm text-[#284342] mb-1">
                        {cls.course}
                      </h3>
                      <p className="text-xs text-[#6b6b6b]">
                        {cls.teacher} • {cls.room} • {cls.students} {t('dashboard.activeStudentsSuffix')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel
              title={t('dashboard.recentStudents')}
              actionLabel={t('dashboard.viewStudents')}
              actionLink="/app/students/list"
            >
              <div className="space-y-3">
                {recentStudents.length === 0 && (
                  <p className="text-sm text-[#6b6b6b]">{t('dashboard.noRecentStudents')}</p>
                )}

                {recentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="p-4 rounded-lg bg-[#f8f8f6] flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm text-[#284342]">{student.name}</p>
                      <p className="text-xs text-[#6b6b6b] mt-1">
                        {student.course}
                      </p>
                    </div>
                    <span className="text-xs text-[#6b6b6b]">{student.date}</span>
                  </div>
                ))}
              </div>
            </DashboardPanel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardPanel
              title={t('dashboard.recentActivities')}
              actionLabel={t('dashboard.viewLogs')}
              actionLink="/app/audit"
            >
              <div className="space-y-3">
                {activities.length === 0 && (
                  <p className="text-sm text-[#6b6b6b]">{t('dashboard.noRecentActivities')}</p>
                )}

                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 rounded-lg border border-[rgba(40,67,66,0.1)]"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm text-[#284342]">
                        {getReadableActivity(activity.log, t)}
                      </p>
                      <span className="text-xs text-[#6b6b6b]">
                        {activity.log.module || '-'}
                      </span>
                    </div>
                    <p className="text-xs text-[#6b6b6b] mt-2">
                      {activity.time}
                    </p>
                  </div>
                ))}
              </div>
            </DashboardPanel>

            <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
              <h2 className="text-xl text-[#284342] mb-4">{t('dashboard.quickActions')}</h2>

              <div className="grid grid-cols-2 gap-4">
                <QuickAction to="/app/students/registration" icon={<Users size={24} />} label={t('dashboard.quickAction.newStudent')} />
                <QuickAction to="/app/students/approval" icon={<AlertCircle size={24} />} label={t('dashboard.quickAction.reviewApplications')} />
                <QuickAction to="/app/payments/installments" icon={<DollarSign size={24} />} label={t('dashboard.quickAction.recordPayment')} />
                <QuickAction to="/app/attendance/daily" icon={<CheckCircle2 size={24} />} label={t('dashboard.quickAction.takeAttendance')} />
                <QuickAction to="/app/portfolio/feedback" icon={<MessageSquare size={24} />} label={t('dashboard.quickAction.reviewPortfolio')} />
                <QuickAction to="/app/events" icon={<PartyPopper size={24} />} label={t('dashboard.quickAction.manageEvents')} />
                <QuickAction to="/app/reports" icon={<FileText size={24} />} label={t('dashboard.quickAction.reports')} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DashboardStatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] hover:shadow-lg transition-shadow">
      <div
        className="p-3 rounded-lg inline-block mb-4"
        style={{ backgroundColor: `${color}15` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>

      <h3 className="text-sm text-[#6b6b6b] mb-1">{title}</h3>
      <p className="text-2xl text-[#284342]">{value}</p>
      <p className="text-xs text-[#6b6b6b] mt-2">{subtitle}</p>
    </div>
  );
}

function DashboardPanel({
  title,
  actionLabel,
  actionLink,
  children,
}: {
  title: string;
  actionLabel: string;
  actionLink: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl text-[#284342]">{title}</h2>
        <Link to={actionLink} className="text-sm text-[#284342] hover:underline">
          {actionLabel}
        </Link>
      </div>
      {children}
    </div>
  );
}

function RevenueLine({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#6b6b6b]">{label}</span>
      <span className={`text-lg ${color}`}>{value}</span>
    </div>
  );
}

function QuickAction({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="p-4 rounded-lg border border-[rgba(40,67,66,0.1)] hover:border-[#e9da95] hover:bg-[#e9da95]/10 transition-colors text-center"
    >
      <div className="mx-auto mb-2 text-[#284342] flex justify-center">
        {icon}
      </div>
      <span className="text-sm text-[#284342]">{label}</span>
    </Link>
  );
}

function getSingle(value: any) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

function getTeacherName(teacher: any) {
  if (!teacher) return '-';

  const actualTeacher = getSingle(teacher);
  const user = getSingle(actualTeacher?.users);

  return user?.full_name || actualTeacher?.specialization || '-';
}

function getStudentName(student: any, t: (key: string) => string) {
  const actualStudent = getSingle(student);
  return actualStudent?.full_name || t('dashboard.fallback.unnamedStudent');
}

function getApplicationCourse(app: any) {
  const course = getSingle(app.courses);
  if (course?.course_name) return course.course_name;

  const student = getSingle(app.students);
  return student?.course || '-';
}

function formatDateTime(value: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function getReadableActivity(log: any, t: (key: string, params?: Record<string, string | number>) => string) {
  const action = log.action || 'System action';
  const module = log.module || 'System';
  const newData = log.new_data || {};

  if (action === 'Portfolio Submitted') {
    return t('dashboard.activity.portfolioSubmitted', {
      title: newData.title || t('dashboard.fallback.portfolio'),
    });
  }

  if (action === 'Portfolio Approved') {
    return t('dashboard.activity.portfolioApproved', {
      assignment: newData.assignment || t('dashboard.fallback.portfolio'),
      student: newData.student || t('dashboard.fallback.student'),
    });
  }

  if (action === 'Portfolio Revision Requested') {
    return t('dashboard.activity.portfolioRevision', {
      assignment: newData.assignment || t('dashboard.fallback.assignment'),
    });
  }

  if (action === 'Document Uploaded') {
    return t('dashboard.activity.documentUploaded', {
      file: newData.file_name || t('dashboard.fallback.document'),
    });
  }

  if (action === 'Completion Certificate Issued') {
    return t('dashboard.activity.completionCertIssued', {
      student: newData.student || t('dashboard.fallback.student'),
    });
  }

  if (action === 'Full Attendance Certificate Issued') {
    return t('dashboard.activity.attendanceCertIssued', {
      student: newData.student || t('dashboard.fallback.student'),
    });
  }

  if (action === 'Logged In') return t('dashboard.activity.loggedIn');
  if (action === 'Updated Settings') return t('dashboard.activity.settingsUpdated');
  if (action === 'Viewed User Management') return t('dashboard.activity.userMgmtViewed');

  if (module === 'Payments') return t('dashboard.activity.paymentUpdated');
  if (module === 'Attendance') return t('dashboard.activity.attendanceUpdated');
  if (module === 'Portfolio') return t('dashboard.activity.portfolioActivity');
  if (module === 'Certificates') return t('dashboard.activity.certificateActivity');
  if (module === 'Student Management') return t('dashboard.activity.studentUpdated');

  return action;
}