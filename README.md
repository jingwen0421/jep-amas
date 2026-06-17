# 🎨 JEP Image Makeup Academy Management System

> A comprehensive management system for makeup academy operations, built with React 18, TypeScript, and Tailwind CSS v4.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Statistics](#system-statistics)
- [Module Overview](#module-overview)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Color Scheme](#color-scheme)
- [Teachers](#teachers)
- [User Roles](#user-roles)

---

## 🎯 Overview

JEP Image Makeup Academy Management System is a full-featured web application designed to manage all aspects of a makeup academy, including:

- 👥 Student enrollment and management
- 📚 Course catalog and batch scheduling
- 📅 Class scheduling and room allocation
- ✅ Attendance tracking and makeup classes
- 💰 Payment plans and outstanding balances
- 🎨 Student portfolios and teacher feedback
- 📆 Teacher consultations and appointments
- 💬 WhatsApp and email communications
- 🎓 Certificate generation
- 📊 Reports and analytics

---

## ✨ Features

### Core Functionality
- ✅ **Role-Based Access Control** - 6 different user roles with specific permissions
- ✅ **Responsive Design** - Works on mobile, tablet, and desktop
- ✅ **Malaysian Localization** - RM currency, Malaysian names, local phone formats
- ✅ **Real-Time Updates** - Status tracking across all modules
- ✅ **Search & Filter** - Advanced filtering on all list pages
- ✅ **Export Capabilities** - PDF and Excel exports where applicable

### Student Management
- Student enrollment and registration
- Registration approval workflow
- Student profiles and progress tracking
- Document management

### Scheduling & Classes
- Visual calendar (monthly/weekly views)
- Automated conflict detection
- Classroom allocation and equipment tracking
- Teacher availability management

### Attendance & Assessment
- Daily attendance marking
- Makeup class scheduling
- Attendance reports and analytics
- Assignment submission and grading
- Teacher feedback system

### Financial Management
- Installment payment plans
- Receipt generation
- Outstanding balance tracking
- Payment reminders

### Communications
- WhatsApp messaging
- Email campaigns
- Reusable message templates
- Broadcast messaging

---

## 📊 System Statistics

| Metric | Count |
|--------|-------|
| **Total Pages** | 39 |
| **Total Components** | 14 |
| **Modules** | 12 |
| **User Roles** | 6 |
| **Teachers** | 4 |
| **Routes** | 37+ |

---

## 🗂️ Module Overview

### 1. 🏠 Dashboard & Core (6 pages)
- Admin/Owner dashboards with role-specific views
- User management and role assignment
- System settings and configuration
- Audit logs and system reports

### 2. 👥 Students (5 pages)
- Student list with advanced search
- Student profiles and progress tracking
- New student registration
- Registration approval workflow

### 3. 📚 Courses (4 pages)
- Course catalog
- Course categories
- Class batch management
- Lesson content management

### 4. 📅 Classes (3 pages)
- Interactive class calendar
- Class scheduling with conflict detection
- Classroom and equipment allocation

### 5. ✅ Attendance (3 pages)
- Daily attendance tracking
- Makeup class scheduling
- Attendance reports and analytics

### 6. 💰 Payments (4 pages)
- Payment plan templates
- Installment schedules
- Receipt generation
- Outstanding balance tracking

### 7. 🎨 Portfolio (3 pages)
- Assignment submission portal
- Teacher grading and feedback
- Student gallery showcase

### 8. 📆 Appointments (3 pages)
- Teacher consultation booking
- Teacher availability schedules
- Appointment calendar

### 9. 💬 Communications (4 pages)
- WhatsApp messaging system
- Email campaign management
- Message templates
- Broadcast messaging

### 10. 🎓 Certificates (2 pages)
- Course completion certificates
- Perfect attendance certificates

### 11. 📋 Other (2 pages)
- Student surveys and feedback
- Centralized document center

---

## 🛠️ Technology Stack

```
Frontend
├── React 18              - UI Framework
├── TypeScript            - Type Safety
├── React Router v7       - Routing
├── Tailwind CSS v4       - Styling
├── Lucide React          - Icons
└── Vite                  - Build Tool
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Development
The app runs on `http://localhost:5173` by default.

---

## 📚 Documentation

Comprehensive documentation is available in multiple formats:

| Document | Format | Description |
|----------|--------|-------------|
| `PAGES_EXPORT.md` | Markdown | Detailed page documentation with tables |
| `SITEMAP.md` | Markdown | Navigation structure and route mapping |
| `pages-manifest.json` | JSON | Machine-readable page metadata |
| `EXPORT_SUMMARY.txt` | Text | Quick reference summary |

### Quick Links
- [Complete Pages Export](./PAGES_EXPORT.md)
- [System Sitemap](./SITEMAP.md)
- [Pages Manifest](./pages-manifest.json)
- [Export Summary](./EXPORT_SUMMARY.txt)

---

## 🎨 Color Scheme

The system uses a consistent color palette inspired by JEP Academy branding:

| Color | Hex Code | Usage |
|-------|----------|-------|
| **Primary** | `#284342` | Deep green - Headers, buttons, primary text |
| **Accent** | `#e9da95` | Gold - Button text, highlights, badges |
| **Background** | `#f8f8f6` | Off-white - Page backgrounds |
| **Text Primary** | `#284342` | Deep green - Main text |
| **Text Secondary** | `#6b6b6b` | Gray - Secondary text, labels |

### Additional Colors
- **Success**: Green shades
- **Warning**: Yellow shades  
- **Error**: Red shades
- **Info**: Blue shades

---

## 👨‍🏫 Teachers

The system includes four teachers:

1. **Juju Lim**
2. **Esther**
3. **Wong Yi Feng**
4. **Pauline Tang**

---

## 👤 User Roles

The system supports six different user roles:

| Role | Access Level | Key Permissions |
|------|--------------|-----------------|
| **Super Admin** | Full Access | All modules + user management + audit logs |
| **Admin** | High Access | Most modules except user management |
| **Teacher** | Medium Access | Classes, attendance, appointments, feedback |
| **Finance** | Medium Access | Payments, receipts, outstanding balances |
| **Student** | Limited Access | Courses, assignments, certificates, appointments |
| **Owner** | Full Access | All modules with business analytics focus |

---

## 📂 Project Structure

```
src/
├── app/
│   ├── pages/              # All page components (39 files)
│   │   ├── students/       # Student management pages
│   │   ├── courses/        # Course management pages
│   │   ├── classes/        # Class scheduling pages
│   │   ├── attendance/     # Attendance tracking pages
│   │   ├── payments/       # Payment management pages
│   │   ├── portfolio/      # Portfolio and feedback pages
│   │   ├── appointments/   # Appointment booking pages
│   │   ├── communications/ # Messaging pages
│   │   ├── certificates/   # Certificate pages
│   │   └── index.ts        # Central page exports
│   │
│   ├── components/         # Reusable components (14 files)
│   │   └── index.ts        # Central component exports
│   │
│   └── App.tsx            # Main application component
│
├── styles/
│   ├── theme.css          # Theme variables and tokens
│   └── fonts.css          # Font imports
│
└── main.tsx               # Application entry point
```

---

## 🔗 Route Structure

All routes follow the pattern: `/app/{module}/{action}`

### Example Routes

```
/app                              → Dashboard
/app/students/list                → Student List
/app/students/registration        → New Registration
/app/classes/calendar             → Class Calendar
/app/attendance/daily             → Daily Attendance
/app/payments/receipts            → Payment Receipts
/app/appointments/booking         → Teacher Booking
/app/communications/whatsapp      → WhatsApp Messages
```

See [SITEMAP.md](./SITEMAP.md) for complete route listing.

---

## 📝 Key Features by Page

### Dashboard
- Role-specific metrics (Admin vs Owner views)
- Today's class schedule
- Pending approvals
- Payment reminders
- Quick action buttons

### Student List
- Advanced search and filtering
- Student cards with key information
- Quick actions (View, Edit, Delete)
- Export to Excel/PDF

### Class Calendar
- Monthly and weekly views
- Interactive date selection
- Class details on hover
- Color-coded by course/teacher
- Today's date highlighting

### Payment Receipts
- Receipt generation
- PDF download
- Email to student
- Payment history
- Outstanding balance tracking

---

## 🎯 Best Practices

### Code Style
- TypeScript for type safety
- Functional components with hooks
- Tailwind CSS for styling (no inline styles)
- Lucide React for icons
- Consistent naming conventions

### File Organization
- One component per file
- PascalCase for component names
- Organized by module/feature
- Central export files for easy imports

### UI/UX
- Responsive design (mobile-first)
- Consistent color scheme
- Clear visual hierarchy
- Accessible forms and inputs
- Loading states and error handling

---

## 📄 License

© 2026 JEP Image Makeup Academy. All rights reserved.

---

## 📞 Support

For questions or issues, please refer to the documentation files or contact the development team.

---

**Last Updated:** June 2, 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
