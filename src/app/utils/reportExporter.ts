import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

export interface ReportRow {
  [key: string]: string | number;
}

export interface GeneratedReport {
  title: string;
  reportType: string;
  generatedAt: string;
  summary: {
    label: string;
    value: string;
  }[];
  rows: ReportRow[];
}

export async function downloadReportPDF(
  report: GeneratedReport,
  filters: Record<string, any>
) {
  const pdf = new jsPDF('p', 'mm', 'a4');

  pdf.setFontSize(18);
  pdf.text('JEP Image Makeup Academy', 14, 16);

  pdf.setFontSize(14);
  pdf.text(report.title, 14, 26);

  pdf.setFontSize(10);
  pdf.text(`Generated: ${report.generatedAt}`, 14, 34);

  autoTable(pdf, {
    startY: 44,
    head: [['Metric', 'Value']],
    body: report.summary.map((item) => [item.label, item.value]),
    theme: 'grid',
    headStyles: {
      fillColor: [40, 67, 66],
      textColor: [233, 218, 149],
    },
    styles: {
      fontSize: 10,
    },
  });

  const startY = (pdf as any).lastAutoTable.finalY + 12;

  const headers = Object.keys(report.rows[0] || {});
  const body = report.rows.map((row) =>
    headers.map((header) => String(row[header] ?? '-'))
  );

  pdf.setFontSize(12);
  pdf.text('Report Details', 14, startY);

  autoTable(pdf, {
    startY: startY + 6,
    head: [headers],
    body,
    theme: 'striped',
    headStyles: {
      fillColor: [40, 67, 66],
      textColor: [233, 218, 149],
    },
    alternateRowStyles: {
      fillColor: [248, 248, 246],
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
    },
  });

  const pageCount = pdf.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.text(
      `Page ${i} of ${pageCount}`,
      pdf.internal.pageSize.getWidth() - 30,
      pdf.internal.pageSize.getHeight() - 10
    );
  }

  const blob = pdf.output('blob');
  const fileName = `${report.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  const filePath = `${report.reportType}/${fileName}`;

  const { error } = await supabase.storage
    .from('generated-reports')
    .upload(filePath, blob, {
      contentType: 'application/pdf',
      upsert: true,
    });

  let fileUrl = '';

  if (!error) {
    const { data } = supabase.storage
      .from('generated-reports')
      .getPublicUrl(filePath);

    fileUrl = data.publicUrl;

    await supabase.from('generated_reports').insert({
      report_type: report.reportType,
      filters,
      file_url: fileUrl,
      created_at: new Date().toISOString(),
    });
  }

  pdf.save(fileName);

  return fileUrl;
}

export function downloadReportExcel(report: GeneratedReport) {
  const summarySheet = XLSX.utils.json_to_sheet(report.summary);
  const detailSheet = XLSX.utils.json_to_sheet(report.rows);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Details');

  autoFitColumns(summarySheet, report.summary);
  autoFitColumns(detailSheet, report.rows);

  XLSX.writeFile(
    workbook,
    `${report.title.replace(/\s+/g, '_')}_${Date.now()}.xlsx`
  );
}

export function printReport(report: GeneratedReport) {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Unable to open print window.');
    return;
  }

  printWindow.document.write(generatePrintableHtml(report));
  printWindow.document.close();
  printWindow.print();
}

function autoFitColumns(worksheet: XLSX.WorkSheet, rows: any[]) {
  const headers = Object.keys(rows[0] || {});

  worksheet['!cols'] = headers.map((header) => {
    const maxLength = Math.max(
      header.length,
      ...rows.map((row) => String(row[header] ?? '').length)
    );

    return {
      wch: Math.min(maxLength + 2, 40),
    };
  });
}

function generatePrintableHtml(report: GeneratedReport) {
  const headers = Object.keys(report.rows[0] || {});

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${report.title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 32px;
      color: #284342;
    }

    h1 {
      margin-bottom: 4px;
    }

    .muted {
      color: #6b6b6b;
      font-size: 13px;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 24px 0;
    }

    .card {
      background: #f8f8f6;
      border-radius: 10px;
      padding: 14px;
      text-align: center;
    }

    .card strong {
      display: block;
      font-size: 20px;
      margin-top: 6px;
      color: #284342;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
      font-size: 12px;
    }

    th {
      background: #284342;
      color: #e9da95;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }

    tr:nth-child(even) {
      background: #f8f8f6;
    }
  </style>
</head>

<body>
  <h1>JEP Image Makeup Academy</h1>
  <h2>${report.title}</h2>
  <p class="muted">Generated: ${report.generatedAt}</p>

  <div class="summary">
    ${report.summary
      .map(
        (item) => `
      <div class="card">
        <span>${item.label}</span>
        <strong>${item.value}</strong>
      </div>
    `
      )
      .join('')}
  </div>

  <table>
    <thead>
      <tr>
        ${headers.map((header) => `<th>${header}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${report.rows
        .map(
          (row) => `
        <tr>
          ${headers.map((header) => `<td>${row[header] ?? '-'}</td>`).join('')}
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>
`;
}