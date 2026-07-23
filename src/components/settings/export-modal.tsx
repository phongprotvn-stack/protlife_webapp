'use client';

import { useState } from 'react';
import { contactService } from '@/lib/services/contact-service';
import { eventService } from '@/lib/services/event-service';
import { memoryService } from '@/lib/services/memory-service';
import { Modal } from '@/components/shared/modal';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType } from 'docx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface ExportModalProps {
  onClose: () => void;
}

type ExportFormat = 'word' | 'excel' | 'pdf';
type ExportScope = 'all' | 'contacts' | 'events' | 'memories';

interface RowData {
  [key: string]: any;
}

export default function ExportModal({ onClose }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [scope, setScope] = useState<ExportScope>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState<RowData[]>([]);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [error, setError] = useState('');

  const formatLabel: Record<ExportFormat, string> = {
    word: '📄 Word (.docx)',
    excel: '📊 Excel (.xlsx)',
    pdf: '📕 PDF',
  };

  const scopeLabel: Record<ExportScope, string> = {
    all: 'Tất cả',
    contacts: 'Người thân',
    events: 'Sự kiện',
    memories: 'Ký ức',
  };

  const handlePreview = async () => {
    setLoading(true); setError('');
    try {
      let rows: RowData[] = [];
      let cols: string[] = [];

      const scopeToFetch: ExportScope[] = scope === 'all' ? ['contacts', 'events', 'memories'] : [scope];

      for (const s of scopeToFetch) {
        let data: RowData[] = [];
        if (s === 'contacts') {
          const all = await contactService.getAll();
          data = (all as any[]).map(c => ({
            Loại: 'Người thân',
            Tên: c.Name,
            'Mối quan hệ': c.Relationship || '',
            'SĐT': c.Phone || '',
            Email: c.Email || '',
            'Ngày sinh': c.Birthday || '',
            'Ghi chú': c.Notes || '',
          }));
        } else if (s === 'events') {
          const all = await eventService.getAll();
          data = (all as any[]).map(e => ({
            Loại: 'Sự kiện',
            Tên: e.Title || e.Name,
            'Ngày bắt đầu': e.StartDate || '',
            'Ngày kết thúc': e.EndDate || '',
            'Loại sự kiện': e.EventType || '',
            'Địa điểm': e.Place || e.Location || '',
            'Ngân sách': e.Cost || e.Budget || '',
            'Ghi chú': e.Notes || '',
          }));
        } else if (s === 'memories') {
          const all = await memoryService.getAll();
          data = (all as any[]).map(m => ({
            'Loại': 'Ký ức',
            'Tiêu đề': m.Title,
            'Nội dung': m.Content || '',
            'Cảm xúc': m.MoodEmoji || '',
            'Ngày tạo': m.CreatedDate ? new Date(m.CreatedDate).toLocaleDateString('vi-VN') : '',
          }));
        }

        // Apply date filter if set
        if (dateFrom || dateTo) {
          data = data.filter(row => {
            const dateStr = row['Ngày bắt đầu'] || row.Ngày || row['Ngày sinh'] || row['Ngày tạo'] || '';
            if (!dateStr) return false;
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return true;
            if (dateFrom && d < new Date(dateFrom)) return false;
            if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
            return true;
          });
        }

        rows = rows.concat(data);
      }

      if (rows.length === 0) {
        setError('Không có dữ liệu trong phạm vi đã chọn');
        setPreview([]);
        setPreviewColumns([]);
        setLoading(false);
        return;
      }

      cols = Object.keys(rows[0]);
      setPreview(rows);
      setPreviewColumns(cols);
    } catch (e: any) {
      setError(e?.message || 'Lỗi khi tải dữ liệu');
    }
    setLoading(false);
  };

  const handleExport = async () => {
    if (preview.length === 0) {
      await handlePreview();
      if (preview.length === 0) return;
    }
    setExporting(true); setError('');

    try {
      const rows = preview.length > 0 ? preview : [];
      const cols = previewColumns.length > 0 ? previewColumns : Object.keys(rows[0] || {});

      if (format === 'excel') {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Dữ liệu');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `protlife_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else if (format === 'word') {
        const tableRows = rows.map(row =>
          new TableRow({
            children: cols.map(col =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: String(row[col] || ''), size: 18 })] })],
              })
            ),
          })
        );
        const headerRow = new TableRow({
          children: cols.map(col =>
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: col, bold: true, size: 18 })] })],
            })
          ),
        });

        const doc = new Document({
          sections: [{
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Báo cáo PROT LIFE', bold: true, size: 28 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}`, size: 18, color: '666666' })] }),
              new Paragraph({ spacing: { after: 200 }, children: [] }),
              new Table({
                rows: [headerRow, ...tableRows],
                width: { size: 100, type: WidthType.PERCENTAGE },
              }),
            ],
          }],
        });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `protlife_export_${new Date().toISOString().split('T')[0]}.docx`);
      } else if (format === 'pdf') {
        // Use html2canvas for proper Vietnamese rendering
        const hiddenDiv = document.createElement('div');
        hiddenDiv.style.cssText = 'position:fixed;left:-9999px;top:0;width:1024px;background:#fff;font-family:system-ui,-apple-system,sans-serif;padding:40px;z-index:9999';
        hiddenDiv.innerHTML = `
          <div style="text-align:center;margin-bottom:24px">
            <div style="font-size:20px;font-weight:700;color:#111">Báo cáo PROT LIFE</div>
            <div style="font-size:12px;color:#6B7280;margin-top:4px">Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}</div>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead>
              <tr style="background:#E6002D;color:#fff">
                ${cols.map(col => `<th style="padding:6px 8px;text-align:left;font-weight:600;border:1px solid #ddd">${col}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `<tr style="border-bottom:1px solid #eee">${cols.map(col => `<td style="padding:5px 8px;border:1px solid #ddd;color:#111">${String(row[col] || '')}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
          <div style="text-align:right;font-size:10px;color:#9CA3AF;margin-top:12px">Tổng: ${rows.length} dòng</div>
        `;
        document.body.appendChild(hiddenDiv);

        try {
          const canvas = await html2canvas(hiddenDiv, {
            scale: 2,
            useCORS: true,
            logging: false,
            windowWidth: 1024,
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          const pdf = new jsPDF('l', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`protlife_export_${new Date().toISOString().split('T')[0]}.pdf`);
        } finally {
          document.body.removeChild(hiddenDiv);
        }
      }

      toast('✅ Đã tải file xuống');
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Lỗi khi xuất file');
    }
    setExporting(false);
  };

  return (
    <Modal title="📄 Xuất báo cáo" open={true} onClose={onClose}>
      <div className="space-y-4">
        {/* Format */}
        <div>
          <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px] mb-2">Định dạng</p>
          <div className="flex gap-2">
            {(Object.keys(formatLabel) as ExportFormat[]).map(f => (
              <button key={f} onClick={() => setFormat(f)}
                className={`flex-1 py-2.5 rounded-[10px] text-[11px] font-semibold transition-all border ${
                  format === f
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                    : 'bg-white text-[#6B7280] border-[#EDEDF1] hover:border-[var(--color-primary)]'
                }`}>
                {formatLabel[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Scope */}
        <div>
          <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px] mb-2">Phạm vi</p>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(scopeLabel) as ExportScope[]).map(s => (
              <button key={s} onClick={() => setScope(s)}
                className={`px-3 py-1.5 rounded-[8px] text-[11px] font-semibold transition-all border ${
                  scope === s
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                    : 'bg-white text-[#6B7280] border-[#EDEDF1] hover:border-[var(--color-primary)]'
                }`}>
                {scopeLabel[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-medium text-[#6B7280] mb-1">Từ ngày</p>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-[8px] border border-[#EDEDF1] text-[12px] outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-[#6B7280] mb-1">Đến ngày</p>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full px-3 py-2 rounded-[8px] border border-[#EDEDF1] text-[12px] outline-none focus:border-[var(--color-primary)]" />
          </div>
        </div>

        {/* Preview */}
        <div>
          <button onClick={handlePreview} disabled={loading}
            className="w-full py-2 rounded-[8px] text-[11px] font-semibold bg-[rgba(0,0,0,0.04)] text-[#5F6368] hover:bg-[rgba(0,0,0,0.07)] transition-all disabled:opacity-50">
            {loading ? '⏳ Đang tải...' : '👁️ Xem trước dữ liệu'}
          </button>
        </div>

        {preview.length > 0 && (
          <div className="max-h-[200px] overflow-auto border border-[#EDEDF1] rounded-[8px]">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-[#F9F9FB] sticky top-0">
                  {previewColumns.map(col => (
                    <th key={col} className="px-2 py-1.5 text-left font-semibold text-[#6B7280] whitespace-nowrap border-b border-[#EDEDF1]">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-b border-[#EDEDF1] last:border-b-0">
                    {previewColumns.map(col => (
                      <td key={col} className="px-2 py-1 text-[#111] truncate max-w-[120px]">{row[col]}</td>
                    ))}
                  </tr>
                ))}
                {preview.length > 20 && (
                  <tr><td colSpan={previewColumns.length} className="text-center py-2 text-[#8E8E93] text-[10px]">... và {preview.length - 20} dòng nữa</td></tr>
                )}
              </tbody>
            </table>
            <div className="text-[10px] text-[#6B7280] px-2 py-1 border-t border-[#EDEDF1] bg-[#F9F9FB]">
              Tổng: {preview.length} dòng
            </div>
          </div>
        )}

        {error && <p className="text-[11px] text-[#E6002D]">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-[10px] text-[12px] font-medium bg-[rgba(0,0,0,0.04)] text-[#5F6368]">Huỷ</button>
          <button onClick={handleExport} disabled={exporting}
            className="flex-1 py-2.5 rounded-[10px] text-[12px] font-semibold text-white disabled:opacity-50"
            style={{ background: 'var(--color-primary, #E6002D)' }}>
            {exporting ? '⏳ Đang xuất...' : (format === 'pdf' ? '📕 Xuất PDF' : format === 'word' ? '📄 Xuất Word' : '📊 Xuất Excel')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Toast helper (inline, no dependency) ──
function toast(msg: string) {
  const el = document.getElementById('s-toast');
  if (el) {
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout((el as any)._st);
    (el as any)._st = setTimeout(() => el.classList.remove('show'), 2500);
  }
}
