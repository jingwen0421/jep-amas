import { useEffect, useState } from 'react';
import {
  BookOpen,
  ClipboardCheck,
  CreditCard,
  Award,
  Briefcase,
  CalendarClock,
  Bell,
} from 'lucide-react';
import { Link } from 'react-router';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../utils/session';

interface StudentDashboardData {
  studentId: string;
  name: string;
  course: string;
  attendanceRate: number;
  outstandingAmount: number;
  portfolioCount: number;
  certificateCount: number;
  nextAppointment: string;
  notificationCount: number;
}

export default function StudentDashboard() {
  const currentUser = getCurrentUser();

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<StudentDashboardData>({
    studentId: '',
    name: currentUser.name,
    course: '-',
    attendanceRate: 0,
    outstandingAmount: 0,
    portfolioCount: 0,
    certificateCount: 0,
    nextAppointment: '-',
    notificationCount: 0,
  });

  useEffect(() => {
    fetchStudentDashboard();
  }, []);

  async function fetchStudentDashboard() {
    setLoading(true);

    const { data: student } = await supabase
      .from('students')
      .select('id, full_name, email')
      .eq('email', currentUser.email)
      .maybeSingle();

    if (!student) {
      setLoading(false);
      return;
    }

    const [
      enrollmentRes,
      attendanceRes,
      paymentRes,
      portfolioRes,
      certRes,
      appointmentRes,
      notificationRes,
    ] = await Promise.all([
      supabase
        .from('enrollments')
        .select(`
          id,
          class_batches(
            courses(course_name)
          )
        `)
        .eq('student_id', student.id)
        .limit(1)
        .maybeSingle(),

      supabase
        .from('attendance')
        .select('attendance_status')
        .eq('student_id', student.id),

      supabase
        .from('payment_plans')
        .select(`
          final_amount,
          original_fee,
          installments(amount, status)
        `)
        .eq('student_id', student.id),

      supabase
        .from('portfolio_items')
        .select('id')
        .eq('student_id', student.id),

      supabase
        .from('certificates')
        .select('id')
        .eq('student_id', student.id),

      supabase
        .from('appointments')
        .select('appointment_datetime')
        .eq('student_id', student.id)
        .order('appointment_datetime', { ascending: true })
        .limit(1)
        .maybeSingle(),

      supabase
        .from('notifications')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('delivery_status', 'pending'),
    ]);

    const attendance = attendanceRes.data || [];

    const present = attendance.filter((a: any) =>
      ['present', 'late'].includes(String(a.attendance_status).toLowerCase())
    ).length;

    const attendanceRate =
      attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0;

    const paymentPlans = paymentRes.data || [];

    const totalFee = paymentPlans.reduce(
      (sum: number, plan: any) =>
        sum + Number(plan.final_amount || plan.original_fee || 0),
      0
    );

    const paid = paymentPlans.reduce((sum: number, plan: any) => {
      const paidInstallments = (plan.installments || [])
        .filter((item: any) => String(item.status).toLowerCase() === 'paid')
        .reduce((acc: number, item: any) => acc + Number(item.amount || 0), 0);

      return sum + paidInstallments;
    }, 0);

    setData({
      studentId: student.id,
      name: student.full_name || currentUser.name,
      course: getCourseName(enrollmentRes.data),
      attendanceRate,
      outstandingAmount: Math.max(totalFee - paid, 0),
      portfolioCount: portfolioRes.data?.length || 0,
      certificateCount: certRes.data?.length || 0,
      nextAppointment: appointmentRes.data?.appointment_datetime
        ? new Date(appointmentRes.data.appointment_datetime).toLocaleString()
        : '-',
      notificationCount: notificationRes.data?.length || 0,
    });

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
        Loading student dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">
          Welcome, {data.name}
        </h1>
        <p className="text-[#6b6b6b] mt-1">
          View your course progress, attendance, payments, certificates and appointments.
        </p>
      </div>

      {!data.studentId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-800">
          Student profile not found yet. Please complete your student registration or wait for admin approval.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StudentCard icon={<BookOpen size={24} />} label="My Course" value={data.course} />
        <StudentCard icon={<ClipboardCheck size={24} />} label="Attendance" value={`${data.attendanceRate}%`} />
        <StudentCard icon={<CreditCard size={24} />} label="Outstanding" value={`RM ${data.outstandingAmount.toLocaleString()}`} />
        <StudentCard icon={<Award size={24} />} label="Certificates" value={data.certificateCount.toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Quick Actions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickLink to="/app/portfolio/submissions" icon={<Briefcase size={22} />} label="Submit Portfolio" />
            <QuickLink to="/app/appointments/booking" icon={<CalendarClock size={22} />} label="Book Appointment" />
            <QuickLink to="/app/certificates/completion" icon={<Award size={22} />} label="View Certificates" />
            <QuickLink to="/app/notifications" icon={<Bell size={22} />} label="View Notifications" />
          </div>
        </Panel>

        <Panel title="Next Appointment">
          <p className="text-[#284342] text-lg">{data.nextAppointment}</p>
          <p className="text-sm text-[#6b6b6b] mt-2">
            Appointment booking uses your own student account automatically.
          </p>
        </Panel>
      </div>
    </div>
  );
}

function StudentCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <div className="p-3 rounded-lg bg-[#e9da95]/20 text-[#284342] inline-block mb-4">
        {icon}
      </div>
      <p className="text-sm text-[#6b6b6b]">{label}</p>
      <p className="text-xl text-[#284342] mt-1">{value}</p>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <h2 className="text-xl text-[#284342] mb-4">{title}</h2>
      {children}
    </div>
  );
}

function QuickLink({
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
      className="p-4 rounded-lg bg-[#f8f8f6] hover:bg-[#e9da95]/20 transition-colors flex items-center gap-3"
    >
      <div className="text-[#284342]">{icon}</div>
      <span className="text-sm text-[#284342]">{label}</span>
    </Link>
  );
}

function getCourseName(enrollment: any) {
  if (!enrollment) return '-';

  const batch = Array.isArray(enrollment.class_batches)
    ? enrollment.class_batches[0]
    : enrollment.class_batches;

  const course = Array.isArray(batch?.courses)
    ? batch.courses[0]
    : batch?.courses;

  return course?.course_name || '-';
}