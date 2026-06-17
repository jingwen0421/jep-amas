# JEP Image Makeup Academy - System Sitemap

## Application Structure

```
JEP Academy Management System
│
├── 🏠 Dashboard
│   ├── Admin Dashboard
│   └── Owner Dashboard
│
├── 👥 Students
│   ├── Student List
│   ├── Student Registration
│   └── Registration Approval
│
├── 📚 Courses
│   ├── Course List
│   └── Class Batches
│
├── 📅 Classes
│   ├── Class Calendar
│   ├── Class Scheduling
│   └── Classroom Allocation
│
├── ✅ Attendance
│   ├── Daily Attendance
│   ├── Makeup Classes
│   └── Attendance Reports
│
├── 💰 Payments
│   ├── Installment Plans
│   ├── Payment Receipts
│   └── Outstanding Balances
│
├── 🎨 Portfolio
│   ├── Assignment Submission
│   └── Teacher Feedback
│
├── 📆 Appointments
│   ├── Teacher Booking
│   ├── Teacher Availability
│   └── Appointment Calendar
│
├── 💬 Communications
│   ├── WhatsApp Communications
│   ├── Email Communications
│   └── Message Templates
│
├── 🎓 Certificates
│   ├── Course Certificates
│   └── Attendance Certificates
│
├── 📊 Reports
│   └── (Reports dashboard)
│
├── 📋 Survey & Feedback
│   └── Student Surveys & Teacher Evaluations
│
├── 📁 Document Center
│   └── Student Document Management
│
├── 🔐 User Management
│   └── System Users & Roles
│
├── 📜 Audit Logs
│   └── System Activity Logs
│
└── ⚙️ Settings
    └── System Configuration
```

## URL Routes

### Main Navigation

| Module | Route | Page |
|--------|-------|------|
| **Dashboard** | `/app` | Dashboard (Role-based) |
| **Students** | `/app/students/list` | Student List |
| | `/app/students/registration` | Student Registration |
| | `/app/students/approval` | Registration Approval |
| **Courses** | `/app/courses/list` | Course List |
| | `/app/courses/batches` | Class Batches |
| **Classes** | `/app/classes/calendar` | Class Calendar |
| | `/app/classes/scheduling` | Class Scheduling |
| | `/app/classes/allocation` | Classroom Allocation |
| **Attendance** | `/app/attendance/daily` | Daily Attendance |
| | `/app/attendance/makeup` | Makeup Classes |
| | `/app/attendance/reports` | Attendance Reports |
| **Payments** | `/app/payments/installments` | Installment Plans |
| | `/app/payments/receipts` | Payment Receipts |
| | `/app/payments/outstanding` | Outstanding Balances |
| **Portfolio** | `/app/portfolio/submission` | Assignment Submission |
| | `/app/portfolio/feedback` | Teacher Feedback |
| **Appointments** | `/app/appointments/booking` | Teacher Booking |
| | `/app/appointments/availability` | Teacher Availability |
| | `/app/appointments/calendar` | Appointment Calendar |
| **Communications** | `/app/communications/whatsapp` | WhatsApp Communications |
| | `/app/communications/email` | Email Communications |
| | `/app/communications/templates` | Message Templates |
| **Certificates** | `/app/certificates/course` | Course Certificates |
| | `/app/certificates/attendance` | Attendance Certificates |
| **Reports** | `/app/reports` | Reports Dashboard |
| **Survey** | `/app/survey-feedback` | Survey & Feedback |
| **Documents** | `/app/document-center` | Document Center |
| **Users** | `/app/user-management` | User Management |
| **Audit** | `/app/audit-logs` | Audit Logs |
| **Settings** | `/app/settings` | System Settings |

## User Role Access Matrix

