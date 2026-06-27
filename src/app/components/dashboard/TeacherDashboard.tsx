import { Calendar, ClipboardCheck, Briefcase, MessageSquare, Clock, BookOpen } from 'lucide-react';
import { Link } from 'react-router';
import { getCurrentUser } from '../../utils/session';

export default function TeacherDashboard() {
  const user = getCurrentUser();
  const isAssistant = user.role === 'assistant_teacher';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">
          Welcome, {user.name}
        </h1>
        <p className="text-[#6b6b6b] mt-1">
          {isAssistant
            ? 'Assistant Teacher Portal: view assigned classes, attendance and student works.'
            : 'Teacher Portal: manage classes, attendance, portfolio review and lesson activities.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DashboardCard icon={<Calendar size={24} />} label="Today’s Classes" value="0" />
        <DashboardCard icon={<ClipboardCheck size={24} />} label="Attendance Tasks" value="0" />
        <DashboardCard icon={<Briefcase size={24} />} label="Portfolio Review" value="0" />
        <DashboardCard icon={<Clock size={24} />} label="Upcoming Appointments" value="0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Quick Actions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickLink to="/app/classes/calendar" icon={<Calendar size={22} />} label="View Teaching Calendar" />
            <QuickLink to="/app/attendance/daily" icon={<ClipboardCheck size={22} />} label="Take Attendance" />
            <QuickLink to="/app/portfolio/gallery" icon={<Briefcase size={22} />} label="View Student Works" />

            {!isAssistant && (
              <QuickLink to="/app/portfolio/feedback" icon={<MessageSquare size={22} />} label="Give Feedback" />
            )}

            {!isAssistant && (
              <QuickLink to="/app/courses/lessons" icon={<BookOpen size={22} />} label="Lesson Outline" />
            )}
          </div>
        </Panel>

        <Panel title="Teacher Notes">
          <p className="text-sm text-[#6b6b6b]">
            This dashboard focuses only on teaching-related tasks. Payment, reports, user management and system settings are hidden from teacher roles.
          </p>
        </Panel>
      </div>
    </div>
  );
}

function DashboardCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <div className="p-3 rounded-lg bg-[#e9da95]/20 text-[#284342] inline-block mb-4">
        {icon}
      </div>
      <p className="text-sm text-[#6b6b6b]">{label}</p>
      <p className="text-2xl text-[#284342] mt-1">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <h2 className="text-xl text-[#284342] mb-4">{title}</h2>
      {children}
    </div>
  );
}

function QuickLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="p-4 rounded-lg bg-[#f8f8f6] hover:bg-[#e9da95]/20 transition-colors flex items-center gap-3"
    >
      <div className="text-[#284342]">{icon}</div>
      <span className="text-sm text-[#284342]">{label}</span>
    </Link>
  );
}