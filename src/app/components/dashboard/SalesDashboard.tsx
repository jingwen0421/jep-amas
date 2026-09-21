import { useEffect, useState } from 'react';
import { Users, PhoneCall, TrendingUp, AlertCircle, CreditCard, Target } from 'lucide-react';
import { Link } from 'react-router';
import { getCurrentUser } from '../../utils/session';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';
import { getCRMDashboard } from '../../services/crmService';

export default function SalesDashboard() {
  const user = getCurrentUser();
  const { t } = useLanguage();
  const isExternal = user.role === 'external_sales';

  const [loading, setLoading] = useState(true);
  const [myLeads, setMyLeads] = useState(0);
  const [followUps, setFollowUps] = useState(0);
  const [conversion, setConversion] = useState(0);
  const [paymentReminders, setPaymentReminders] = useState(0);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);

    const today = new Date().toISOString().slice(0, 10);

    const [dashboard, followUpsRes, remindersRes] = await Promise.all([
      getCRMDashboard(user),
      supabase
        .from('crm_followups')
        .select('id, crm_leads!inner(owner_id)')
        .eq('crm_leads.owner_id', user.id)
        .gte('follow_date', today),
      supabase
        .from('crm_reminders')
        .select('id', { count: 'exact', head: true })
        .eq('salesperson_id', user.id)
        .eq('status', 'pending'),
    ]);

    setMyLeads(dashboard.totalLeads);
    setConversion(
      dashboard.totalLeads > 0
        ? Math.round((dashboard.convertedDeals / dashboard.totalLeads) * 100)
        : 0
    );
    setFollowUps((followUpsRes.data || []).length);
    setPaymentReminders(remindersRes.count || 0);

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">
          {t('dashboard.sales.title')}
        </h1>
        <p className="text-[#6b6b6b] mt-1">
          {t(isExternal ? 'dashboard.sales.welcomeExternal' : 'dashboard.sales.welcomeInternal', {
            name: user.name,
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SalesCard icon={<Users size={24} />} label={t('dashboard.sales.myLeads')} value={loading ? '-' : String(myLeads)} />
        <SalesCard icon={<PhoneCall size={24} />} label={t('dashboard.sales.followUps')} value={loading ? '-' : String(followUps)} />
        <SalesCard icon={<TrendingUp size={24} />} label={t('dashboard.sales.conversion')} value={loading ? '-' : `${conversion}%`} />
        <SalesCard icon={<AlertCircle size={24} />} label={t('dashboard.sales.paymentReminders')} value={loading ? '-' : String(paymentReminders)} />
      </div>

      <Panel title={t('dashboard.sales.quickActions')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickLink to="/app/crm" icon={<Target size={22} />} label={t('dashboard.sales.openCrm')} />
          <QuickLink to="/app/students/list" icon={<Users size={22} />} label={t('dashboard.sales.assignedStudents')} />
          <QuickLink to="/app/payments/outstanding" icon={<CreditCard size={22} />} label={t('dashboard.sales.paymentFollowUp')} />

          {!isExternal && (
            <QuickLink to="/app/reports" icon={<TrendingUp size={22} />} label={t('dashboard.sales.reports')} />
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
