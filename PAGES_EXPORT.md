# JEP Academy - Pages Reference

All paths are under `src/app/pages/`. Routes are defined in `src/app/routes.tsx` (see [SITEMAP.md](./SITEMAP.md)).

## 📊 Top-level pages (13)

| File | Route | Purpose |
|------|-------|---------|
| `Dashboard.tsx` | `/app/dashboard` | Role-based dashboard (views in `components/dashboard/`) |
| `LoginPage.tsx` | `/` | Login |
| `ForgotPassword.tsx` | `/forgot-password` | Request password reset |
| `ResetPassword.tsx` | `/reset-password` | Set a new password |
| `AccessDenied.tsx` | `/app/access-denied` | Shown when a role cannot open a route |
| `NotificationCenter.tsx` | `/app/notifications` | Notifications, reminder review, WhatsApp queue |
| `RescheduleRequests.tsx` | `/app/reschedule-requests` | Review class reschedule requests |
| `Reports.tsx` | `/app/reports` | Reports and analytics |
| `SurveyFeedback.tsx` | `/app/survey` | Surveys and evaluations |
| `DocumentCenter.tsx` | `/app/documents` | Document storage |
| `UserManagement.tsx` | `/app/users` | Users, invitations, permissions |
| `AuditLogs.tsx` | `/app/audit` | System activity logs |
| `Settings.tsx` | `/app/settings` | System settings (Super Admin) |

## 👥 students/

| File | Route | Purpose |
|------|-------|---------|
| `StudentList.tsx` | `/app/students/list` | Search and filter students |
| `StudentProfile.tsx` | `/app/students/profile/:id` | Profile, batch enrolment, status |
| `StudentRegistration.tsx` | `/app/students/registration`, `/student-registration` | Enrollment form (internal and public) |
| `RegistrationApproval.tsx` | `/app/students/approval` | Approve / reject registrations |
| `StudentProgress.tsx` | `/app/students/progress` | Course progress |

## 📚 courses/

| File | Route | Purpose |
|------|-------|---------|
| `CourseCategories.tsx` | `/app/courses/categories` | Categories |
| `Courses.tsx` | `/app/courses/list` | Course catalog |
| `ClassBatches.tsx` | `/app/courses/batches` | Batches per course |
| `Lessons.tsx` | `/app/courses/lessons` | Lesson content |

## 📅 calendar/, classes/, events/

| File | Route | Purpose |
|------|-------|---------|
| `calendar/UnifiedCalendar.tsx` | `/app/calendar` | Classes, events, appointments and rentals in one calendar |
| `classes/ClassScheduling.tsx` | `/app/classes/scheduling` | Scheduling with conflict detection |
| `classes/ClassroomAllocation.tsx` | `/app/classes/allocation` | Room allocation |
| `classes/ClassCalendar.tsx` | – (not routed) | Legacy class calendar, superseded by the unified calendar |
| `events/EventManagement.tsx` | `/app/events` | Events, trial classes, consultations, room rentals |
| `public/EventSignup.tsx` | `/register/:occurrenceId` | Public event sign-up |

## ✅ attendance/

| File | Route | Purpose |
|------|-------|---------|
| `DailyAttendance.tsx` | `/app/attendance/daily` | Mark attendance |
| `MakeupClasses.tsx` | `/app/attendance/makeup` | Makeup sessions |
| `AttendanceReports.tsx` | `/app/attendance/reports` | Attendance analytics |

## 📆 appointments/

| File | Route | Purpose |
|------|-------|---------|
| `TeacherAvailability.tsx` | `/app/appointments/availability` | Teacher availability |
| `TeacherBooking.tsx` | – (not routed) | Legacy booking page, replaced by Events |
| `AppointmentCalendar.tsx` | – (not routed) | Legacy appointment calendar, replaced by Events |

## 💰 payments/

| File | Route | Purpose |
|------|-------|---------|
| `PaymentPlans.tsx` | `/app/payments/plans` | Payment plans |
| `Installments.tsx` | `/app/payments/installments` | Installment schedules |
| `Receipts.tsx` | `/app/payments/receipts` | Receipts (PDF) |
| `OutstandingBalances.tsx` | `/app/payments/outstanding` | Unpaid balances |

Shared pieces are in `payments/components/`.

## 🎨 portfolio/

| File | Route | Purpose |
|------|-------|---------|
| `StudentGallery.tsx` | `/app/portfolio/gallery` | Portfolio gallery |
| `AssignmentSubmission.tsx` | `/app/portfolio/submissions` | Assignment uploads |
| `TeacherFeedback.tsx` | `/app/portfolio/feedback` | Grading and feedback |

## 🎓 certificates/

| File | Route | Purpose |
|------|-------|---------|
| `CompletionCertificates.tsx` | `/app/certificates/completion` | Completion certificates |
| `AttendanceCertificates.tsx` | `/app/certificates/attendance` | Perfect-attendance certificates |

## 💬 communications/

| File | Route | Purpose |
|------|-------|---------|
| `WhatsAppComms.tsx` | `/app/communications/whatsapp` | WhatsApp messaging |
| `EmailComms.tsx` | `/app/communications/email` | Email |
| `BroadcastMessages.tsx` | `/app/communications/broadcast` | Mass messaging |
| `MessageTemplates.tsx` | `/app/communications/templates` | Reusable templates |

## 🤝 crm/

| File | Route | Purpose |
|------|-------|---------|
| `CRMPage.tsx` | `/app/crm` | CRM shell |
| `components/LeadsSection.tsx` | – | Leads |
| `components/DealsSection.tsx` | – | Deals |
| `components/ConvertDealModal.tsx` | – | Convert a deal into a student |
| `components/TeamSection.tsx` | – | Sales team |
| `components/CommissionSettingSection.tsx` | – | Commission settings |

## 🧩 Shared code

| Location | Contents |
|----------|----------|
| `components/Layout.tsx`, `ProtectedRoute.tsx` | Sidebar layout and route guard |
| `components/dashboard/` | Admin, Owner, Teacher, Student, Parent, Finance, Sales dashboards |
| `components/reports/` | KPI section, charts, report generator/preview/history |
| `components/settings/` | About, notification settings, message template editor |
| `components/notifications/` | Notification center, WhatsApp queue |
| `components/userManagement/` | Table, filters, KPIs, modal, invitations, permission matrix, login activity |
| `components/ui/` | Shared UI primitives, including `EmptyState` |
| `context/` | `LanguageContext`, `ConfirmDialogContext` |
| `services/` | Supabase data services (payments, CRM, notifications, reports, settings, user management, ...) |
| `i18n/` | `en.ts`, `zh.ts` |
| `utils/permissions.ts` | Role-to-route access map |

## 📝 Conventions

- Pages and components: PascalCase `.tsx`; module folders are lowercase.
- Every user-facing string goes through `t()`; add keys to both `en.ts` and `zh.ts` (the build fails on drift).
- Add RLS policies with any new table.

---

*Last Updated: October 2026*
