import { Download } from 'lucide-react';

export default function ReportHistory({
  reports,
}: {
  reports: any[];
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">

      <h2 className="text-xl text-[#284342] mb-6">
        Recent Reports
      </h2>

      <div className="space-y-4">

        {reports.length===0 &&

        <p className="text-[#6b6b6b]">
          No reports generated yet.
        </p>

        }

        {reports.map(report=>(

          <div
            key={report.id}
            className="flex justify-between items-center rounded-lg bg-[#f8f8f6] p-4"
          >

            <div>

              <p className="text-[#284342]">
                {report.report_type}
              </p>

              <p className="text-sm text-[#6b6b6b]">
                {new Date(report.created_at).toLocaleString()}
              </p>

            </div>

            {report.file_url &&

            <button
              onClick={()=>window.open(report.file_url)}
            >

              <Download/>

            </button>

            }

          </div>

        ))}

      </div>

    </div>
  );
}