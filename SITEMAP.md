# JEP Image Makeup Academy - System Sitemap

Source of truth: `src/app/routes.tsx` (routes) and `src/app/utils/permissions.ts` (role access).

## Application Structure

```
JEP Academy Management System
│
├── Public (no login)
│   ├── Login                      /
│   ├── Student Registration       /student-registration
│   ├── Forgot Password            /forgot-password
│   ├── Reset Password             /reset-password
│   └── Event Sign-up              /register/:occurrenceId
│
└── App (/app, login required)
    ├── 🏠 Dashboard (role-specific)
    ├── 🔔 Notification Center
    ├── 👥 Students: List, Registration, Approval, Profile, Progress
    ├── 📚 Courses: Categories, Courses, Class Batches, Lessons
    ├── 📅 Calendar: Unified Calendar, Reschedule Requests
    ├── 🏫 Classes: Scheduling, Classroom Allocation, Teacher Availability
    ├── 🎟️ Events: Event Management (sessions, trial classes, consultations, room rentals)
    ├── ✅ Attendance: Daily, Makeup Classes, Reports
    ├── 💰 Payments: Plans, Installments, Receipts, Outstanding Balances
    ├── 🎨 Portfolio: Gallery, Assignment Submission, Teacher Feedback
    ├── 🎓 Certificates: Completion, Perfect Attendance
    ├── 💬 Communications: WhatsApp, Email, Broadcast, Templates
    ├── 🤝 CRM: Leads, Deals, Team, Commission Settings
    ├── 📊 Reports
    ├── 📋 Survey & Feedback
    ├── 📁 Document Center
    ├── 🔐 User Management (users, invitations, permission matrix, login activity)
    ├── 📜 Audit Logs
    └── ⚙️ Settings (about, notification settings, message templates)
```

## URL Routes

### Public

| Route | Page |
|-------|------|
| `/` | Login |
| `/student-registration` | Student Registration (public form) |
| `/forgot-password` | Forgot Password |
| `/reset-password` | Reset Password |
| `/register/:occurrenceId` | Public event sign-up |

### Authenticated (`/app/...`)

| Module | Route | Page |
|--------|-------|------|
| **Dashboard** | `/app/dashboard` | Role-based dashboard |
| | `/app/notifications` | Notification Center |
| | `/app/access-denied` | Shown when a role lacks access |
| **Students** | `/app/students/list` | Student List |
| | `/app/students/registration` | Student Registration |
| | `/app/students/approval` | Registration Approval |
| | `/app/students/profile/:id` | Student Profile |
| | `/app/students/progress` | Student Progress |
| **Courses** | `/app/courses/categories` | Course Categories |
| | `/app/courses/list` | Courses |
| | `/app/courses/batches` | Class Batches |
| | `/app/courses/lessons` | Lessons |
| **Calendar** | `/app/calendar` | Unified Calendar |
| | `/app/reschedule-requests` | Reschedule Requests |
| **Classes** | `/app/classes/scheduling` | Class Scheduling |
| | `/app/classes/allocation` | Classroom Allocation |
| | `/app/appointments/availability` | Teacher Availability |
| **Events** | `/app/events` | Event Management |
| **Attendance** | `/app/attendance/daily` | Daily Attendance |
| | `/app/attendance/makeup` | Makeup Classes |
| | `/app/attendance/reports` | Attendance Reports |
| **Payments** | `/app/payments/plans` | Payment Plans |
| | `/app/payments/installments` | Installments |
| | `/app/payments/receipts` | Receipts |
| | `/app/payments/outstanding` | Outstanding Balances |
| **Portfolio** | `/app/portfolio/gallery` | Student Gallery |
| | `/app/portfolio/submissions` | Assignment Submission |
| | `/app/portfolio/feedback` | Teacher Feedback |
| **Certificates** | `/app/certificates/completion` | Completion Certificates |
| | `/app/certificates/attendance` | Attendance Certificates |
| **Communications** | `/app/communications/whatsapp` | WhatsApp |
| | `/app/communications/email` | Email |
| | `/app/communications/broadcast` | Broadcast Messages |
| | `/app/communications/templates` | Message Templates |
| **CRM** | `/app/crm` | CRM |
| **Other** | `/app/survey` | Survey & Feedback |
| | `/app/reports` | Reports |
| | `/app/documents` | Document Center |
| | `/app/users` | User Management |
| | `/app/audit` | Audit Logs |
| | `/app/settings` | Settings |

> Teacher booking and the appointment calendar were replaced by **Events** (`/app/events`). `TeacherBooking.tsx` and `AppointmentCalendar.tsx` still exist in `src/app/pages/appointments/` but are not routed.

## Role Access

Access is checked by path prefix in `ROLE_ACCESS` (`src/app/utils/permissions.ts`); Supabase RLS enforces it again on the data. Row-level RLS can be narrower than the route access below (for example a student only sees their own records).

| Role | Accessible route prefixes |
|------|---------------------------|
| **Super Admin** | Everything (`*`), including `/app/settings` |
| **Admin** | dashboard, notifications, students, courses, calendar, reschedule-requests, classes, attendance, appointments/availability, events, payments, portfolio, certificates, communications, survey, reports, documents, users, audit, crm |
| **Owner** | dashboard, notifications, reports, payments, documents, users, audit, crm |
| **Teacher** | dashboard, notifications, calendar, reschedule-requests, classes, attendance, appointments/availability, events, portfolio, certificates, documents |
| **Assistant Teacher** | dashboard, notifications, calendar, reschedule-requests, attendance/daily, appointments/availability, events, portfolio/gallery, portfolio/submissions, documents |
| **Student** | dashboard, notifications, calendar, reschedule-requests, events, portfolio/submissions, certificates (completion, attendance), payments (outstanding, plans, installments, receipts) |
| **Finance** | dashboard, notifications, students/list, payments, reports, documents |
| **Internal Sales** | dashboard, notifications, students/list, payments/outstanding, reports, crm |
| **External Sales** | dashboard, notifications, students/list, payments/outstanding, crm |
| **Parent / Guardian** | dashboard, notifications, certificates (completion, attendance), payments/outstanding |

Notes:
- `/app/settings` is reachable only by Super Admin.
- Dashboards: Admin, Owner, Teacher, Student, Parent, Finance and Sales each get their own view.

## Technical Details

- **Framework**: React 18 + TypeScript, Vite
- **Routing**: React Router v7 (data router)
- **Backend**: Supabase (Postgres, Auth, RLS)
- **Styling**: Tailwind CSS v4
- **i18n**: English / Mandarin (`src/app/i18n`)

## Brand Colors

- Primary: `#284342` (Deep Green)
- Accent: `#e9da95` (Gold)
- Background: `#f8f8f6` (Off-white)
- Secondary text: `#6b6b6b` (Gray)

---

*Last Updated: October 2026*
