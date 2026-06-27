import { ClipboardCheck, CreditCard, Award, Bell, Calendar } from 'lucide-react';
import { Link } from 'react-router';
import { getCurrentUser } from '../../utils/session';

export default function ParentDashboard() {
  const user = getCurrentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">
          Parent / Guardian Dashboard
        </h1>
        <p className="text-[#6b6b6b] mt-1">
          Welcome, {user.name}. View your child’s progress, attendance, payment status and certificates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ParentCard icon={<ClipboardCheck size={24} />} label="Attendance" value="-" />
        <ParentCard icon={<CreditCard size={24} />} label="Payment Status" value="-" />
        <ParentCard icon={<Award size={24} />} label="Certificates" value="-" />
        <ParentCard icon={<Calendar size={24} />} label="Upcoming Class" value="-" />
      </div>

      <Panel title="Parent Access">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickLink to="/app/certificates/completion" icon={<Award size={22} />} label="View Completion Certificate" />
          <QuickLink to="/app/certificates/attendance" icon={<Award size={22} />} label="View Attendance Certificate" />
          <QuickLink to="/app/notifications" icon={<Bell size={22} />} label="View Notifications" />
        </div>

        <p className="text-sm text-[#6b6b6b] mt-5">
          Parent account is read-only and should only display linked child information.
        </p>
      </Panel>
    </div>
  );
}

function ParentCard({
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