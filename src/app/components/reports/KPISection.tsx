import {
  Users,
  BookOpen,
  CalendarDays,
  DollarSign,
  TrendingUp,
  CreditCard,
  Star,
  FolderCheck,
} from 'lucide-react';
import type { DashboardAnalytics } from '../../services/analyticsService';

interface KPISectionProps {
  stats: DashboardAnalytics;
}

export default function KPISection({ stats }: KPISectionProps) {
  const cards = [
    {
      label: 'Active Students',
      value: stats.activeStudents.toString(),
      icon: <Users size={24} className="text-[#284342]" />,
    },
    {
      label: 'Active Courses',
      value: stats.activeCourses.toString(),
      icon: <BookOpen size={24} className="text-[#284342]" />,
    },
    {
      label: 'Active Classes',
      value: stats.activeClasses.toString(),
      icon: <CalendarDays size={24} className="text-[#284342]" />,
    },
    {
      label: 'Revenue This Month',
      value: `RM ${stats.revenueThisMonth.toLocaleString()}`,
      icon: <DollarSign size={24} className="text-green-700" />,
    },
    {
      label: 'Attendance Rate',
      value: `${stats.attendanceRate}%`,
      icon: <TrendingUp size={24} className="text-blue-700" />,
    },
    {
      label: 'Outstanding Fees',
      value: `RM ${stats.outstandingFees.toLocaleString()}`,
      icon: <CreditCard size={24} className="text-red-700" />,
    },
    {
      label: 'Satisfaction Score',
      value: stats.satisfactionScore,
      icon: <Star size={24} className="text-[#e9da95] fill-[#e9da95]" />,
    },
    {
      label: 'Portfolio Completed',
      value: `${stats.portfolioCompleted}%`,
      icon: <FolderCheck size={24} className="text-[#284342]" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-[#e9da95]/20">
              {card.icon}
            </div>

            <div>
              <p className="text-sm text-[#6b6b6b]">{card.label}</p>
              <p className="text-2xl text-[#284342]">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}