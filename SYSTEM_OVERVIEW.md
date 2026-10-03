# JEP Image Makeup Academy Management System (AMAS)

## Overview

An Academy Management & Administration System built for JEP Image Makeup Academy. It is designed for beauty academy operations rather than being a generic school system.

## Branding

- **Academy Name**: JEP Image Makeup Academy
- **Primary Color**: #284342 (Deep Green)
- **Accent Color**: #e9da95 (Gold)
- **Background**: #f8f8f6 (Off-white)
- **Style**: Premium, Elegant, Professional

## System Architecture

- **Framework**: React 18 + TypeScript, built with Vite (not Next.js, despite the project's origin)
- **Routing**: React Router v7 (data router, `src/app/routes.tsx`)
- **Backend**: Supabase — Postgres, Auth, Row Level Security, SQL migrations in `supabase/migrations/`
- **Styling**: Tailwind CSS v4, Radix UI, MUI
- **Icons**: Lucide React
- **Charts / exports**: Recharts, jsPDF, xlsx
- **i18n**: English and Mandarin, ~2,000 keys, enforced by `npm run check:i18n` during `npm run build`
- **Hosting**: Vercel (SPA rewrite)

Data access goes through the Supabase client (`src/app/lib/supabase.ts`) and per-domain services in `src/app/services/`. Access control is layered: `ProtectedRoute` + `utils/permissions.ts` in the UI, RLS policies in the database.

## User Roles

Ten roles (see `src/app/utils/permissions.ts` for exact route access and `SITEMAP.md` for the table):

1. **Super Admin** – everything, including Settings
2. **Owner** – analytics, payments, reports, users, audit, CRM
3. **Admin** – academy administration
4. **Teacher** – classes, attendance, events, portfolio feedback, certificates
5. **Assistant Teacher** – daily attendance, events, portfolio
6. **Finance** – payments, reports, documents
7. **Internal Sales** – CRM, student list, outstanding balances, reports
8. **External Sales** – CRM, student list, outstanding balances
9. **Student** – own calendar, events, assignments, certificates, payments
10. **Parent / Guardian** – child's certificates and outstanding payments

## Module Structure

### 1. Dashboard
Role-specific dashboards for Admin, Owner, Teacher, Student, Parent, Finance and Sales, with stats and quick actions linking into the relevant module.

### 2. Student Management
- **Student List** with search and filters, and an empty state with a CTA
- **Registration** (internal and public `/student-registration`, with PDPA consent) and **Approval** workflow
- **Student Profile**: details, class-batch enrolment (editable), attendance, payments, portfolio, status including *completed*
- **Student Progress**

### 3. Course Management
- **Course Categories**, **Courses** (with delete and a link into Class Batches), **Class Batches**, **Lessons**
- Catalog and discounts are based on the real JEP fee guide

### 4. Calendar & Classes
- **Unified Calendar**: classes, events, appointments and room rentals in one view, with sync-conflict handling (admins can dismiss conflicts)
- **Reschedule Requests**
- **Class Scheduling** with teacher/room conflict detection, **Classroom Allocation**, **Teacher Availability**

### 5. Events
- **Event Management**: events, trial classes and 1-on-1 consultations, with availability locks for involved staff (replaces the old appointment-booking pages)
- **Public sign-up** at `/register/:occurrenceId`
- **Room rentals**

### 6. Attendance
Daily attendance (Present/Absent/Late/Leave), makeup classes, attendance reports. Workflow: Absent → notification → makeup class → progress update.

### 7. Payments
Payment plans (full / installment), installments, receipts (PDF), outstanding balances. Currency is Malaysian Ringgit (RM). Parents and students see their own records through RLS policies on `payment_plans` and `installments`.

### 8. Portfolio
Student gallery, assignment submission, teacher feedback (score, comment, approve / request revision).

### 9. Certificates
Completion and perfect-attendance certificates with preview and PDF download.

### 10. Communications & Notifications
- **Notification Center**: filters, manual reminder review, WhatsApp queue
- **WhatsApp**, **Email**, **Broadcast**, **Message Templates** (class, payment and appointment reminders, etc.)
- Notification settings and template editing live under Settings

### 11. CRM
Leads, deals (convertible into students), sales team and commission settings, used by sales roles, Owner and Admin.

### 12. Survey & Feedback
Teacher and course evaluation, with results restricted to administrators.

### 13. Reports
Enrollment, attendance, payment, outstanding balances, teacher performance, portfolio and satisfaction reports, with PDF/Excel export.

### 14. Document Center
Folder-style storage for student documents, forms, receipts and certificates.

### 15. User Management
Users, invitations, pending approvals, permission matrix, role permission cards, and a login-activity feed backed by `audit_logs`. All ten roles are translated in the UI.

### 16. Audit Logs
System action history by user and module.

### 17. Settings (Super Admin)
About system, notification settings, message template editor.

## Key Features

- **Bilingual UI** (English / 中文) with a language switcher
- **Role-based navigation** and dashboards
- **Shared UX components**: `ConfirmDialogContext` for confirmations (no native `confirm()`), `EmptyState` with actionable CTAs
- **Responsive design** with a collapsible sidebar on mobile
- **Malaysian context**: RM currency, local phone formats

## Routing

See [SITEMAP.md](./SITEMAP.md) for the complete route list.

## File Structure

```
src/
├── main.tsx
├── app/
│   ├── App.tsx, routes.tsx
│   ├── pages/            # students, courses, classes, attendance, appointments,
│   │                     # calendar, events, payments, portfolio, certificates,
│   │                     # communications, crm, public, + top-level pages
│   ├── components/       # Layout, ProtectedRoute, dashboard/, payments/, reports/,
│   │                     # settings/, notifications/, userManagement/, ui/
│   ├── context/          # LanguageContext, ConfirmDialogContext
│   ├── services/         # Supabase data services
│   ├── i18n/             # en.ts, zh.ts
│   ├── lib/ hooks/ types/ utils/
└── styles/
supabase/migrations/      # schema + RLS
scripts/check-i18n-parity.mjs
```

## Database Migrations

Applied in filename order: calendar-centric foundation, RLS policies, appointment calendar event type, academy_id backfill/dedupe, calendar events sync, sync-conflict admin dismiss, lesson participants and modules, auto academy_id trigger, event sign-up and room rentals.

New tables need RLS policies; missing policies show up as silently empty data for the affected role.

## Development Notes

- `npm run dev` starts Vite (auto-picks another port if 5173 is busy).
- `npm run build` runs the i18n parity check, then `vite build`. Add every new translation key to both `en.ts` and `zh.ts`.
- Environment: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Design Principles

Premium and professional, role-centric workflows, secure by default (UI checks plus RLS), bilingual, responsive.

---

**Built for**: JEP Image Makeup Academy
**Technology**: React + TypeScript + Tailwind CSS + Supabase
**Last Updated**: October 2026
