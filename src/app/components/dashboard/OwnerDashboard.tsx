import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  DollarSign,
  CreditCard,
  Users,
  ShieldCheck,
  FileText,
  Target,
  FolderOpen,
  ScrollText,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../utils/session';
import { useLanguage } from '../../context/LanguageContext';

export default function OwnerDashboard() {
  const currentUser = getCurrentUser();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);

  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [collectedThisMonth, setCollectedThisMonth] = useState(0);
  const [activeStudents, setActiveStudents] = useState(0);
  const [staffAccounts, setStaffAccounts] = useState(0);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);

    const currentMonth = new Date().toISOString().slice(0, 7);

    const [plansRes, studentsRes, usersRes] = await Promise.all([
      supabase
        .from('payment_plans')
        .select('id, final_amount, status, installments(amount, status, paid_date)'),
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .neq('role', 'student'),
    ]);

    const plans = plansRes.data || [];

    let outstanding = 0;
    let collectedMonth = 0;

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
      });
    });

    setTotalOutstanding(outstanding);
    setCollectedThisMonth(collectedMonth);
    setActiveStudents(studentsRes.count || 0);
    setStaffAccounts(usersRes.count || 0);

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">{t('dashboard.title.owner')}</h1>
        <p className="text-[#6b6b6b] mt-1">
          {t('dashboard.owner.welcome', { name: currentUser.name })}
        </p>
      </div>

      {loading && (
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
          {t('dashboard.loading')}
        </div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={<CreditCard size={24} />}
              color="#d4183d"
              label={t('dashboard.finance.totalOutstanding')}
              value={`RM ${totalOutstanding.toLocaleString()}`}
              subtitle={t('dashboard.finance.acrossAllStudents')}
            />
            <StatCard
              icon={<DollarSign size={24} />}
              color="#2d8659"
              label={t('dashboard.finance.collectedThisMonth')}
              value={`RM ${collectedThisMonth.toLocaleString()}`}
              subtitle={t('dashboard.finance.paymentsReceived')}
            />
            <StatCard
              icon={<Users size={24} />}
              color="#284342"
              label={t('dashboard.owner.activeStudents')}
              value={activeStudents}
              subtitle={t('dashboard.owner.activeStudentsSub')}
            />
            <StatCard
              icon={<ShieldCheck size={24} />}
              color="#284342"
              label={t('dashboard.owner.staffAccounts')}
              value={staffAccounts}
              subtitle={t('dashboard.owner.staffAccountsSub')}
            />
          </div>

          <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
            <h2 className="text-xl text-[#284342] mb-4">{t('dashboard.owner.quickActions')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <QuickAction to="/app/reports" icon={<FileText size={22} />} label={t('dashboard.finance.reports')} />
              <QuickAction to="/app/payments/outstanding" icon={<CreditCard size={22} />} label={t('dashboard.finance.outstanding')} />
              <QuickAction to="/app/crm" icon={<Target size={22} />} label={t('dashboard.owner.crm')} />
              <QuickAction to="/app/users" icon={<Users size={22} />} label={t('dashboard.owner.userManagement')} />
              <QuickAction to="/app/audit" icon={<ScrollText size={22} />} label={t('dashboard.owner.auditLogs')} />
              <QuickAction to="/app/documents" icon={<FolderOpen size={22} />} label={t('dashboard.owner.documents')} />
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
