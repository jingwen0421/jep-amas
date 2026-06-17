import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
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

interface NavItem {
  label: string;
  path?: string;
  icon: React.ReactNode;
  children?: NavItem[];
  roles?: string[];
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/app/dashboard',
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: 'Student Management',
    icon: <Users size={20} />,
    children: [
      { label: 'Student List', path: '/app/students/list', icon: null },
      { label: 'Student Registration', path: '/app/students/registration', icon: null },
      { label: 'Registration Approval', path: '/app/students/approval', icon: null, roles: ['admin', 'super-admin'] },
      { label: 'Student Progress', path: '/app/students/progress', icon: null },
    ],
  },
  {
    label: 'Course Management',
    icon: <BookOpen size={20} />,
    children: [
      { label: 'Course Categories', path: '/app/courses/categories', icon: null },
      { label: 'Courses', path: '/app/courses/list', icon: null },
      { label: 'Class Batches', path: '/app/courses/batches', icon: null },
      { label: 'Lessons', path: '/app/courses/lessons', icon: null },
    ],
  },
  {
    label: 'Class Management',
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
      { label: 'Attendance Reports', path: '/app/attendance/reports', icon: null },
    ],
  },
  {
    label: 'Appointments',
    icon: <CalendarClock size={20} />,
    children: [
      { label: 'Teacher Consultation Booking', path: '/app/appointments/booking', icon: null },
      { label: 'Teacher Availability', path: '/app/appointments/availability', icon: null },
      { label: 'Appointment Calendar', path: '/app/appointments/calendar', icon: null },
    ],
  },
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
  {
    label: 'Portfolio',
    icon: <Briefcase size={20} />,
    children: [
      { label: 'Student Work Gallery', path: '/app/portfolio/gallery', icon: null },
      { label: 'Assignment Submission', path: '/app/portfolio/submissions', icon: null },
      { label: 'Teacher Feedback', path: '/app/portfolio/feedback', icon: null },
    ],
  },
  {
    label: 'Certificates',
    icon: <Award size={20} />,
    children: [
      { label: 'Completion Certificates', path: '/app/certificates/completion', icon: null },
      { label: 'Full Attendance Certificates', path: '/app/certificates/attendance', icon: null },
    ],
  },
  {
    label: 'Communications',
    icon: <MessageSquare size={20} />,
    children: [
      { label: 'WhatsApp', path: '/app/communications/whatsapp', icon: null },
      { label: 'Email', path: '/app/communications/email', icon: null },
      { label: 'Broadcast Messages', path: '/app/communications/broadcast', icon: null },
      { label: 'Templates', path: '/app/communications/templates', icon: null },
    ],
  },
  {
    label: 'Survey & Feedback',
    path: '/app/survey',
    icon: <BarChart3 size={20} />,
    roles: ['admin', 'super-admin'],
  },
  {
    label: 'Reports',
    path: '/app/reports',
    icon: <BarChart3 size={20} />,
  },
  {
    label: 'Document Center',
    path: '/app/documents',
    icon: <FolderOpen size={20} />,
  },
  {
    label: 'User Management',
    path: '/app/users',
    icon: <Shield size={20} />,
    roles: ['admin', 'super-admin'],
  },
  {
    label: 'Audit Logs',
    path: '/app/audit',
    icon: <History size={20} />,
    roles: ['admin', 'super-admin'],
  },
  {
    label: 'Settings',
    path: '/app/settings',
    icon: <SettingsIcon size={20} />,
  },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [userRole, setUserRole] = useState('admin');

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'admin';
    setUserRole(role);
  }, []);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const filterNavItemsByRole = (items: NavItem[]): NavItem[] => {
    return items
      .filter((item) => !item.roles || item.roles.includes(userRole))
      .map((item) => ({
        ...item,
        children: item.children ? filterNavItemsByRole(item.children) : undefined,
      }));
  };

  const filteredNavigation = filterNavItemsByRole(navigationItems);

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#284342] transform transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col`}
      >
        {/* Header */}
        <div className="p-6 border-b border-[rgba(233,218,149,0.2)]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl text-[#e9da95]">JEP Academy</h1>
              <p className="text-xs text-[#e9da95]/70 mt-1">Management System</p>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden text-[#e9da95] hover:bg-[rgba(233,218,149,0.15)] p-2 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredNavigation.map((item) => (
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
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          to={child.path!}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive(child.path!)
                              ? 'bg-[rgba(233,218,149,0.15)] text-[#e9da95]'
                              : 'text-[#e9da95]/70 hover:bg-[rgba(233,218,149,0.1)] hover:text-[#e9da95]'
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
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-[rgba(233,218,149,0.2)]">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#e9da95] flex items-center justify-center text-[#284342]">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm text-[#e9da95]">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1).replace('-', ' ')}
              </p>
              <p className="text-xs text-[#e9da95]/70">user@jepacademy.com</p>
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

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-[#284342] text-[#e9da95]"
      >
        <Menu size={24} />
      </button>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Header Bar with Language Switcher */}
        <div className="bg-white border-b border-[rgba(40,67,66,0.1)] px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1"></div>

            {/* Language Switcher */}
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
                  ></div>
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
                      <div className="flex items-center justify-between">
                        <span>English</span>
                        {language === 'en' && (
                          <div className="w-2 h-2 rounded-full bg-[#284342]"></div>
                        )}
                      </div>
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
                      <div className="flex items-center justify-between">
                        <span>中文 (Chinese)</span>
                        {language === 'zh' && (
                          <div className="w-2 h-2 rounded-full bg-[#284342]"></div>
                        )}
                      </div>
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
