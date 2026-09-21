import { useLanguage } from '../../context/LanguageContext';

interface BusinessInsight {
  titleKey: string;
  descriptionKey: string;
  descriptionParams?: Record<string, string | number>;
}

export default function BusinessInsights({
  insights,
}: {
  insights: BusinessInsight[];
}) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">

      <h2 className="text-xl text-[#284342] mb-6">
        {t('reports.insights.title')}
      </h2>

      <div className="space-y-4">

        {insights.map((item) => (

          <div
            key={item.titleKey}
            className="rounded-lg bg-[#f8f8f6] p-4"
          >

            <h3 className="text-[#284342]">
              {t(item.titleKey)}
            </h3>

            <p className="text-sm text-[#6b6b6b] mt-2">
              {t(item.descriptionKey, item.descriptionParams)}
            </p>

          </div>

        ))}

      </div>

    </div>
  );
}