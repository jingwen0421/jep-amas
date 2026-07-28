import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { canAccessPath } from '../utils/permissions';
import {
  Bell,
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  ClipboardCheck,
  CalendarClock,
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
  label: string;
  path?: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();

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
      title: 'General',
      items: [
        {
          label: 'Dashboard',
          path: '/app/dashboard',
          icon: <LayoutDashboard size={20} />,
        },
        {
          label: 'Notifications',
          path: '/app/notifications',
          icon: notificationIcon,
        },
      ],
    },
    {
      title: 'Academic',
      items: [
        {
          label: 'Students',
          icon: <Users size={20} />,
          children: [
            { label: 'Student List', path: '/app/students/list', icon: null },
            { label: 'Registration', path: '/app/students/registration', icon: null },
            { label: 'Approval', path: '/app/students/approval', icon: null },
            { label: 'Progress', path: '/app/students/progress', icon: null },
          ],
        },
        {
          label: 'Courses',
          icon: <BookOpen size={20} />,
          children: [
            { label: 'Categories', path: '/app/courses/categories', icon: null },
            { label: 'Courses', path: '/app/courses/list', icon: null },
            { label: 'Class Batches', path: '/app/courses/batches', icon: null },
            { label: 'Lessons', path: '/app/courses/lessons', icon: null },
          ],
        },
        {
          label: 'Classes',
          icon: <Calendar size={20} />,
          children: [
            { label: 'Calendar', path: '/app/classes/calendar', icon: null },
            { label: 'Scheduling', path: '/app/classes/scheduling', icon: null },
            { label: 'Classroom Allocation', path: '/app/classes/allocation', icon: null },
          ],
        },
        {
          label: 'Attendance',
          icon: <ClipboardCheck size={20} />,
          children: [
            { label: 'Daily Attendance', path: '/app/attendance/daily', icon: null },
            { label: 'Makeup Classes', path: '/app/attendance/makeup', icon: null },
            { label: 'Reports', path: '/app/attendance/reports', icon: null },
          ],
        },
        {
          label: 'Appointments',
          icon: <CalendarClock size={20} />,
          children: [
            { label: 'Booking', path: '/app/appointments/booking', icon: null },
            { label: 'Teacher Availability', path: '/app/appointments/availability', icon: null },
            { label: 'Calendar', path: '/app/appointments/calendar', icon: null },
          ],
        },
        {
          label: 'Portfolio',
          icon: <Briefcase size={20} />,
          children: [
            { label: 'Gallery', path: '/app/portfolio/gallery', icon: null },
            { label: 'Submissions', path: '/app/portfolio/submissions', icon: null },
            { label: 'Feedback', path: '/app/portfolio/feedback', icon: null },
          ],
        },
        {
          label: 'Certificates',
          icon: <Award size={20} />,
          children: [
            { label: 'Completion', path: '/app/certificates/completion', icon: null },
            { label: 'Full Attendance', path: '/app/certificates/attendance', icon: null },
          ],
        },
      ],
    },
    {
      title: 'Finance',
      items: [
        {
          label: 'Payments',
          icon: <CreditCard size={20} />,
          children: [
            { label: 'Payment Plans', path: '/app/payments/plans', icon: null },
            { label: 'Installments', path: '/app/payments/installments', icon: null },
            { label: 'Receipts', path: '/app/payments/receipts', icon: null },
            { label: 'Outstanding Balances', path: '/app/payments/outstanding', icon: null },
          ],
        },
      ],
    },
    {
      title: 'Sales',
      items: [
        {
          label: 'Sales CRM',
          path: '/app/crm',
          icon: <Briefcase size={20} />,
        },
      ],
    },
    {
      title: 'Communication',
      items: [
        {
          label: 'Communication',
          icon: <MessageSquare size={20} />,
          children: [
            { label: 'WhatsApp', path: '/app/communications/whatsapp', icon: null },
            { label: 'Email', path: '/app/communications/email', icon: null },
            { label: 'Broadcast', path: '/app/communications/broadcast', icon: null },
            { label: 'Templates', path: '/app/communications/templates', icon: null },
          ],
        },
        {
          label: 'Documents',
          path: '/app/documents',
          icon: <FolderOpen size={20} />,
        },
      ],
    },
    {
      title: 'Administration',
      items: [
        {
          label: 'Survey & Feedback',
          path: '/app/survey',
          icon: <BarChart3 size={20} />,
        },
        {
          label: 'Reports',
          path: '/app/reports',
          icon: <BarChart3 size={20} />,
        },
        {
          label: 'User Management',
          path: '/app/users',
          icon: <Shield size={20} />,
        },
        {
          label: 'Audit Logs',
          path: '/app/audit',
          icon: <History size={20} />,
        },
        {
          label: 'Settings',
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

    if (activeParent && !expandedItems.includes(activeParent.label)) {
      setExpandedItems((prev) => [...prev, activeParent.label]);
    }
  }, [location.pathname]);

  function toggleExpanded(label: string) {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
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
              <h1 className="text-xl text-[#e9da95]">JEP Academy</h1>
              <p className="text-xs text-[#e9da95]/70 mt-1">
                Management System
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
            <div key={section.title}>
              <p className="px-3 mb-2 text-[11px] uppercase tracking-widest text-[#e9da95]/45">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => (
                  <div key={item.label}>
                    {item.children ? (
                      <div>
                        <button
                          onClick={() => toggleExpanded(item.label)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[#e9da95] hover:bg-[rgba(233,218,149,0.15)] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {item.icon}
                            <span className="text-sm">{item.label}</span>
                          </div>

                          {expandedItems.includes(item.label) ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>

                        {expandedItems.includes(item.label) && (
                          <div className="ml-8 mt-1 space-y-1">
                            {item.children.map((child) => (
                              <Link
                                key={child.label}
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
                {formatRoleLabel(userRole)} •{' '}
                {localStorage.getItem('userEmail') || '-'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#e9da95]/70 hover:bg-[rgba(233,218,149,0.1)] hover:text-[#e9da95] transition-colors"
          >
            <LogOut size={20} />
            <span className="text-sm">Sign Out</span>
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