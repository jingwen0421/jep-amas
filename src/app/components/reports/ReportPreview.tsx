import { X, Download, Printer, FileText } from 'lucide-react';
import type { GeneratedReport } from '../../utils/reportExporter';
import { useLanguage } from '../../context/LanguageContext';

interface ReportPreviewProps {
  report: GeneratedReport;
  onClose: () => void;
  onDownloadPDF: () => void;
  onDownloadExcel: () => void;
  onPrint: () => void;
}

export default function ReportPreview({
  report,
  onClose,
  onDownloadPDF,
  onDownloadExcel,
  onPrint,
}: ReportPreviewProps) {
  const { t } = useLanguage();
  const headers = Object.keys(report.rows[0] || {});

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-[rgba(40,67,66,0.1)] flex items-center justify-between">
          <div>
            <h2 className="text-xl text-[#284342]">{report.title}</h2>
            <p className="text-sm text-[#6b6b6b] mt-1">
              {t('reports.preview.generatedLabel', { date: report.generatedAt })}
            </p>
          </div>

          <button onClick={onClose}>
            <X size={20} className="text-[#284342]" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {report.summary.map((item) => (
              <div
                key={item.label}
                className="p-4 rounded-lg bg-[#f8f8f6] text-center"
              >
                <p className="text-sm text-[#6b6b6b]">{item.label}</p>
                <p className="text-2xl text-[#284342] mt-1">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto border border-[rgba(40,67,66,0.1)] rounded-lg">
            <table className="w-full">
              <thead className="bg-[#f8f8f6]">
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-sm text-[#284342]"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[rgba(40,67,66,0.1)]">
                {report.rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={headers.length || 1}
                      className="px-4 py-8 text-center text-[#6b6b6b]"
                    >
                      {t('reports.preview.noData')}
                    </td>
                  </tr>
                )}

                {report.rows.map((row, index) => (
                  <tr key={index} className="hover:bg-[#f8f8f6]">
                    {headers.map((header) => (
                      <td
                        key={header}
                        className="px-4 py-3 text-sm text-[#6b6b6b]"
                      >
                        {String(row[header] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-6 border-t border-[rgba(40,67,66,0.1)] flex items-center gap-3 flex-wrap">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors"
          >
            {t('reports.preview.close')}
          </button>

          <button
            onClick={onDownloadPDF}
            className="px-6 py-3 bg-[#284342] text-[#e9da95] rounded-lg hover:bg-[#1a2f2e] transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            {t('reports.preview.downloadPdf')}
          </button>

          <button
            onClick={onDownloadExcel}
            className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors flex items-center gap-2"
          >
            <FileText size={16} />
            {t('reports.preview.excel')}
          </button>

          <button
            onClick={onPrint}
            className="px-6 py-3 rounded-lg border border-[rgba(40,67,66,0.2)] text-[#284342] hover:bg-[#f8f8f6] transition-colors flex items-center gap-2"
          >
            <Printer size={16} />
            {t('reports.preview.print')}
          </button>
        </div>
      </div>
    </div>
  );
}