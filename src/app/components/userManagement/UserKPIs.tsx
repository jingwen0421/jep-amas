import {
  Users,
  CheckCircle2,
  AlertCircle,
  Shield,
} from 'lucide-react';
import type { UserStats } from '../../types/user';

interface Props {
  stats: UserStats;
}

export default function UserKPIs({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <KPICard
        icon={<Users size={24} />}
        title="Total Users"
        value={stats.total}
        color="text-[#284342]"
      />

      <KPICard
        icon={<CheckCircle2 size={24} />}
        title="Active Users"
        value={stats.active}
        color="text-green-700"
      />

      <KPICard
        icon={<AlertCircle size={24} />}
        title="Inactive Users"
        value={stats.inactive}
        color="text-red-700"
      />

      <KPICard
        icon={<Shield size={24} />}
        title="Admin Access"
        value={stats.adminAccess}
        color="text-blue-700"
      />
    </div>
  );
}

function KPICard({
  icon,
  title,
  value,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)] hover:shadow-lg transition">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg bg-[#e9da95]/20 ${color}`}>
          {icon}
        </div>

        <div>
          <p className="text-sm text-[#6b6b6b]">
            {title}
          </p>

          <p className={`text-2xl ${color}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}