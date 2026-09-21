import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { canAccessPath } from '../utils/permissions';
import {
  Bell,
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  CalendarDays,
  ClipboardCheck,
  PartyPopper,
  RefreshCw,
  CreditCard,
  Briefcase,
  Award,
  MessageSquare,
  BarChart3,
  FolderOpen,
  Shield,
  History,
  Settings as SettingsIcon,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Globe,
} from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../utils/session';

interface NavItem {
  id: string;
  label: string;
  path?: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [userRole, setUserRole] = useState('student');
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'student';
    setUserRole(role);
    fetchNotificationCount();
  }, []);

  async function fetchNotificationCount() {
    const currentUser = getCurrentUser();

    let query = supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true });

    if (currentUser.role === 'student' || currentUser.role === 'parent') {
      query = query.eq('user_id', currentUser.id);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Failed to fetch notification count:', error.message);
      return;
    }

    setNotificationCount(count || 0);
  }

  const notificationIcon = (
    <div className="relative">
      <Bell size={20} />

      {notificationCount > 0 && (
        <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center">
          {notificationCount > 99 ? '99+' : notificationCount}
        </span>
      )}
    </div>
  );

  const navigationSections: NavSection[] = [
    {
      id: 'general',
      title: t('section.general'),
      items: [
        {
          id: 'dashboard',
          label: t('nav.dashboard'),
          path: '/app/dashboard',
          icon: <LayoutDashboard size={20} />,
        },
        {
          id: 'notifications',
          label: t('nav.notifications'),
          path: '/app/notifications',
          icon: notificationIcon,
        },
      ],
    },
    {
      id: 'scheduling',
      title: t('section.scheduling'),
      items: [
        {
          id: 'calendar',
          label: t('nav.calendar'),
          path: '/app/calendar',
          icon: <CalendarDays size={20} />,
        },
        {
          id: 'reschedule-requests',
          label: t('nav.rescheduleRequests'),
          path: '/app/reschedule-requests',
          icon: <RefreshCw size={20} />,
        },
        {
          id: 'events',
          label: t('nav.events'),
          path: '/app/events',
          icon: <PartyPopper size={20} />,
        },
        {
          id: 'classes',
          label: t('nav.classes'),
          icon: <Calendar size={20} />,
          children: [
            { id: 'classes-scheduling', label: t('nav.scheduling'), path: '/app/classes/scheduling', icon: null },
            { id: 'classes-allocation', label: t('nav.classroomAllocation'), path: '/app/classes/allocation', icon: null },
            { id: 'classes-teacher-availability', label: t('nav.teacherAvailability'), path: '/app/appointments/availability', icon: null },
          ],
        },
        {
          id: 'attendance',
          label: t('nav.attendance'),
          icon: <ClipboardCheck size={20} />,
          children: [
            { id: 'attendance-daily', label: t('nav.dailyAttendance'), path: '/app/attendance/daily', icon: null },
            { id: 'attendance-makeup', label: t('nav.makeupClasses'), path: '/app/attendance/makeup', icon: null },
            { id: 'attendance-reports', label: t('nav.attendanceReports'), path: '/app/attendance/reports', icon: null },
          ],
        },
      ],
    },
    {
      id: 'students-section',
      title: t('section.students'),
      items: [
        {
          id: 'students',
          label: t('nav.students'),
          icon: <Users size={20} />,
          children: [
            { id: 'students-list', label: t('nav.studentList'), path: '/app/students/list', icon: null },
            { id: 'students-registration', label: t('nav.registration'), path: '/app/students/registration', icon: null },
            { id: 'students-approval', label: t('nav.approval'), path: '/app/students/approval', icon: null },
            { id: 'students-progress', label: t('nav.progress'), path: '/app/students/progress', icon: null },
          ],
        },
        {
          id: 'portfolio',
          label: t('nav.portfolio'),
          icon: <Briefcase size={20} />,
          children: [
            { id: 'portfolio-gallery', label: t('nav.gallery'), path: '/app/portfolio/gallery', icon: null },
            { id: 'portfolio-submissions', label: t('nav.submissions'), path: '/app/portfolio/submissions', icon: null },
            { id: 'portfolio-feedback', label: t('nav.feedback'), path: '/app/portfolio/feedback', icon: null },
          ],
        },
        {
          id: 'certificates',
          label: t('nav.certificates'),
          icon: <Award size={20} />,
          children: [
            { id: 'certificates-completion', label: t('nav.completion'), path: '/app/certificates/completion', icon: null },
            { id: 'certificates-attendance', label: t('nav.fullAttendance'), path: '/app/certificates/attendance', icon: null },
          ],
        },
      ],
    },
    {
      id: 'courses-section',
      title: t('section.courses'),
      items: [
        { id: 'courses-categories', label: t('nav.categories'), path: '/app/courses/categories', icon: <BookOpen size={20} /> },
        { id: 'courses-list', label: t('nav.courseList'), path: '/app/courses/list', icon: <BookOpen size={20} /> },
        { id: 'courses-batches', label: t('nav.classBatches'), path: '/app/courses/batches', icon: <BookOpen size={20} /> },
        { id: 'courses-lessons', label: t('nav.courseModules'), path: '/app/courses/lessons', icon: <BookOpen size={20} /> },
      ],
    },
    {
      id: 'finance',
      title: t('section.finance'),
      items: [
        {
          id: 'payments',
          label: t('nav.payments'),
          icon: <CreditCard size={20} />,
          children: [
            { id: 'payments-plans', label: t('nav.paymentPlans'), path: '/app/payments/plans', icon: null },
            { id: 'payments-installments', label: t('nav.installments'), path: '/app/payments/installments', icon: null },
            { id: 'payments-receipts', label: t('nav.receipts'), path: '/app/payments/receipts', icon: null },
            { id: 'payments-outstanding', label: t('nav.outstandingBalances'), path: '/app/payments/outstanding', icon: null },
          ],
        },
      ],
    },
    {
      id: 'sales',
      title: t('section.sales'),
      items: [
        {
          id: 'crm',
          label: t('nav.salesCrm'),
          path: '/app/crm',
          icon: <Briefcase size={20} />,
        },
      ],
    },
    {
      id: 'communication',
      title: t('section.communication'),
      items: [
        { id: 'comms-whatsapp', label: t('nav.whatsapp'), path: '/app/communications/whatsapp', icon: <MessageSquare size={20} /> },
        { id: 'comms-email', label: t('nav.email'), path: '/app/communications/email', icon: <MessageSquare size={20} /> },
        { id: 'comms-broadcast', label: t('nav.broadcast'), path: '/app/communications/broadcast', icon: <MessageSquare size={20} /> },
        { id: 'comms-templates', label: t('nav.templates'), path: '/app/communications/templates', icon: <MessageSquare size={20} /> },
      ],
    },
    {
      id: 'administration',
      title: t('section.administration'),
      items: [
        {
          id: 'documents',
          label: t('nav.documents'),
          path: '/app/documents',
          icon: <FolderOpen size={20} />,
        },
        {
          id: 'survey',
          label: t('nav.surveyFeedback'),
          path: '/app/survey',
          icon: <BarChart3 size={20} />,
        },
        {
          id: 'reports',
          label: t('nav.reports'),
          path: '/app/reports',
          icon: <BarChart3 size={20} />,
        },
        {
          id: 'users',
          label: t('nav.userManagement'),
          path: '/app/users',
          icon: <Shield size={20} />,
        },
        {
          id: 'audit',
          label: t('nav.auditLogs'),
          path: '/app/audit',
          icon: <History size={20} />,
        },
        {
          id: 'settings',
          label: t('nav.settings'),
          path: '/app/settings',
          icon: <SettingsIcon size={20} />,
        },
      ],
    },
  ];

  useEffect(() => {
    const activeParent = navigationSections
      .flatMap((section) => section.items)
      .find((item) =>
        item.children?.some((child) => location.pathname === child.path)
      );

    if (activeParent && !expandedItems.includes(activeParent.id)) {
      setExpandedItems((prev) => [...prev, activeParent.id]);
    }
  }, [location.pathname]);

  function toggleExpanded(id: string) {
    setExpandedItems((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  }

  function handleLogout() {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    navigate('/');
  }

  function isActive(path: string) {
    return location.pathname === path;
  }

  function filterNavItemsByRole(items: NavItem[]): NavItem[] {
    const currentRole = localStorage.getItem('userRole') || 'student';

    return items
      .map((item) => {
        if (item.children) {
          const allowedChildren = item.children.filter((child) =>
            child.path ? canAccessPath(currentRole, child.path) : true
          );

          if (allowedChildren.length === 0) return null;

          return {
            ...item,
            children: allowedChildren,
          };
        }

        if (!item.path) return item;

        return canAccessPath(currentRole, item.path) ? item : null;
      })
      .filter(Boolean) as NavItem[];
  }

  const filteredNavigationSections = navigationSections
    .map((section) => ({
      ...section,
      items: filterNavItemsByRole(section.items),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#284342] transform transition-transform duration-300 ${
          isMobileMenuOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        } flex flex-col`}
      >
        <div className="p-6 border-b border-[rgba(233,218,149,0.2)]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl text-[#e9da95]">{t('app.name')}</h1>
              <p className="text-xs text-[#e9da95]/70 mt-1">
                {t('app.tagline')}
              </p>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden text-[#e9da95] hover:bg-[rgba(233,218,149,0.15)] p-2 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-5">
          {filteredNavigationSections.map((section) => (
            <div key={section.id}>
              <p className="px-3 mb-2 text-[11px] uppercase tracking-widest text-[#e9da95]/45">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => (
                  <div key={item.id}>
                    {item.children ? (
                      <div>
                        <button
                          onClick={() => toggleExpanded(item.id)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[#e9da95] hover:bg-[rgba(233,218,149,0.15)] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {item.icon}
                            <span className="text-sm">{item.label}</span>
                          </div>

                          {expandedItems.includes(item.id) ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>

                        {expandedItems.includes(item.id) && (
                          <div className="ml-8 mt-1 space-y-1">
                            {item.children.map((child) => (
                              <Link
                                key={child.id}
                                to={child.path!}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                                  isActive(child.path!)
                                    ? 'bg-[rgba(233,218,149,0.15)] text-[#e9da95]'
                                    : 'text-[#e9da95]/65 hover:bg-[rgba(233,218,149,0.1)] hover:text-[#e9da95]'
                                }`}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={item.path!}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive(item.path!)
                            ? 'bg-[rgba(233,218,149,0.15)] text-[#e9da95]'
                            : 'text-[#e9da95]/70 hover:bg-[rgba(233,218,149,0.1)] hover:text-[#e9da95]'
                        }`}
                      >
                        {item.icon}
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-[rgba(233,218,149,0.2)]">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#e9da95] flex items-center justify-center text-[#284342]">
              <Users size={20} />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-[#e9da95] truncate">
                {localStorage.getItem('userName') || 'User'}
              </p>

              <p className="text-xs text-[#e9da95]/70 truncate">
                {roleLabel(userRole, t)} •{' '}
                {localStorage.getItem('userEmail') || '-'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#e9da95]/70 hover:bg-[rgba(233,218,149,0.1)] hover:text-[#e9da95] transition-colors"
          >
            <LogOut size={20} />
            <span className="text-sm">{t('app.signOut')}</span>
          </button>
        </div>
      </aside>

      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-[#284342] text-[#e9da95]"
      >
        <Menu size={24} />
      </button>

      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}

      <main className="flex-1 overflow-auto">
        <div className="bg-white border-b border-[rgba(40,67,66,0.1)] px-6 lg:px-8 py-4">
          <div className="flex items-center justify-end">
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgba(40,67,66,0.2)] hover:bg-[#f8f8f6] transition-colors"
              >
                <Globe size={18} className="text-[#284342]" />
                <span className="text-sm text-[#284342]">
                  {language === 'en' ? 'English' : '中文'}
                </span>
                <ChevronDown size={16} className="text-[#284342]" />
              </button>

              {showLanguageMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowLanguageMenu(false)}
                  />

                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[rgba(40,67,66,0.1)] overflow-hidden z-20">
                    <button
                      onClick={() => {
                        setLanguage('en');
                        setShowLanguageMenu(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                        language === 'en'
                          ? 'bg-[#e9da95]/20 text-[#284342]'
                          : 'text-[#6b6b6b] hover:bg-[#f8f8f6]'
                      }`}
                    >
                      English
                    </button>

                    <button
                      onClick={() => {
                        setLanguage('zh');
                        setShowLanguageMenu(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                        language === 'zh'
                          ? 'bg-[#e9da95]/20 text-[#284342]'
                          : 'text-[#6b6b6b] hover:bg-[#f8f8f6]'
                      }`}
                    >
                      中文 (Chinese)
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function formatRoleLabel(role: string) {
  return role
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const ROLE_KEY_MAP: Record<string, string> = {
  student: 'login.role.student',
  teacher: 'login.role.teacher',
  assistant_teacher: 'login.role.assistantTeacher',
  finance: 'login.role.finance',
  internal_sales: 'login.role.internalSales',
  external_sales: 'login.role.externalSales',
  parent: 'login.role.parent',
  admin: 'login.role.admin',
};

function roleLabel(role: string, t: (key: string) => string) {
  const key = ROLE_KEY_MAP[role];
  return key ? t(key) : formatRoleLabel(role);
}