| Page | Super Admin | Admin | Teacher | Finance | Student | Owner |
|------|-------------|-------|---------|---------|---------|-------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Student List | ✓ | ✓ | ✓ | ✓ | - | ✓ |
| Registration | ✓ | ✓ | - | - | - | ✓ |
| Approval | ✓ | ✓ | - | - | - | ✓ |
| Courses | ✓ | ✓ | ✓ | - | ✓ | ✓ |
| Class Calendar | ✓ | ✓ | ✓ | - | ✓ | ✓ |
| Class Scheduling | ✓ | ✓ | - | - | - | ✓ |
| Classroom Allocation | ✓ | ✓ | - | - | - | ✓ |
| Daily Attendance | ✓ | ✓ | ✓ | - | - | ✓ |
| Makeup Classes | ✓ | ✓ | ✓ | - | - | ✓ |
| Attendance Reports | ✓ | ✓ | ✓ | - | - | ✓ |
| Installments | ✓ | ✓ | - | ✓ | - | ✓ |
| Receipts | ✓ | ✓ | - | ✓ | ✓ | ✓ |
| Outstanding Balances | ✓ | ✓ | - | ✓ | - | ✓ |
| Assignment Submission | ✓ | - | - | - | ✓ | - |
| Teacher Feedback | ✓ | - | ✓ | - | - | - |
| Teacher Booking | ✓ | ✓ | ✓ | - | ✓ | ✓ |
| Teacher Availability | ✓ | ✓ | ✓ | - | ✓ | ✓ |
| Appointment Calendar | ✓ | ✓ | ✓ | - | - | ✓ |
| WhatsApp Comms | ✓ | ✓ | - | - | - | ✓ |
| Email Comms | ✓ | ✓ | - | - | - | ✓ |
| Message Templates | ✓ | ✓ | - | - | - | ✓ |
| Course Certificates | ✓ | ✓ | - | - | ✓ | ✓ |
| Attendance Certificates | ✓ | ✓ | - | - | ✓ | ✓ |
| Reports | ✓ | ✓ | - | - | - | ✓ |
| Survey & Feedback | ✓ | ✓ | ✓ | - | ✓ | ✓ |
| Document Center | ✓ | ✓ | - | - | ✓ | ✓ |
| User Management | ✓ | - | - | - | - | ✓ |
| Audit Logs | ✓ | - | - | - | - | ✓ |
| Settings | ✓ | ✓ | - | - | - | ✓ |

## Key Features by Module

### 📊 Dashboard
- **Admin**: Active students, classes, fees, attendance rate
- **Owner**: Revenue, enrollments, collections, satisfaction
- Today's class schedule
- Pending approvals (Admin only)
- Payments due this week
- Quick action buttons

### 👥 Students
- **Student List**: Search, filter, student profiles
- **Registration**: Multi-step enrollment form
- **Approval**: Review applications, approve/reject/request info

### 📚 Courses
- **Course List**: Course catalog with details
- **Class Batches**: Batch management, capacity tracking

### 📅 Classes
- **Calendar**: Monthly/weekly visual calendar
- **Scheduling**: Create schedules, conflict detection
- **Allocation**: Room booking, equipment tracking

### ✅ Attendance
- **Daily**: Mark present/absent/late
- **Makeup Classes**: Schedule makeup sessions
- **Reports**: Attendance analytics by course/student

### 💰 Payments
- **Installments**: Payment plan schedules
- **Receipts**: Generate and view receipts
- **Outstanding**: Track overdue payments, send reminders

### 🎨 Portfolio
- **Submission**: Upload assignments (Student view)
- **Feedback**: Grade and provide feedback (Teacher view)

### 📆 Appointments
- **Booking**: Book teacher consultations
- **Availability**: View teacher schedules
- **Calendar**: Appointment overview

### 💬 Communications
- **WhatsApp**: Send messages, track delivery
- **Email**: Email campaigns, open rate tracking
- **Templates**: Reusable message templates

### 🎓 Certificates
- **Course**: Generate completion certificates
- **Attendance**: 100% attendance certificates

### 📋 Other Modules
- **Reports**: System analytics and reports
- **Survey**: Collect student feedback
- **Documents**: Centralized document storage
- **User Management**: User roles and permissions
- **Audit Logs**: System activity tracking
- **Settings**: System configuration

## Teachers

1. **Juju Lim**
2. **Esther**
3. **Wong Yi Feng**
4. **Pauline Tang**

## Technical Details

- **Framework**: React 18 + TypeScript
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Build Tool**: Vite

## Color Scheme

- Primary: `#284342` (Deep Green)
- Accent: `#e9da95` (Gold)
- Background: `#f8f8f6` (Off-white)
- Text: `#6b6b6b` (Gray)
- Success: Green shades
- Warning: Yellow shades
- Error: Red shades

---

*Last Updated: June 2, 2026*
