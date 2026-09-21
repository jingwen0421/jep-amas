import AdminDashboard from '../components/dashboard/AdminDashboard';
import StudentDashboard from '../components/dashboard/StudentDashboard';
import TeacherDashboard from '../components/dashboard/TeacherDashboard';
import FinanceDashboard from '../components/dashboard/FinanceDashboard';
import SalesDashboard from '../components/dashboard/SalesDashboard';
import ParentDashboard from '../components/dashboard/ParentDashboard';
import OwnerDashboard from '../components/dashboard/OwnerDashboard';

export default function Dashboard() {
  const role = localStorage.getItem('userRole') || 'student';

  if (role === 'student') return <StudentDashboard />;

  if (role === 'teacher' || role === 'assistant_teacher') {
    return <TeacherDashboard />;
  }

  if (role === 'finance') return <FinanceDashboard />;

  if (role === 'internal_sales' || role === 'external_sales') {
    return <SalesDashboard />;
  }

  if (role === 'parent') return <ParentDashboard />;

  // Owner has a narrower ROLE_ACCESS scope than admin (reports/finance/CRM
  // oversight, not day-to-day operations) — AdminDashboard's quick actions
  // link to paths (students, attendance, portfolio, events, calendar) owner
  // can't reach, so it needs its own dashboard scoped to what it can access.
  if (role === 'owner') return <OwnerDashboard />;

  return <AdminDashboard />;
}