import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  BookOpen,
} from 'lucide-react';

interface DashboardCard {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color: string;
}

export default function Dashboard() {
  const [userRole, setUserRole] = useState('admin');

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'admin';
    setUserRole(role);
  }, []);

  const adminCards: DashboardCard[] = [
    {
      title: 'Active Students',
      value: 148,
      change: '+12%',
      icon: <Users size={24} />,
      color: '#284342',
    },
    {
      title: 'Active Classes',
      value: 23,
      change: '+5%',
      icon: <Calendar size={24} />,
      color: '#6b8e8d',
    },
    {
      title: 'Outstanding Fees',
      value: 'RM 45,280',
      change: '-8%',
      icon: <DollarSign size={24} />,
      color: '#d4183d',
    },
    {
      title: 'Attendance Rate',
      value: '94.2%',
      change: '+2.1%',
      icon: <CheckCircle2 size={24} />,
      color: '#2d8659',
    },
  ];

  const ownerCards: DashboardCard[] = [
    {
      title: 'Monthly Revenue',
      value: 'RM 182,450',
      change: '+18%',
      icon: <TrendingUp size={24} />,
      color: '#284342',
    },
    {
      title: 'New Enrollments',
      value: 32,
      change: '+24%',
      icon: <Users size={24} />,
      color: '#6b8e8d',
    },
    {
      title: 'Outstanding Collections',
      value: 'RM 45,280',
      change: '-12%',
      icon: <DollarSign size={24} />,
      color: '#d4183d',
    },
    {
      title: 'Student Satisfaction',
      value: '4.8/5.0',
      change: '+0.3',
      icon: <CheckCircle2 size={24} />,
      color: '#2d8659',
    },
  ];

  const todaysClasses = [
    { time: '09:00 AM', course: 'Bridal Makeup Essentials', teacher: 'Juju Lim', room: 'Studio A', students: 12 },
    { time: '11:00 AM', course: 'Airbrush Techniques', teacher: 'Esther', room: 'Studio B', students: 8 },
    { time: '02:00 PM', course: 'Special Effects Makeup', teacher: 'Wong Yi Feng', room: 'Studio C', students: 10 },
    { time: '04:00 PM', course: 'Portfolio Development', teacher: 'Pauline Tang', room: 'Studio A', students: 15 },
  ];

  const pendingApprovals = [
    { name: 'Jessica Lim', course: 'Professional Makeup Artist Course', date: '2026-06-01', status: 'Pending' },
    { name: 'Amanda Ng', course: 'Bridal Makeup Specialist', date: '2026-06-01', status: 'Pending' },
    { name: 'Rachel Tan', course: 'Advanced Airbrush Course', date: '2026-05-31', status: 'Pending' },
  ];

  const paymentsDueThisWeek = [
    { student: 'Melissa Chong', amount: 'RM 2,500', course: 'Professional Makeup Course', dueDate: '2026-06-04' },
    { student: 'Grace Lim', amount: 'RM 1,800', course: 'Bridal Specialist Course', dueDate: '2026-06-05' },
    { student: 'Vivian Lee', amount: 'RM 3,200', course: 'Advanced Beauty Course', dueDate: '2026-06-06' },
  ];

  const cards = userRole === 'owner' ? ownerCards : adminCards;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342] mb-2">
          {userRole === 'owner' ? 'Owner Dashboard' : 'Admin Dashboard'}
        </h1>
        <p className="text-[#6b6b6b]">Welcome back to JEP Image Makeup Academy</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${card.color}15` }}
              >
                <div style={{ color: card.color }}>{card.icon}</div>
              </div>
              {card.change && (
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    card.change.startsWith('+') || card.change.startsWith('-')
                      ? card.change.startsWith('+')
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {card.change}
                </span>
              )}
            </div>
            <h3 className="text-sm text-[#6b6b6b] mb-1">{card.title}</h3>
            <p className="text-2xl text-[#284342]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl text-[#284342]">Today's Classes</h2>
            <Link to="/app/classes/calendar" className="text-sm text-[#284342] hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {todaysClasses.map((cls, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 rounded-lg bg-[#f8f8f6] hover:bg-[#e9da95]/20 transition-colors"
              >
                <div className="flex flex-col items-center">
                  <Clock size={20} className="text-[#284342] mb-1" />
                  <span className="text-xs text-[#6b6b6b]">{cls.time}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm text-[#284342] mb-1">{cls.course}</h3>
                  <p className="text-xs text-[#6b6b6b]">
                    {cls.teacher} • {cls.room} • {cls.students} students
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Approvals */}
        {(userRole === 'admin' || userRole === 'super-admin') && (
          <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xl text-[#284342]">Pending Approvals</h2>
                <span className="bg-[#d4183d] text-white text-xs px-2 py-1 rounded-full">
                  {pendingApprovals.length}
                </span>
              </div>
              <Link to="/app/students/approval" className="text-sm text-[#284342] hover:underline">
                Review All
              </Link>
            </div>
            <div className="space-y-3">
              {pendingApprovals.map((approval, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border border-[rgba(40,67,66,0.1)] hover:border-[#e9da95] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm text-[#284342]">{approval.name}</h3>
                    <AlertCircle size={16} className="text-[#d4183d]" />
                  </div>
                  <p className="text-xs text-[#6b6b6b] mb-2">{approval.course}</p>
                  <p className="text-xs text-[#6b6b6b]">Applied: {approval.date}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payments Due This Week */}
        {(userRole === 'finance' || userRole === 'admin' || userRole === 'super-admin' || userRole === 'owner') && (
          <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-[#284342]">Payments Due This Week</h2>
              <Link to="/app/payments/outstanding" className="text-sm text-[#284342] hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {paymentsDueThisWeek.map((payment, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border border-[rgba(40,67,66,0.1)] hover:border-[#e9da95] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm text-[#284342]">{payment.student}</h3>
                      <p className="text-xs text-[#6b6b6b] mt-1">{payment.course}</p>
                    </div>
                    <p className="text-sm text-[#d4183d]">{payment.amount}</p>
                  </div>
                  <p className="text-xs text-[#6b6b6b]">Due: {payment.dueDate}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
        <h2 className="text-xl text-[#284342] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/app/students/registration"
            className="p-4 rounded-lg border border-[rgba(40,67,66,0.1)] hover:border-[#e9da95] hover:bg-[#e9da95]/10 transition-colors text-center"
          >
            <Users size={24} className="mx-auto mb-2 text-[#284342]" />
            <span className="text-sm text-[#284342]">New Student</span>
          </Link>
          <Link
            to="/app/classes/scheduling"
            className="p-4 rounded-lg border border-[rgba(40,67,66,0.1)] hover:border-[#e9da95] hover:bg-[#e9da95]/10 transition-colors text-center"
          >
            <Calendar size={24} className="mx-auto mb-2 text-[#284342]" />
            <span className="text-sm text-[#284342]">Schedule Class</span>
          </Link>
          <Link
            to="/app/attendance/daily"
            className="p-4 rounded-lg border border-[rgba(40,67,66,0.1)] hover:border-[#e9da95] hover:bg-[#e9da95]/10 transition-colors text-center"
          >
            <CheckCircle2 size={24} className="mx-auto mb-2 text-[#284342]" />
            <span className="text-sm text-[#284342]">Take Attendance</span>
          </Link>
          <Link
            to="/app/payments/receipts"
            className="p-4 rounded-lg border border-[rgba(40,67,66,0.1)] hover:border-[#e9da95] hover:bg-[#e9da95]/10 transition-colors text-center"
          >
            <DollarSign size={24} className="mx-auto mb-2 text-[#284342]" />
            <span className="text-sm text-[#284342]">Record Payment</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
