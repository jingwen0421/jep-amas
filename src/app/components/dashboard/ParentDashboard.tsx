import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Calendar, CheckCircle2, CreditCard, Award, GraduationCap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../utils/session';
import { useLanguage } from '../../context/LanguageContext';

interface ChildSummary {
  id: string;
  name: string;
  course: string;
  attendanceRate: number;
  outstanding: number;
  upcomingClasses: number;
  certificates: number;
}

export default function ParentDashboard() {
  const currentUser = getCurrentUser();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildSummary[]>([]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);

    if (!currentUser.id) {
      setLoading(false);
      return;
    }

    const { data: kids, error } = await supabase
      .from('students')
      .select('id, full_name, course')
      .eq('parent_user_id', currentUser.id);

    if (error || !kids || kids.length === 0) {
      setLoading(false);
      return;
    }

    const now = new Date().toISOString();

    const summaries = await Promise.all(
      kids.map(async (child: any) => {
        const [attendanceRes, plansRes, participantsRes, certsRes] = await Promise.all([
          supabase.from('attendance').select('attendance_status').eq('student_id', child.id),
          supabase
            .from('payment_plans')
            .select(`final_amount, installments(amount, status)`)
            .eq('student_id', child.id),
          supabase
            .from('lesson_participants')
            .select('id, lessons(lesson_datetime)')
            .eq('student_id', child.id),
          supabase
            .from('certificates')
            .select('id', { count: 'exact', head: true })
            .eq('student_id', child.id),
        ]);

        const attendanceRows = attendanceRes.data || [];
        const present = attendanceRows.filter((a: any) =>
          ['present', 'late'].includes(String(a.attendance_status).toLowerCase())
        ).length;
        const attendanceRate =
          attendanceRows.length > 0
            ? Math.round((present / attendanceRows.length) * 100)
            : 0;

        const plans = plansRes.data || [];
        const expected = plans.reduce(
          (sum: number, p: any) => sum + Number(p.final_amount || 0),
          0
        );
        const paid = plans.reduce((sum: number, p: any) => {
          return (
            sum +
            (p.installments || [])
              .filter((i: any) => String(i.status).toLowerCase() === 'paid')
              .reduce((acc: number, i: any) => acc + Number(i.amount || 0), 0)
          );
        }, 0);

        const upcomingClasses = (participantsRes.data || []).filter((p: any) => {
          const lesson = getSingle(p.lessons);
          return lesson?.lesson_datetime && lesson.lesson_datetime >= now;
        }).length;

        return {
          id: child.id,
          name: child.full_name || t('dashboard.parent.fallbackStudent'),
          course: child.course || '-',
          attendanceRate,
          outstanding: Math.max(expected - paid, 0),
          upcomingClasses,
          certificates: certsRes.count || 0,
        };
      })
    );

    setChildren(summaries);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#284342]">{t('dashboard.parent.title')}</h1>
        <p className="text-[#6b6b6b] mt-1">{t('dashboard.parent.welcome', { name: currentUser.name })}</p>
      </div>

      {loading && (
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
          {t('dashboard.parent.loading')}
        </div>
      )}

      {!loading && children.length === 0 && (
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] text-[#6b6b6b]">
          {t('dashboard.parent.noChildren')}
        </div>
      )}

      {!loading &&
        children.map((child) => (
          <div
            key={child.id}
            className="bg-white rounded-xl border border-[rgba(40,67,66,0.1)] overflow-hidden"
          >
            <div className="p-4 bg-[#f8f8f6] border-b border-[rgba(40,67,66,0.1)] flex items-center gap-3">
              <GraduationCap size={20} className="text-[#284342]" />
              <div>
                <h2 className="text-lg text-[#284342]">{child.name}</h2>
                <p className="text-xs text-[#6b6b6b]">{child.course}</p>
              </div>
            </div>

            <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MiniStat
                icon={<CheckCircle2 size={18} />}
                color="#2d8659"
                label={t('dashboard.parent.attendance')}
                value={`${child.attendanceRate}%`}
              />
              <MiniStat
                icon={<Calendar size={18} />}
                color="#284342"
                label={t('dashboard.parent.upcomingClasses')}
                value={child.upcomingClasses}
              />
              <MiniStat
                icon={<CreditCard size={18} />}
                color="#d4183d"
                label={t('dashboard.parent.outstanding')}
                value={`RM ${child.outstanding.toLocaleString()}`}
              />
              <MiniStat
                icon={<Award size={18} />}
                color="#6b8e8d"
                label={t('dashboard.parent.certificates')}
                value={child.certificates}
              />
            </div>
          </div>
        ))}

      {!loading && children.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
          <h2 className="text-xl text-[#284342] mb-4">{t('dashboard.parent.quickLinks')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <QuickAction to="/app/certificates/completion" icon={<Award size={22} />} label={t('dashboard.parent.completionCerts')} />
            <QuickAction to="/app/certificates/attendance" icon={<Award size={22} />} label={t('dashboard.parent.attendanceCerts')} />
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({
  icon,
  color,
  label,
  value,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="p-3 rounded-lg bg-[#f8f8f6]">
      <div className="flex items-center gap-2 mb-1" style={{ color }}>
        {icon}
      </div>
      <p className="text-xs text-[#6b6b6b]">{label}</p>
      <p className="text-lg text-[#284342]">{value}</p>
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
