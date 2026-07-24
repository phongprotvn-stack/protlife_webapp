// Export utilities for Word, Excel, PDF
import { saveAs } from 'file-saver';

// ─── Excel (.xlsx) ───
export async function exportExcel(headers: string[], rows: Record<string, string>[], filename: string) {
  const XLSX = await import('xlsx');
  const data = rows.map(r => {
    const row: Record<string, string> = {};
    headers.forEach(h => { row[h] = r[h] || ''; });
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf]), `${filename}.xlsx`);
}

// ─── Word (.docx) ───
export async function exportWord(headers: string[], rows: Record<string, string>[], filename: string) {
  const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, TextRun, ShadingType } = await import('docx');

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(h => new TableCell({
      width: { size: Math.round(100 / headers.length), type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.SOLID, color: '#E6002D', fill: '#E6002D' },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18, font: 'Calibri' })],
      })],
    })),
  });

  const dataRows = rows.map(r =>
    new TableRow({
      children: headers.map(h => new TableCell({
        width: { size: Math.round(100 / headers.length), type: WidthType.PERCENTAGE },
        children: [new Paragraph({
          children: [new TextRun({ text: r[h] || '', size: 18, font: 'Calibri' })],
        })],
      })),
    })
  );

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
        },
      },
    },
    sections: [{
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: filename, bold: true, size: 28, font: 'Calibri' })],
        }),
        table,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
}

// ─── PDF ───
export async function exportPDF(headers: string[], rows: Record<string, string>[], filename: string) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Title
  doc.setFontSize(16);
  doc.setTextColor(230, 0, 45);
  doc.text(filename, 14, 20);

  // Subtitle
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Xuất lúc: ${new Date().toLocaleString('vi-VN')}`, 14, 27);

  // Table
  const tableData = rows.map(r => headers.map(h => r[h] || ''));
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 32,
    styles: {
      fontSize: 8,
      font: 'helvetica',
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: [230, 0, 45],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 247],
    },
    margin: { top: 30 },
  });

  doc.save(`${filename}.pdf`);
}
