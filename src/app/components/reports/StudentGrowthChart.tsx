import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLanguage } from '../../context/LanguageContext';

interface ChartPoint {
  label: string;
  value: number;
}

export default function StudentGrowthChart({
  data,
}: {
  data: ChartPoint[];
}) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">

      <h2 className="text-lg text-[#284342] mb-6">
        {t('reports.chart.studentGrowth')}
      </h2>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="label" />

          <YAxis />

          <Tooltip />

          <Area
            type="monotone"
            dataKey="value"
            stroke="#284342"
            fill="#e9da95"
          />
        </AreaChart>
      </ResponsiveContainer>

    </div>
  );
}