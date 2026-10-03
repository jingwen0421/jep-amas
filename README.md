# 🎨 JEP Image Makeup Academy Management System (AMAS)

> A management system for makeup academy operations, built with React 18, TypeScript, Tailwind CSS v4 and Supabase. Fully bilingual (English / 中文).

![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ecf8e)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Modules](#modules)
- [User Roles](#user-roles)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Internationalization](#internationalization)
- [Database](#database)
- [Project Structure](#project-structure)
- [Routes](#routes)
- [Documentation](#documentation)
- [Branding](#branding)

---

## 🎯 Overview

AMAS is a web application built specifically for JEP Image Makeup Academy (Malaysia). It covers:

- 👥 Student registration, approval and profiles (including class-batch enrolment)
- 📚 Course catalog (built from the real JEP fee guide), discounts and class batches
- 📅 A unified calendar, class scheduling, room allocation and conflict detection
- ✅ Attendance, makeup classes and reschedule requests
- 💰 Payment plans, installments, receipts and outstanding balances
- 🎨 Portfolios, assignment submission and teacher feedback
- 📆 Teacher consultations and availability
- 🎟️ Public event sign-up and room rentals
- 🤝 CRM for internal and external sales
- 💬 Notification center with WhatsApp and email, reminders and templates
- 🎓 Completion and perfect-attendance certificates
- 📊 Reports, analytics, user management and audit logs

---

## ✨ Features

- **Role-based access control** – 10 roles, enforced in the UI and by Supabase Row Level Security
- **Supabase backend** – Postgres data, auth, invitations, forgot/reset password
- **Bilingual UI** – English and Mandarin with a language switcher
- **Role-specific dashboards** – Admin, Owner, Teacher, Student, Parent, Finance and Sales
- **Unified calendar** – classes, appointments, events and room rentals in one place, with sync-conflict handling
- **Notification center** – filters, manual reminder review, WhatsApp queue and message templates
- **Exports** – PDF (jsPDF) and Excel (xlsx) for receipts, reports and lists
- **Consistent UX** – shared confirmation dialogs and actionable empty states
- **Malaysian localisation** – RM currency and local phone formats

---

## 🗂️ Modules

| Module | Pages |
|--------|-------|
| **Dashboard & Core** | Role dashboards, Reports, Document Center, Survey/Feedback, Settings, Notification Center |
| **Students** | List, Registration (public and internal), Approval, Profile, Progress |
| **Courses** | Categories, Courses, Class Batches, Lessons |
| **Calendar & Classes** | Unified Calendar, Reschedule Requests, Scheduling, Classroom Allocation |
| **Attendance** | Daily Attendance, Makeup Classes, Attendance Reports |
| **Appointments** | Teacher Booking, Availability, Appointment Calendar |
| **Events** | Event Management, public sign-up page (`/register/:occurrenceId`), room rentals |
| **Payments** | Plans, Installments, Receipts, Outstanding Balances |
| **Portfolio** | Assignment Submission, Teacher Feedback, Student Gallery |
| **Certificates** | Completion, Perfect Attendance |
| **Communications** | WhatsApp, Email, Broadcast, Templates |
| **CRM** | Leads and sales pipeline for sales roles |
| **Administration** | User Management (invitations, permission matrix, login activity), Audit Logs |

---

## 👤 User Roles

| Role | Typical access |
|------|----------------|
| **Super Admin** | Everything, including user management and audit logs |
| **Owner** | All modules with a business-analytics focus |
| **Admin** | Day-to-day academy administration |
| **Teacher** | Classes, attendance, appointments, portfolio feedback |
| **Assistant Teacher** | Supports teachers on classes and attendance |
| **Finance** | Payments, receipts, outstanding balances |
| **Internal Sales** | CRM and student enquiries/registration |
| **External Sales** | CRM for referred leads |
| **Student** | Own courses, assignments, certificates, appointments |
| **Parent / Guardian** | Child's progress, payments and schedule |

Exact permissions are defined in `src/app/utils/userHelpers.ts` and in the RLS migrations.

---

## 🛠️ Technology Stack

```
Frontend   React 18, TypeScript, Vite, React Router v7
Styling    Tailwind CSS v4, Radix UI, MUI, Lucide icons
Backend    Supabase (Postgres, Auth, RLS, migrations)
Charts     Recharts
Exports    jsPDF + autotable, xlsx, html2canvas
Hosting    Vercel (SPA rewrite in vercel.json)
```

> Note: the project was bootstrapped from Create Next App, but it is a **Vite** app – `next` is not used.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- A Supabase project

### Environment

Create a `.env.local` file:

```bash
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### Commands

```bash
npm install          # install dependencies
npm run dev          # start dev server (default http://localhost:5173, auto-picks another port if busy)
npm run check:i18n   # verify English/Chinese translation key parity
npm run build        # i18n parity check + production build
```

---

## 🌐 Internationalization

- Translations live in `src/app/i18n/en.ts` and `src/app/i18n/zh.ts` (~2,000 keys).
- `LanguageContext` provides `t()` and the language switcher.
- `npm run build` runs `scripts/check-i18n-parity.mjs` and **fails if `en` and `zh` keys drift apart**. Always add a key to both files.
- See [MULTILINGUAL_GUIDE.md](./MULTILINGUAL_GUIDE.md) for details.

---

## 🗄️ Database

SQL migrations are in `supabase/migrations/` and are applied in filename order:

| Migration | Purpose |
|-----------|---------|
| `calendar_centric_foundation` | Core calendar-centric schema |
| `rls_policies` | Row Level Security for all roles |
| `add_appointment_calendar_event_type` | Appointment events on the calendar |
| `backfill_academy_id_and_dedupe_academy` | Academy scoping data fix |
| `calendar_events_sync` / `calendar_sync_conflicts_admin_dismiss` | Calendar sync and conflict handling |
| `lesson_participants_and_modules` | Lesson participants and modules |
| `auto_academy_id_trigger` | Auto-fill `academy_id` |
| `event_signup_and_room_rentals` | Public event sign-up and room rentals |

When adding tables, add RLS policies too – missing policies show up as silently empty dashboards for the affected role.

---

## 📂 Project Structure

```
src/
├── main.tsx                  # Entry point
├── app/
│   ├── App.tsx
│   ├── routes.tsx            # React Router data router
│   ├── pages/                # Route pages, grouped by module
│   ├── components/           # Shared and per-module components
│   │   ├── dashboard/        # Role dashboards
│   │   ├── payments/ reports/ settings/ notifications/ userManagement/
│   │   └── ui/               # Shared UI (EmptyState, dialogs, etc.)
│   ├── context/              # LanguageContext, ConfirmDialogContext
│   ├── services/             # Supabase data services (payments, CRM, notifications, ...)
│   ├── i18n/                 # en.ts / zh.ts
│   ├── lib/                  # Supabase client
│   ├── hooks/ types/ utils/
└── styles/                   # Tailwind, theme tokens, fonts
supabase/migrations/          # Database schema and RLS
scripts/check-i18n-parity.mjs # Build-time translation guard
```

---

## 🔗 Routes

Public: `/` (login), `/student-registration`, `/forgot-password`, `/reset-password`, `/register/:occurrenceId`

Authenticated routes live under `/app`, for example:

```
/app/dashboard                → Role dashboard
/app/students/list            → Student List
/app/courses/list             → Courses
/app/calendar                 → Unified Calendar
/app/attendance/daily         → Daily Attendance
/app/payments/receipts        → Receipts
/app/portfolio/submissions    → Assignment Submission
/app/communications/whatsapp  → WhatsApp
/app/crm                      → CRM
/app/users                    → User Management
/app/audit                    → Audit Logs
```

See [SITEMAP.md](./SITEMAP.md) for the full list (note: it predates the calendar, events, CRM and notification modules).

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| `SYSTEM_OVERVIEW.md` | System architecture and module descriptions |
| `MULTILINGUAL_GUIDE.md` | Working with translations |
| `SITEMAP.md` | Navigation structure |
| `PAGES_EXPORT.md`, `pages-manifest.json`, `EXPORT_SUMMARY.txt` | Original page export (earlier version of the system) |
| `COMPLETED_PAGES.md` | Page completion tracking |
| `AGENTS.md` / `CLAUDE.md` | Instructions for AI coding agents |

---

## 🎨 Branding

| Color | Hex | Usage |
|-------|-----|-------|
| **Primary** | `#284342` | Deep green – headers, buttons, text |
| **Accent** | `#e9da95` | Gold – highlights, button text, badges |
| **Background** | `#f8f8f6` | Off-white page background |
| **Secondary text** | `#6b6b6b` | Labels and secondary text |

---

## 📄 License

© 2026 JEP Image Makeup Academy. All rights reserved.
