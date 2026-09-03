import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Calendar,
  Clock,
  CreditCard,
  CheckCircle2,
  BookOpen,
  Award,
  MessageSquare,
  PartyPopper,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../utils/session';
import { getCurrentStudentId } from '../../utils/studentAccess';

interface UpcomingClass {
  id: string;
  title: string;
  datetime: string;
  teacher: string;
  room: string;
}

interface ModuleProgress {
  id: string;
  title: string;
  status: string;
  sequence: number;
}

export default function StudentDashboard() {
  const currentUser = getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState('');

  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [modules, setModules] = useState<ModuleProgress[]>([]);
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [outstanding, setOutstanding] = useState(0);
  const [pendingActions, setPendingActions] = useState<
    { id: string; title: string; description: string; link: string }[]
  >([]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);

    const id = await getCurrentStudentId();
    setStudentId(id);

    if (!id) {
      setLoading(false);
      return;
    }

    const now = new Date().toISOString();

    const enrollmentRows = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', id);

    const enrollmentIds = (enrollmentRows.data || []).map((e: any) => e.id);

    const [participantsRes, attendanceRes, plansRes, progressRes, portfolioRes] =
      await Promise.all([
        supabase
          .from('lesson_participants')
          .select(`
            id,
            lessons(
              id,
              lesson_title,
              lesson_datetime,
              teachers(specialization, users(full_name)),
              classrooms(room_name),
              course_modules(title)
            )
          `)
          .eq('student_id', id),

        supabase
          .from('attendance')
          .select('attendance_status')
          .eq('student_id', id),

        supabase
          .from('payment_plans')
          .select(`id, final_amount, installments(amount, status)`)
          .eq('student_id', id),

        enrollmentIds.length > 0
          ? supabase
              .from('student_module_progress')
              .select(`id, status, course_modules(title, sequence)`)
              .in('enrollment_id', enrollmentIds)
          : Promise.resolve({ data: [] as any[] }),

        supabase
          .from('portfolio_items')
          .select('id, portfolio_status')
          .eq('student_id', id)
          .eq('portfolio_status', 'revision_requested'),
      ]);

    const participants = (participantsRes.data || [])
      .map((p: any) => getSingle(p.lessons))
      .filter((lesson: any) => lesson && lesson.lesson_datetime >= now)
      .sort(
        (a: any, b: any) =>
          new Date(a.lesson_datetime).getTime() - new Date(b.lesson_datetime).getTime()
      )
      .slice(0, 5);

    setUpcomingClasses(
      participants.map((lesson: any) => {
        const teacher = getSingle(lesson.teachers);
        const teacherUser = getSingle(teacher?.users);
        const module = getSingle(lesson.course_modules);
        const room = getSingle(lesson.classrooms);

        return {
          id: lesson.id,
          title: module?.title || lesson.lesson_title || 'Class',
          datetime: lesson.lesson_datetime,
          teacher: teacherUser?.full_name || teacher?.specialization || '-',
          room: room?.room_name || '-',
        };
      })
    );

    const attendanceRows = attendanceRes.data || [];
    const presentCount = attendanceRows.filter((a: any) =>
      ['present', 'late'].includes(String(a.attendance_status).toLowerCase())
    ).length;
    setAttendanceRate(
      attendanceRows.length > 0
        ? Math.round((presentCount / attendanceRows.length) * 100)
        : 0
    );

    const plans = plansRes.data || [];
    const totalExpected = plans.reduce(
      (sum: number, p: any) => sum + Number(p.final_amount || 0),
      0
    );
    const totalPaid = plans.reduce((sum: number, p: any) => {
      const paid = (p.installments || [])
        .filter((i: any) => String(i.status).toLowerCase() === 'paid')
        .reduce((acc: number, i: any) => acc + Number(i.amount || 0), 0);
      return sum + paid;
    }, 0);
    setOutstanding(Math.max(totalExpected - totalPaid, 0));

    const progressRows = (progressRes?.data || []) as any[];
    setModules(
      progressRows
        .map((row: any) => {
          const module = getSingle(row.course_modules);
          return {
            id: row.id,
            title: module?.title || 'Module',
            status: row.status,
            sequence: module?.sequence || 0,
          };
        })
        .sort((a: any, b: any) => a.sequence - b.sequence)
    );

    const actions: { id: string; title: string; description: string; link: string }[] =
      [];

    if (Math.max(totalExpected - totalPaid, 0) > 0) {
      actions.push({
        id: 'outstanding',
        title: 'Outstanding Balance',
        description: `RM ${Math.max(totalExpected - totalPaid, 0).toLocaleString()} due`,
        link: '/app/payments/outstanding',
      });
    }

    (portfolioRes.data || []).forEach((item: any) => {
      actions.push({
        id: `portfolio-${item.id}`,
        title: 'Portfolio Needs Revision',
        description: 'A teacher requested changes to your submission',
        link: '/app/portfolio/submissions',
      });
    });

    setPendingActions(actions);
    setLoading(false);
  }

  const completedModules = modules.filter((m) => m.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">My Dashboard</h1>
        <p className="text-[#6b6b6b] mt-1">Welcome back, {currentUser.name}</p>
      </div>

      {loading && (
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
          Loading your dashboard...
        </div>
      )}

      {!loading && !studentId && (
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
          We couldn't find a student profile linked to your account. Please contact
          the academy.
        </div>
      )}

      {!loading && studentId && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={<Calendar size={24} />}
              color="#284342"
              label="Upcoming Classes"
              value={upcomingClasses.length}
              subtitle="Scheduled sessions"
            />
            <StatCard
              icon={<CheckCircle2 size={24} />}
              color="#2d8659"
              label="Attendance Rate"
              value={`${attendanceRate}%`}
              subtitle="Overall attendance"
            />
            <StatCard
              icon={<CreditCard size={24} />}
              color="#d4183d"
              label="Outstanding Balance"
              value={`RM ${outstanding.toLocaleString()}`}
              subtitle="Remaining fees"
            />
            <StatCard
              icon={<BookOpen size={24} />}
              color="#6b8e8d"
              label="Modules Completed"
              value={`${completedModules}/${modules.length}`}
              subtitle="Course progress"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel title="My Upcoming Classes" actionLabel="View Calendar" actionLink="/app/calendar">
              <div className="space-y-3">
                {upcomingClasses.length === 0 && (
                  <p className="text-sm text-[#6b6b6b]">No upcoming classes scheduled.</p>
                )}
                {upcomingClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-[#f8f8f6]"
                  >
                    <Clock size={18} className="text-[#284342] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-[#284342]">{cls.title}</p>
                      <p className="text-xs text-[#6b6b6b] mt-1">
                        {new Date(cls.datetime).toLocaleString()} • {cls.teacher} •{' '}
                        {cls.room}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Pending Actions" actionLabel="Notifications" actionLink="/app/notifications">
              <div className="space-y-3">
                {pendingActions.length === 0 && (
                  <p className="text-sm text-[#6b6b6b]">Nothing needs your attention.</p>
                )}
                {pendingActions.map((action) => (
                  <Link
                    key={action.id}
                    to={action.link}
                    className="flex items-start gap-3 p-4 rounded-lg bg-[#f8f8f6] hover:bg-[#e9da95]/20 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-[#284342]">{action.title}</p>
                      <p className="text-xs text-[#6b6b6b] mt-1">{action.description}</p>
                    </div>
                    <span className="text-xs text-[#284342]">Open</span>
                  </Link>
                ))}
              </div>
            </Panel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel title="Course Modules" actionLabel="View Progress" actionLink="/app/students/progress">
              <div className="space-y-2">
                {modules.length === 0 && (
                  <p className="text-sm text-[#6b6b6b]">No modules assigned yet.</p>
                )}
                {modules.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-[rgba(40,67,66,0.1)]"
                  >
                    <span className="text-sm text-[#284342]">{m.title}</span>
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        m.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : m.status === 'in_progress'
                          ? 'bg-[#e9da95]/40 text-[#284342]'
                          : 'bg-gray-100 text-[#6b6b6b]'
                      }`}
                    >
                      {formatStatus(m.status)}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
              <h2 className="text-xl text-[#284342] mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <QuickAction to="/app/events" icon={<PartyPopper size={22} />} label="My Events" />
                <QuickAction to="/app/portfolio/submissions" icon={<MessageSquare size={22} />} label="My Portfolio" />
                <QuickAction to="/app/payments/outstanding" icon={<CreditCard size={22} />} label="My Payments" />
                <QuickAction to="/app/certificates/completion" icon={<Award size={22} />} label="Certificates" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  color,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] hover:shadow-lg transition-shadow">
      <div
        className="p-3 rounded-lg inline-block mb-4"
        style={{ backgroundColor: `${color}15` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <h3 className="text-sm text-[#6b6b6b] mb-1">{label}</h3>
      <p className="text-2xl text-[#284342]">{value}</p>
      <p className="text-xs text-[#6b6b6b] mt-2">{subtitle}</p>
    </div>
  );
}

function Panel({
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

function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="p-4 rounded-lg border border-[rgba(40,67,66,0.1)] hover:border-[#e9da95] hover:bg-[#e9da95]/10 transition-colors text-center"
    >
      <div className="mx-auto mb-2 text-[#284342] flex justify-center">{icon}</div>
      <span className="text-sm text-[#284342]">{label}</span>
    </Link>
  );
}

function getSingle(value: any) {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

function formatStatus(status: string) {
  return String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
