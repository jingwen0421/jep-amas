interface BusinessInsight {
  title: string;
  description: string;
}

export default function BusinessInsights({
  insights,
}: {
  insights: BusinessInsight[];
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">

      <h2 className="text-xl text-[#284342] mb-6">
        Business Insights
      </h2>

      <div className="space-y-4">

        {insights.map((item) => (

          <div
            key={item.title}
            className="rounded-lg bg-[#f8f8f6] p-4"
          >

            <h3 className="text-[#284342]">
              {item.title}
            </h3>

            <p className="text-sm text-[#6b6b6b] mt-2">
              {item.description}
            </p>

          </div>

        ))}

      </div>

    </div>
  );
}