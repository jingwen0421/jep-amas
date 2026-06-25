import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ChartPoint {
  label: string;
  value: number;
}

export default function AttendanceChart({
  data,
}: {
  data: ChartPoint[];
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">

      <h2 className="text-lg text-[#284342] mb-6">
        Attendance Trend
      </h2>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="label" />

          <YAxis />

          <Tooltip />

          <Bar
            dataKey="value"
            fill="#284342"
            radius={[5, 5, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

    </div>
  );
}