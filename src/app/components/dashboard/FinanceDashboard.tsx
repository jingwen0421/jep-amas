import { CreditCard, Receipt, FileText, AlertCircle, DollarSign } from 'lucide-react';
import { Link } from 'react-router';
import { getCurrentUser } from '../../utils/session';

export default function FinanceDashboard() {
  const user = getCurrentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">
          Finance Dashboard
        </h1>
        <p className="text-[#6b6b6b] mt-1">
          Welcome, {user.name}. Manage payments, receipts, outstanding balances and finance reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <FinanceCard icon={<DollarSign size={24} />} label="Today’s Collection" value="RM 0" />
        <FinanceCard icon={<AlertCircle size={24} />} label="Outstanding" value="RM 0" />
        <FinanceCard icon={<Receipt size={24} />} label="Receipts" value="0" />
        <FinanceCard icon={<CreditCard size={24} />} label="Pending Payments" value="0" />
      </div>

      <Panel title="Finance Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickLink to="/app/payments/installments" icon={<CreditCard size={22} />} label="Record Payment" />
          <QuickLink to="/app/payments/receipts" icon={<Receipt size={22} />} label="View Receipts" />
          <QuickLink to="/app/payments/outstanding" icon={<AlertCircle size={22} />} label="Outstanding Balances" />
          <QuickLink to="/app/reports" icon={<FileText size={22} />} label="Finance Reports" />
        </div>
      </Panel>
    </div>
  );
}

function FinanceCard({
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