import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { DollarSign, CreditCard, AlertCircle, TrendingUp, FileText, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../utils/session';

interface OverdueInstallment {
  id: string;
  studentName: string;
  amount: number;
  dueDate: string;
}

export default function FinanceDashboard() {
  const currentUser = getCurrentUser();
  const [loading, setLoading] = useState(true);

  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [collectedThisMonth, setCollectedThisMonth] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [activePlans, setActivePlans] = useState(0);
  const [overdueInstallments, setOverdueInstallments] = useState<OverdueInstallment[]>(
    []
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);

    const today = new Date().toISOString().slice(0, 10);
    const currentMonth = new Date().toISOString().slice(0, 7);

    const [plansRes, overdueRes] = await Promise.all([
      supabase
        .from('payment_plans')
        .select(`id, final_amount, status, installments(amount, status, due_date, paid_date)`),

      supabase
        .from('installments')
        .select(`
          id,
          amount,
          due_date,
          status,
          payment_plans(students(full_name))
        `)
        .lt('due_date', today)
        .neq('status', 'paid')
        .order('due_date', { ascending: true })
        .limit(8),
    ]);

    const plans = plansRes.data || [];

    let outstanding = 0;
    let collectedMonth = 0;
    let overdue = 0;

    plans.forEach((plan: any) => {
      const installments = plan.installments || [];
      const paid = installments
        .filter((i: any) => String(i.status).toLowerCase() === 'paid')
        .reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);

      outstanding += Math.max(Number(plan.final_amount || 0) - paid, 0);

      installments.forEach((i: any) => {
        if (
          String(i.status).toLowerCase() === 'paid' &&
          i.paid_date &&
          String(i.paid_date).slice(0, 7) === currentMonth
        ) {
          collectedMonth += Number(i.amount || 0);
        }

        if (String(i.status).toLowerCase() !== 'paid' && i.due_date < today) {
          overdue += 1;
        }
      });
    });

    setTotalOutstanding(outstanding);
    setCollectedThisMonth(collectedMonth);
    setOverdueCount(overdue);
    setActivePlans(plans.filter((p: any) => p.status === 'active').length);

    setOverdueInstallments(
      (overdueRes.data || []).map((inst: any) => {
        const plan = getSingle(inst.payment_plans);
        const student = getSingle(plan?.students);
        return {
          id: inst.id,
          studentName: student?.full_name || 'Student',
          amount: Number(inst.amount || 0),
          dueDate: inst.due_date,
        };
      })
    );

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">Finance Dashboard</h1>
        <p className="text-[#6b6b6b] mt-1">Welcome back, {currentUser.name}</p>
      </div>

      {loading && (
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
          Loading financial overview...
        </div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={<CreditCard size={24} />}
              color="#d4183d"
              label="Total Outstanding"
              value={`RM ${totalOutstanding.toLocaleString()}`}
              subtitle="Across all students"
            />
            <StatCard
              icon={<DollarSign size={24} />}
              color="#2d8659"
              label="Collected This Month"
              value={`RM ${collectedThisMonth.toLocaleString()}`}
              subtitle="Payments received"
            />
            <StatCard
              icon={<AlertCircle size={24} />}
              color="#d4183d"
              label="Overdue Installments"
              value={overdueCount}
              subtitle="Past due date"
            />
            <StatCard
              icon={<TrendingUp size={24} />}
              color="#284342"
              label="Active Payment Plans"
              value={activePlans}
              subtitle="Currently in progress"
            />
          </div>

          <Panel title="Overdue Installments" actionLabel="View Outstanding" actionLink="/app/payments/outstanding">
            <div className="space-y-3">
              {overdueInstallments.length === 0 && (
                <p className="text-sm text-[#6b6b6b]">No overdue installments. Great work!</p>
              )}
              {overdueInstallments.map((inst) => (
                <div
                  key={inst.id}
                  className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm text-[#284342]">{inst.studentName}</p>
                    <p className="text-xs text-[#6b6b6b] mt-1">
                      Due {new Date(inst.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm text-red-700">
                    RM {inst.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
            <h2 className="text-xl text-[#284342] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickAction to="/app/payments/installments" icon={<DollarSign size={22} />} label="Record Payment" />
              <QuickAction to="/app/payments/outstanding" icon={<CreditCard size={22} />} label="Outstanding" />
              <QuickAction to="/app/students/list" icon={<Users size={22} />} label="Students" />
              <QuickAction to="/app/reports" icon={<FileText size={22} />} label="Reports" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  color,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] hover:shadow-lg transition-shadow">
      <div
        className="p-3 rounded-lg inline-block mb-4"
        style={{ backgroundColor: `${color}15` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <h3 className="text-sm text-[#6b6b6b] mb-1">{label}</h3>
      <p className="text-2xl text-[#284342]">{value}</p>
      <p className="text-xs text-[#6b6b6b] mt-2">{subtitle}</p>
    </div>
  );
}

function Panel({
  title,
  actionLabel,
  actionLink,
  children,
}: {
  title: string;
  actionLabel: string;
  actionLink: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl text-[#284342]">{title}</h2>
        <Link to={actionLink} className="text-sm text-[#284342] hover:underline">
          {actionLabel}
        </Link>
      </div>
      {children}
    </div>
  );
}

function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="p-4 rounded-lg border border-[rgba(40,67,66,0.1)] hover:border-[#e9da95] hover:bg-[#e9da95]/10 transition-colors text-center"
    >
      <div className="mx-auto mb-2 text-[#284342] flex justify-center">{icon}</div>
      <span className="text-sm text-[#284342]">{label}</span>
    </Link>
  );
}

function getSingle(value: any) {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}
