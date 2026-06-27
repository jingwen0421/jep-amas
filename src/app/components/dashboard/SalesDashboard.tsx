import { Users, PhoneCall, TrendingUp, AlertCircle, CreditCard } from 'lucide-react';
import { Link } from 'react-router';
import { getCurrentUser } from '../../utils/session';

export default function SalesDashboard() {
  const user = getCurrentUser();
  const isExternal = user.role === 'external_sales';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">
          Sales Dashboard
        </h1>
        <p className="text-[#6b6b6b] mt-1">
          Welcome, {user.name}. {isExternal ? 'External Sales access is limited to assigned students and follow-ups.' : 'Manage leads, student follow-ups and sales-related payment reminders.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SalesCard icon={<Users size={24} />} label="My Leads" value="0" />
        <SalesCard icon={<PhoneCall size={24} />} label="Follow Ups" value="0" />
        <SalesCard icon={<TrendingUp size={24} />} label="Conversion" value="0%" />
        <SalesCard icon={<AlertCircle size={24} />} label="Payment Reminders" value="0" />
      </div>

      <Panel title="Sales Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickLink to="/app/students/list" icon={<Users size={22} />} label="Assigned Students" />
          <QuickLink to="/app/payments/outstanding" icon={<CreditCard size={22} />} label="Payment Follow Up" />

          {!isExternal && (
            <QuickLink to="/app/reports" icon={<TrendingUp size={22} />} label="Sales Reports" />
          )}
        </div>
      </Panel>
    </div>
  );
}

function SalesCard({
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