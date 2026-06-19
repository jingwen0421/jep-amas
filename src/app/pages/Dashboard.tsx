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
  History,
  MessageSquare,
  CreditCard,
  UserPlus,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardCard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}

interface TodayClass {
  id: string;
  time: string;
  course: string;
  teacher: string;
  room: string;
  students: number;
}

interface ActionItem {
  id: string;
  title: string;
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
  message: string;
  module: string;
  time: string;
}

export default function Dashboard() {
  const [userRole, setUserRole] = useState('admin');
  const [loading, setLoading] = useState(true);

  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [todaysClasses, setTodaysClasses] = useState<TodayClass[]>([]);
  const [pendingActions, setPendingActions] = useState<ActionItem[]>([]);
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [revenueSnapshot, setRevenueSnapshot] = useState({
    paid: 0,
    outstanding: 0,
    collectionRate: 0,
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'admin';
    setUserRole(role);
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);

    const [
      studentsRes,
      recentStudentsRes,
      lessonsRes,
      attendanceRes,
      paymentPlansRes,
      applicationsRes,
      portfolioRes,
      appointmentsRes,
      auditRes,
    ] = await Promise.all([
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),

      supabase
        .from('students')
        .select('id, full_name, course, created_at')
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
            enrollments(id)
          ),
          teachers(
            specialization,
            users(full_name)
          ),
          classrooms(room_name)
        `)
        .order('lesson_datetime', { ascending: true }),

      supabase.from('attendance').select('attendance_status'),

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
        .from('appointments')
        .select('id, appointment_datetime, appointment_status, students(full_name)')
        .eq('appointment_status', 'pending')
        .order('appointment_datetime', { ascending: true })
        .limit(3),

      supabase
        .from('audit_logs')
        .select('id, action, module, target_id, old_data, new_data, created_at')
        .order('created_at', { ascending: false })
        .limit(6),
    ]);

    const activeStudents = studentsRes.count || 0;
    const lessons = lessonsRes.data || [];
    const activeClasses = lessons.length;

    const today = new Date().toISOString().slice(0, 10);
    const todayLessons = lessons.filter((lesson: any) => {
      if (!lesson.lesson_datetime) return false;
      return new Date(lesson.lesson_datetime).toISOString().slice(0, 10) === today;
    });

    const attendanceRecords = attendanceRes.data || [];
    const presentCount = attendanceRecords.filter(
      (a: any) => a.attendance_status === 'present' || a.attendance_status === 'late'
    ).length;

    const attendanceRate =
      attendanceRecords.length > 0
        ? Math.round((presentCount / attendanceRecords.length) * 100)
        : 0;

    const paymentPlans = paymentPlansRes.data || [];

    const totalFinalAmount = paymentPlans.reduce(
      (sum: number, plan: any) => sum + Number(plan.final_amount || 0),
      0
    );

    const totalPaid = paymentPlans.reduce((sum: number, plan: any) => {
      const installments = plan.installments || [];
      const paidAmount = installments
        .filter((item: any) => String(item.status).toLowerCase() === 'paid')
        .reduce((acc: number, item: any) => acc + Number(item.amount || 0), 0);

      return sum + paidAmount;
    }, 0);

    const outstandingFees = Math.max(totalFinalAmount - totalPaid, 0);
    const collectionRate =
      totalFinalAmount > 0 ? Math.round((totalPaid / totalFinalAmount) * 100) : 0;

    setRevenueSnapshot({
      paid: totalPaid,
      outstanding: outstandingFees,
      collectionRate,
    });

    setCards([
      {
        title: 'Active Students',
        value: activeStudents,
        subtitle: 'Currently active learners',
        icon: <Users size={24} />,
        color: '#284342',
      },
      {
        title: 'Revenue Collected',
        value: `RM ${totalPaid.toLocaleString()}`,
        subtitle: `${collectionRate}% collection rate`,
        icon: <DollarSign size={24} />,
        color: '#2d8659',
      },
      {
        title: 'Attendance Rate',
        value: `${attendanceRate}%`,
        subtitle: `${attendanceRecords.length} attendance records`,
        icon: <CheckCircle2 size={24} />,
        color: '#6b8e8d',
      },
      {
        title: 'Active Classes',
        value: activeClasses,
        subtitle: `${todayLessons.length} scheduled today`,
        icon: <Calendar size={24} />,
        color: '#d4183d',
      },
    ]);

    const actions: ActionItem[] = [];

    (applicationsRes.data || []).forEach((app: any) => {
      actions.push({
        id: `app-${app.id}`,
        title: 'Registration Approval Needed',
        description: `${getStudentName(app.students)} • ${getApplicationCourse(app)}`,
        link: '/app/students/approval',
        icon: <UserPlus size={18} />,
        color: 'text-[#d4183d]',
      });
    });

    (portfolioRes.data || []).forEach((item: any) => {
      actions.push({
        id: `portfolio-${item.id}`,
        title: 'Portfolio Awaiting Review',
        description: `${getStudentName(item.students)} • ${item.title || 'Portfolio Submission'}`,
        link: '/app/portfolio/feedback',
        icon: <MessageSquare size={18} />,
        color: 'text-blue-700',
      });
    });

    (appointmentsRes.data || []).forEach((appt: any) => {
      actions.push({
        id: `appt-${appt.id}`,
        title: 'Appointment Pending',
        description: `${getStudentName(appt.students)} • ${formatDateTime(appt.appointment_datetime)}`,
        link: '/app/appointments/calendar',
        icon: <Calendar size={18} />,
        color: 'text-yellow-700',
      });
    });

    if (outstandingFees > 0) {
      actions.push({
        id: 'outstanding-fees',
        title: 'Outstanding Payments',
        description: `RM ${outstandingFees.toLocaleString()} still unpaid`,
        link: '/app/payments/outstanding',
        icon: <CreditCard size={18} />,
        color: 'text-[#d4183d]',
      });
    }

    setPendingActions(actions.slice(0, 6));

    setTodaysClasses(
      todayLessons.map((lesson: any) => ({
        id: lesson.id,
        time: new Date(lesson.lesson_datetime).toTimeString().slice(0, 5),
        course:
          lesson.class_batches?.courses?.course_name ||
          lesson.lesson_title ||
          'Class',
        teacher: getTeacherName(lesson.teachers),
        room: lesson.classrooms?.room_name || '-',
        students: lesson.class_batches?.enrollments?.length || 0,
      }))
    );

    setRecentStudents(
      (recentStudentsRes.data || []).map((student: any) => ({
        id: student.id,
        name: student.full_name || 'Unnamed Student',
        course: student.course || '-',
        date: student.created_at
          ? new Date(student.created_at).toISOString().slice(0, 10)
          : '-',
      }))
    );

    setActivities(
      (auditRes.data || []).map((log: any) => ({
        id: log.id,
        message: getReadableActivity(log),
        module: log.module || '-',
        time: log.created_at ? new Date(log.created_at).toLocaleString() : '-',
      }))
    );

    setLoading(false);
  }

  const roleTitle =
    userRole === 'owner'
      ? 'Owner Dashboard'
      : userRole === 'super_admin'
      ? 'Super Admin Dashboard'
      : 'Admin Dashboard';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342] mb-2">{roleTitle}</h1>
        <p className="text-[#6b6b6b]">
          Welcome back to JEP Image Makeup Academy
        </p>
      </div>

      {loading && (
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
          Loading dashboard...
        </div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card) => (
              <DashboardStatCard key={card.title} card={card} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <AlertCircle size={20} className="text-[#d4183d]" />
                <h2 className="text-xl text-[#284342]">Pending Actions</h2>
              </div>

              <div className="space-y-3">
                {pendingActions.length === 0 && (
                  <p className="text-sm text-[#6b6b6b]">
                    No urgent actions right now.
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
                      <p className="text-sm text-[#284342]">{item.title}</p>
                      <p className="text-xs text-[#6b6b6b] mt-1">
                        {item.description}
                      </p>
                    </div>
                    <span className="text-xs text-[#284342]">Open</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
              <h2 className="text-xl text-[#284342] mb-6">Revenue Snapshot</h2>

              <div className="space-y-4">
                <RevenueLine
                  label="Paid"
                  value={`RM ${revenueSnapshot.paid.toLocaleString()}`}
                  color="text-green-700"
                />
                <RevenueLine
                  label="Outstanding"
                  value={`RM ${revenueSnapshot.outstanding.toLocaleString()}`}
                  color="text-[#d4183d]"
                />
                <RevenueLine
                  label="Collection Rate"
                  value={`${revenueSnapshot.collectionRate}%`}
                  color="text-[#284342]"
                />

                <div className="w-full h-3 bg-[#f8f8f6] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#284342]"
                    style={{ width: `${revenueSnapshot.collectionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardPanel
              title="Today's Classes"
              actionLabel="View Calendar"
              actionLink="/app/classes/calendar"
            >
              <div className="space-y-4">
                {todaysClasses.length === 0 && (
                  <p className="text-sm text-[#6b6b6b]">No classes today.</p>
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
                        {cls.teacher} • {cls.room} • {cls.students} students
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel
              title="Recent Students"
              actionLabel="View Students"
              actionLink="/app/students/list"
            >
              <div className="space-y-3">
                {recentStudents.length === 0 && (
                  <p className="text-sm text-[#6b6b6b]">No recent students.</p>
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
              title="Recent Activities"
              actionLabel="View Logs"
              actionLink="/app/audit"
            >
              <div className="space-y-3">
                {activities.length === 0 && (
                  <p className="text-sm text-[#6b6b6b]">No recent activities.</p>
                )}

                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 rounded-lg border border-[rgba(40,67,66,0.1)]"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm text-[#284342]">
                        {activity.message}
                      </p>
                      <span className="text-xs text-[#6b6b6b]">
                        {activity.module}
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
              <h2 className="text-xl text-[#284342] mb-4">Quick Actions</h2>

              <div className="grid grid-cols-2 gap-4">
                <QuickAction to="/app/students/registration" icon={<Users size={24} />} label="New Student" />
                <QuickAction to="/app/students/approval" icon={<AlertCircle size={24} />} label="Review Applications" />
                <QuickAction to="/app/attendance/daily" icon={<CheckCircle2 size={24} />} label="Take Attendance" />
                <QuickAction to="/app/payments/installments" icon={<DollarSign size={24} />} label="Record Payment" />
                <QuickAction to="/app/portfolio/feedback" icon={<MessageSquare size={24} />} label="Review Portfolio" />
                <QuickAction to="/app/reports" icon={<FileText size={24} />} label="Reports" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DashboardStatCard({ card }: { card: DashboardCard }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] hover:shadow-lg transition-shadow">
      <div
        className="p-3 rounded-lg inline-block mb-4"
        style={{ backgroundColor: `${card.color}15` }}
      >
        <div style={{ color: card.color }}>{card.icon}</div>
      </div>

      <h3 className="text-sm text-[#6b6b6b] mb-1">{card.title}</h3>
      <p className="text-2xl text-[#284342]">{card.value}</p>
      <p className="text-xs text-[#6b6b6b] mt-2">{card.subtitle}</p>
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

function getTeacherName(teacher: any) {
  if (!teacher) return '-';

  const actualTeacher = Array.isArray(teacher) ? teacher[0] : teacher;
  const user = Array.isArray(actualTeacher?.users)
    ? actualTeacher.users[0]
    : actualTeacher?.users;

  return user?.full_name || actualTeacher?.specialization || '-';
}

function getStudentName(student: any) {
  if (!student) return 'Unnamed Student';
  if (Array.isArray(student)) return student[0]?.full_name || 'Unnamed Student';
  return student.full_name || 'Unnamed Student';
}

function getApplicationCourse(app: any) {
  const course = Array.isArray(app.courses) ? app.courses[0] : app.courses;
  if (course?.course_name) return course.course_name;

  const student = Array.isArray(app.students) ? app.students[0] : app.students;
  return student?.course || '-';
}

function formatDateTime(value: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function getReadableActivity(log: any) {
  const action = log.action || 'System action';
  const module = log.module || 'System';

  if (action === 'Logged In') return 'User logged in';
  if (action === 'Updated Settings') return 'Academy settings updated';
  if (action === 'Viewed User Management') return 'User management viewed';
  if (action === 'Demo Action') return 'Demo audit activity added';

  if (module === 'Payments') return 'Payment record updated';
  if (module === 'Attendance') return 'Attendance record updated';
  if (module === 'Portfolio') return 'Portfolio activity recorded';
  if (module === 'Certificates') return 'Certificate activity recorded';
  if (module === 'Student Management') return 'Student record updated';

  return action;
}