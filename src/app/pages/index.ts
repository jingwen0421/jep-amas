/**
 * JEP Academy Management System
 * Central Page Exports Index
 *
 * This file exports all page components for easy importing throughout the application.
 * Usage: import { StudentList, Dashboard } from '@/pages';
 */

// ==================== CORE PAGES ====================
export { default as Dashboard } from './Dashboard';
export { default as LoginPage } from './LoginPage';
export { default as Settings } from './Settings';
export { default as Reports } from './Reports';
export { default as UserManagement } from './UserManagement';
export { default as AuditLogs } from './AuditLogs';
export { default as SurveyFeedback } from './SurveyFeedback';
export { default as DocumentCenter } from './DocumentCenter';

// ==================== STUDENTS MODULE ====================
export { default as StudentList } from './students/StudentList';
export { default as StudentProfile } from './students/StudentProfile';
export { default as StudentRegistration } from './students/StudentRegistration';
export { default as RegistrationApproval } from './students/RegistrationApproval';
export { default as StudentProgress } from './students/StudentProgress';

// ==================== COURSES MODULE ====================
export { default as Courses } from './courses/Courses';
export { default as CourseCategories } from './courses/CourseCategories';
export { default as ClassBatches } from './courses/ClassBatches';
export { default as Lessons } from './courses/Lessons';

// ==================== CLASSES MODULE ====================
export { default as ClassCalendar } from './classes/ClassCalendar';
export { default as ClassScheduling } from './classes/ClassScheduling';
export { default as ClassroomAllocation } from './classes/ClassroomAllocation';

// ==================== ATTENDANCE MODULE ====================
export { default as DailyAttendance } from './attendance/DailyAttendance';
export { default as MakeupClasses } from './attendance/MakeupClasses';
export { default as AttendanceReports } from './attendance/AttendanceReports';

// ==================== PAYMENTS MODULE ====================
export { default as PaymentPlans } from './payments/PaymentPlans';
export { default as Installments } from './payments/Installments';
export { default as Receipts } from './payments/Receipts';
export { default as OutstandingBalances } from './payments/OutstandingBalances';

// ==================== PORTFOLIO MODULE ====================
export { default as AssignmentSubmission } from './portfolio/AssignmentSubmission';
export { default as TeacherFeedback } from './portfolio/TeacherFeedback';
export { default as StudentGallery } from './portfolio/StudentGallery';

// ==================== TEACHER AVAILABILITY ====================
export { default as TeacherAvailability } from './appointments/TeacherAvailability';

// ==================== EVENTS MODULE ====================
export { default as EventManagement } from './events/EventManagement';

// ==================== COMMUNICATIONS MODULE ====================
export { default as WhatsAppComms } from './communications/WhatsAppComms';
export { default as EmailComms } from './communications/EmailComms';
export { default as MessageTemplates } from './communications/MessageTemplates';
export { default as BroadcastMessages } from './communications/BroadcastMessages';

// ==================== CERTIFICATES MODULE ====================
export { default as CompletionCertificates } from './certificates/CompletionCertificates';
export { default as AttendanceCertificates } from './certificates/AttendanceCertificates';
