import { createBrowserRouter } from 'react-router';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/students/StudentList';
import RegistrationApproval from './pages/students/RegistrationApproval';
import StudentProfile from './pages/students/StudentProfile';
import StudentProgress from './pages/students/StudentProgress';
import CourseCategories from './pages/courses/CourseCategories';
import Courses from './pages/courses/Courses';
import ClassBatches from './pages/courses/ClassBatches';
import Lessons from './pages/courses/Lessons';
import UnifiedCalendar from './pages/calendar/UnifiedCalendar';
import RescheduleRequests from './pages/RescheduleRequests';
import ClassScheduling from './pages/classes/ClassScheduling';
import ClassroomAllocation from './pages/classes/ClassroomAllocation';
import DailyAttendance from './pages/attendance/DailyAttendance';
import MakeupClasses from './pages/attendance/MakeupClasses';
import AttendanceReports from './pages/attendance/AttendanceReports';
import TeacherAvailability from './pages/appointments/TeacherAvailability';
import EventManagement from './pages/events/EventManagement';
import PaymentPlans from './pages/payments/PaymentPlans';
import Installments from './pages/payments/Installments';
import Receipts from './pages/payments/Receipts';
import OutstandingBalances from './pages/payments/OutstandingBalances';
import StudentGallery from './pages/portfolio/StudentGallery';
import AssignmentSubmission from './pages/portfolio/AssignmentSubmission';
import TeacherFeedback from './pages/portfolio/TeacherFeedback';
import CompletionCertificates from './pages/certificates/CompletionCertificates';
import AttendanceCertificates from './pages/certificates/AttendanceCertificates';
import WhatsAppComms from './pages/communications/WhatsAppComms';
import EmailComms from './pages/communications/EmailComms';
import BroadcastMessages from './pages/communications/BroadcastMessages';
import MessageTemplates from './pages/communications/MessageTemplates';
import SurveyFeedback from './pages/SurveyFeedback';
import Reports from './pages/Reports';
import DocumentCenter from './pages/DocumentCenter';
import UserManagement from './pages/UserManagement';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import NotificationCenter from './pages/NotificationCenter';
import ProtectedRoute from './components/ProtectedRoute';
import AccessDenied from './pages/AccessDenied';
import StudentRegistration from './pages/students/StudentRegistration';
import CRMPage from './pages/crm/CRMPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EventSignup from './pages/public/EventSignup';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LoginPage,
  },
  {
  path: '/student-registration',
  Component: StudentRegistration,
},
{
  path: '/forgot-password',
  Component: ForgotPassword,
},

{
  path: '/reset-password',
  Component: ResetPassword,
},

{
  // Public, unauthenticated — anyone with the link can sign up for an
  // event, no login required.
  path: '/register/:occurrenceId',
  Component: EventSignup,
},

  {
  path: '/app',
  element: (
    <ProtectedRoute>
      <Layout />
    </ProtectedRoute>
  ),
  children: [
    // your existing app routes

      { path: 'dashboard', Component: Dashboard },
      {
  path: 'access-denied',
  Component: AccessDenied,
  },

      // Student Management
      { path: 'students/list', Component: StudentList },
      { path: 'students/registration', Component: StudentRegistration },
      { path: 'students/approval', Component: RegistrationApproval },
      { path: 'students/profile/:id', Component: StudentProfile },
      { path: 'students/progress', Component: StudentProgress },

      // Course Management
      { path: 'courses/categories', Component: CourseCategories },
      { path: 'courses/list', Component: Courses },
      { path: 'courses/batches', Component: ClassBatches },
      { path: 'courses/lessons', Component: Lessons },

      // Unified Calendar
      { path: 'calendar', Component: UnifiedCalendar },
      { path: 'reschedule-requests', Component: RescheduleRequests },

      // Class Management
      { path: 'classes/scheduling', Component: ClassScheduling },
      { path: 'classes/allocation', Component: ClassroomAllocation },

      // Attendance
      { path: 'attendance/daily', Component: DailyAttendance },
      { path: 'attendance/makeup', Component: MakeupClasses },
      { path: 'attendance/reports', Component: AttendanceReports },

      // Teacher Availability (folded under Classes in nav)
      { path: 'appointments/availability', Component: TeacherAvailability },

      // Events (organizing/participating, staff-involved availability locks,
      // 1-on-1 trial classes/consultations — replaces the old appointments
      // booking module)
      { path: 'events', Component: EventManagement },

      // Payments
      { path: 'payments/plans', Component: PaymentPlans },
      { path: 'payments/installments', Component: Installments },
      { path: 'payments/receipts', Component: Receipts },
      { path: 'payments/outstanding', Component: OutstandingBalances },

      // Portfolio
      { path: 'portfolio/gallery', Component: StudentGallery },
      { path: 'portfolio/submissions', Component: AssignmentSubmission },
      { path: 'portfolio/feedback', Component: TeacherFeedback },

      // Certificates
      { path: 'certificates/completion', Component: CompletionCertificates },
      { path: 'certificates/attendance', Component: AttendanceCertificates },

      // Communications
      { path: 'communications/whatsapp', Component: WhatsAppComms },
      { path: 'communications/email', Component: EmailComms },
      { path: 'communications/broadcast', Component: BroadcastMessages },
      { path: 'communications/templates', Component: MessageTemplates },

      // Other modules
      { path: 'survey', Component: SurveyFeedback },
      { path: 'reports', Component: Reports },
      { path: 'documents', Component: DocumentCenter },
      { path: 'users', Component: UserManagement },
      { path: 'audit', Component: AuditLogs },
      { path: 'settings', Component: Settings },
      { path: 'notifications', Component: NotificationCenter },

      // Default redirect
      { index: true, path: '*', element: <Dashboard /> },

     // CRM
      {
      path:'crm',
      Component: CRMPage
      },
    ],
  },
]);
