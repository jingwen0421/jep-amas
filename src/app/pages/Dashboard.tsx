import AdminDashboard from '../components/dashboard/AdminDashboard';
import StudentDashboard from '../components/dashboard/StudentDashboard';
import TeacherDashboard from '../components/dashboard/TeacherDashboard';
import FinanceDashboard from '../components/dashboard/FinanceDashboard';
import SalesDashboard from '../components/dashboard/SalesDashboard';
import ParentDashboard from '../components/dashboard/ParentDashboard';

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

  return <AdminDashboard />;
}