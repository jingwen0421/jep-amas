import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useLanguage } from '../../context/LanguageContext';

export default function PaymentCollectionChart({
  collected,
}: {
  collected: number;
}) {
  const { t } = useLanguage();

  const data = [
    {
      name: t('reports.chart.collected'),
      value: collected,
    },
    {
      name: t('reports.chart.outstanding'),
      value: 100 - collected,
    },
  ];

  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">

      <h2 className="text-lg text-[#284342] mb-6">
        {t('reports.chart.paymentCollection')}
      </h2>

      <ResponsiveContainer width="100%" height={280}>

        <PieChart>

          <Pie
            data={data}
            dataKey="value"
            outerRadius={90}
            label
          >

            <Cell fill="#284342"/>

            <Cell fill="#e9da95"/>

          </Pie>

          <Tooltip/>

        </PieChart>

      </ResponsiveContainer>

    </div>
  );
}