import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Users,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardCard {
  title: string;
  value: string | number;
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

interface PaymentDue {
  id: string;
  student: string;
  amount: string;
  course: string;
  dueDate: string;
}

interface PendingApproval {
  id: string;
  name: string;
  course: string;
  date: string;
}

export default function Dashboard() {
  const [userRole, setUserRole] = useState('admin');
  const [loading, setLoading] = useState(true);

  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [todaysClasses, setTodaysClasses] = useState<TodayClass[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [paymentsDueThisWeek, setPaymentsDueThisWeek] = useState<PaymentDue[]>([]);

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'admin';
    setUserRole(role);
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);

    const [
      studentsRes,
      lessonsRes,
      attendanceRes,
      paymentPlansRes,
      installmentsRes,
      applicationsRes,
      
    ] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', 'active'),

      supabase
        .from('lessons')
        .select(`
          id,
          lesson_title,
          lesson_datetime,
          duration_minutes,
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
        .from('installments')
        .select(`
          id,
          amount,
          due_date,
          status,
          payment_plans(
            students(full_name),
            enrollments(
              class_batches(
                courses(course_name)
              )
            )
          )
        `)
        .neq('status', 'paid')
        .order('due_date', { ascending: true }),

     supabase
      .from('registration_applications')
      .select(`
        id,
        application_status,
        submitted_at,
        students(full_name, course),
        courses(course_name)
      `)
      .eq('application_status', 'pending')
      .order('submitted_at', { ascending: false }),
    ]);

    const activeStudents = studentsRes.count || 0;

    const lessons = lessonsRes.data || [];
    const today = new Date().toISOString().slice(0, 10);

    const todayLessons = lessons.filter((lesson: any) => {
      if (!lesson.lesson_datetime) return false;
      return new Date(lesson.lesson_datetime).toISOString().slice(0, 10) === today;
    });

    const activeClasses = lessons.length;

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
        .filter((item: any) => item.status === 'paid')
        .reduce((acc: number, item: any) => acc + Number(item.amount || 0), 0);

      return sum + paidAmount;
    }, 0);

    const outstandingFees = Math.max(totalFinalAmount - totalPaid, 0);

    setCards([
      {
        title: 'Active Students',
        value: activeStudents,
        icon: <Users size={24} />,
        color: '#284342',
      },
      {
        title: 'Active Classes',
        value: activeClasses,
        icon: <Calendar size={24} />,
        color: '#6b8e8d',
      },
      {
        title: 'Outstanding Fees',
        value: `RM ${outstandingFees.toLocaleString()}`,
        icon: <DollarSign size={24} />,
        color: '#d4183d',
      },
      {
        title: 'Attendance Rate',
        value: `${attendanceRate}%`,
        icon: <CheckCircle2 size={24} />,
        color: '#2d8659',
      },
    ]);

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

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().slice(0, 10);

    const duePayments = (installmentsRes.data || []).filter((item: any) => {
      return item.due_date && item.due_date <= nextWeekStr;
    });

    setPaymentsDueThisWeek(
      duePayments.map((item: any) => {
        const plan = Array.isArray(item.payment_plans)
          ? item.payment_plans[0]
          : item.payment_plans;

        return {
          id: item.id,
          student: getStudentName(plan?.students),
          amount: `RM ${Number(item.amount || 0).toLocaleString()}`,
          course: getCourseNameFromEnrollment(plan?.enrollments),
          dueDate: item.due_date,
        };
      })
    );

    setPendingApprovals(
      (applicationsRes.data || []).map((app: any) => ({
        id: app.id,
        name: getStudentName(app.students),
        course: getApplicationCourse(app),
        date: app.submitted_at
          ? new Date(app.submitted_at).toISOString().slice(0, 10)
          : '-',
      }))
    );
    console.log('USER ROLE:', userRole);
    console.log('APPLICATIONS:', applicationsRes.data);
    console.log('APPLICATION ERROR:', applicationsRes.error);

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342] mb-2">
          {userRole === 'owner' ? 'Owner Dashboard' : 'Admin Dashboard'}
        </h1>
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
              <div
                key={card.title}
                className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${card.color}15` }}
                  >
                    <div style={{ color: card.color }}>{card.icon}</div>
                  </div>
                </div>

                <h3 className="text-sm text-[#6b6b6b] mb-1">{card.title}</h3>
                <p className="text-2xl text-[#284342]">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl text-[#284342]">Today's Classes</h2>
                <Link
                  to="/app/classes/calendar"
                  className="text-sm text-[#284342] hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-4">
                {todaysClasses.length === 0 && (
                  <p className="text-sm text-[#6b6b6b]">No classes today.</p>
                )}

                {todaysClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-[#f8f8f6] hover:bg-[#e9da95]/20 transition-colors"
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
            </div>

            {(userRole === 'admin' || userRole === 'super_admin') && (
              <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl text-[#284342]">Pending Approvals</h2>
                    <span className="bg-[#d4183d] text-white text-xs px-2 py-1 rounded-full">
                      {pendingApprovals.length}
                    </span>
                  </div>

                  <Link
                    to="/app/students/approval"
                    className="text-sm text-[#284342] hover:underline"
                  >
                    Review All
                  </Link>
                </div>

                <div className="space-y-3">
                  {pendingApprovals.length === 0 && (
                    <p className="text-sm text-[#6b6b6b]">
                      No pending approvals.
                    </p>
                  )}

                  {pendingApprovals.map((approval) => (
                    <div
                      key={approval.id}
                      className="p-4 rounded-lg border border-[rgba(40,67,66,0.1)] hover:border-[#e9da95] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm text-[#284342]">
                          {approval.name}
                        </h3>
                        <AlertCircle size={16} className="text-[#d4183d]" />
                      </div>
                      <p className="text-xs text-[#6b6b6b] mb-2">
                        {approval.course}
                      </p>
                      <p className="text-xs text-[#6b6b6b]">
                        Applied: {approval.date}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(userRole === 'finance' ||
              userRole === 'admin' ||
              userRole === 'super_admin' ||
              userRole === 'owner') && (
              <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl text-[#284342]">
                    Payments Due This Week
                  </h2>

                  <Link
                    to="/app/payments/outstanding"
                    className="text-sm text-[#284342] hover:underline"
                  >
                    View All
                  </Link>
                </div>

                <div className="space-y-3">
                  {paymentsDueThisWeek.length === 0 && (
                    <p className="text-sm text-[#6b6b6b]">
                      No payments due this week.
                    </p>
                  )}

                  {paymentsDueThisWeek.map((payment) => (
                    <div
                      key={payment.id}
                      className="p-4 rounded-lg border border-[rgba(40,67,66,0.1)] hover:border-[#e9da95] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-sm text-[#284342]">
                            {payment.student}
                          </h3>
                          <p className="text-xs text-[#6b6b6b] mt-1">
                            {payment.course}
                          </p>
                        </div>
                        <p className="text-sm text-[#d4183d]">
                          {payment.amount}
                        </p>
                      </div>

                      <p className="text-xs text-[#6b6b6b]">
                        Due: {payment.dueDate}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
            <h2 className="text-xl text-[#284342] mb-4">Quick Actions</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickAction
                to="/app/students/registration"
                icon={<Users size={24} />}
                label="New Student"
              />
              <QuickAction
                to="/app/classes/scheduling"
                icon={<Calendar size={24} />}
                label="Schedule Class"
              />
              <QuickAction
                to="/app/attendance/daily"
                icon={<CheckCircle2 size={24} />}
                label="Take Attendance"
              />
              <QuickAction
                to="/app/payments/installments"
                icon={<DollarSign size={24} />}
                label="Record Payment"
              />
            </div>
          </div>
        </>
      )}
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

function getCourseNameFromEnrollment(enrollment: any) {
  if (!enrollment) return '-';

  const actualEnrollment = Array.isArray(enrollment) ? enrollment[0] : enrollment;
  const batch = actualEnrollment?.class_batches;
  const actualBatch = Array.isArray(batch) ? batch[0] : batch;
  const course = actualBatch?.courses;
  const actualCourse = Array.isArray(course) ? course[0] : course;

  return actualCourse?.course_name || '-';
}

function getApplicationCourse(app: any) {
  const course = Array.isArray(app.courses) ? app.courses[0] : app.courses;
  if (course?.course_name) return course.course_name;

  const student = Array.isArray(app.students) ? app.students[0] : app.students;
  return student?.course || '-';
}