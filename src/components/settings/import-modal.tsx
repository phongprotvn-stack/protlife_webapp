'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Modal } from '@/components/shared/modal';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ImportModalProps {
  onClose: () => void;
}

interface ImportRow {
  id: number;
  selected: boolean;
  data: Record<string, string>;
  duplicate: boolean;
}

const ACCEPTED = '.csv,.xlsx,.xls,.vcf,.ics';
const VCF_KEYS: Record<string, string> = {
  FN: 'Họ tên',
  TEL: 'SĐT',
  EMAIL: 'Email',
  BDAY: 'Ngày sinh',
  NOTE: 'Ghi chú',
};

export default function ImportModal({ onClose }: ImportModalProps) {
  const [step, setStep] = useState<'pick' | 'preview' | 'done'>('pick');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [importType, setImportType] = useState<'contacts' | 'events'>('contacts');
  const [result, setResult] = useState({ imported: 0, skipped: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setFileName(file.name);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let parsed: Record<string, string>[] = [];

      if (ext === 'csv') {
        const text = await file.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        parsed = result.data as Record<string, string>[];
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        parsed = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
      } else if (ext === 'vcf') {
        const text = await file.text();
        parsed = parseVCF(text);
      } else if (ext === 'ics') {
        const text = await file.text();
        parsed = parseICS(text);
      } else {
        setError('Định dạng không hỗ trợ (.csv, .xlsx, .vcf, .ics)');
        return;
      }

      if (parsed.length === 0) {
        setError('File không có dữ liệu hoặc không đọc được');
        return;
      }

      // Detect type from columns
      const cols = Object.keys(parsed[0]);
      const hasContactFields = cols.some(c => /tên|name|họ|phone|sđt|email/i.test(c));
      const hasEventFields = cols.some(c => /event|sự kiện|ngày|date|start/i.test(c));
      setImportType(hasEventFields && !hasContactFields ? 'events' : 'contacts');

      // Check for duplicates with existing data
      let existingNames: string[] = [];
      let existingDates: string[] = [];
      if (importType === 'contacts') {
        const { data } = await supabase.from('contacts').select('Name');
        existingNames = (data || []).map((c: any) => (c.Name || '').toLowerCase());
      } else {
        const { data } = await supabase.from('events').select('StartDate');
        existingDates = (data || []).map((e: any) => (e.StartDate || '').split('T')[0]);
      }

      const importRows: ImportRow[] = parsed.map((row, i) => {
        const nameVal = (row.Tên || row.Name || row['Họ tên'] || '').toLowerCase();
        const dateVal = (row.Ngày || row.Date || row.StartDate || '').split('T')[0];
        const isDup = importType === 'contacts'
          ? existingNames.includes(nameVal)
          : existingDates.includes(dateVal);
        return { id: i, selected: !isDup, data: row, duplicate: isDup };
      });

      setRows(importRows);
      setColumns(cols);
      setStep('preview');
    } catch (e: any) {
      setError(e?.message || 'Lỗi đọc file');
    }
  };

  const toggleRow = (id: number) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  const toggleAll = () => {
    const allSelected = rows.every(r => r.selected);
    setRows(prev => prev.map(r => ({ ...r, selected: !allSelected })));
  };

  const handleImport = async () => {
    const selected = rows.filter(r => r.selected);
    if (selected.length === 0) { setError('Chưa chọn dòng nào để nhập'); return; }

    setImporting(true); setError('');

    try {
      let inserted = 0;

      if (importType === 'contacts') {
        const batch = selected.map(row => {
          const d = row.data;
          const name = d.Tên || d.Name || d['Họ tên'] || '';
          return {
            Name: name.trim(),
            Phone: d.SĐT || d.Phone || d.TEL || '',
            Email: d.Email || '',
            Relationship: d['Mối quan hệ'] || d.Relationship || 'Other',
            Birthday: d['Ngày sinh'] || d.Birthday || d.BDAY || null,
            Notes: d['Ghi chú'] || d.Notes || d.NOTE || '',
          };
        });

        // Batch insert in chunks of 50
        for (let i = 0; i < batch.length; i += 50) {
          const chunk = batch.slice(i, i + 50);
          const { error: insErr } = await supabase.from('contacts').insert(chunk);
          if (insErr) throw insErr;
          inserted += chunk.length;
        }
      } else {
        const batch = selected.map(row => {
          const d = row.data;
          return {
            Title: d.Tên || d.Title || d['Sự kiện'] || d.SUMMARY || 'Sự kiện',
            StartDate: d.Ngày || d.Date || d.StartDate || d.DTSTART || '',
            Location: d['Địa điểm'] || d.Location || d.LOCATION || '',
            Notes: d['Ghi chú'] || d.Notes || d.DESCRIPTION || '',
            EventType: d['Loại sự kiện'] || d.EventType || 'Other',
          };
        });

        for (let i = 0; i < batch.length; i += 50) {
          const chunk = batch.slice(i, i + 50);
          const { error: insErr } = await supabase.from('events').insert(chunk);
          if (insErr) throw insErr;
          inserted += chunk.length;
        }
      }

      setResult({ imported: inserted, skipped: selected.length - inserted + (rows.length - selected.length) });
      setStep('done');
    } catch (e: any) {
      setError(e?.message || 'Lỗi khi nhập dữ liệu');
    }
    setImporting(false);
  };

  return (
    <Modal title="⬆️ Nhập từ file" open={true} onClose={onClose}>
      <div className="space-y-4">
        {step === 'pick' && (
          <>
            <div className="text-[12px] text-[#6B7280] leading-relaxed">
              Hỗ trợ: <strong>.csv</strong>, <strong>.xlsx</strong> (Excel), <strong>.vcf</strong> (Danh bạ), <strong>.ics</strong> (Lịch)
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#EDEDF1] rounded-[12px] p-8 text-center cursor-pointer hover:border-[var(--color-primary)] hover:bg-[rgba(230,0,45,0.02)] transition-all"
            >
              <input ref={fileInputRef} type="file" accept={ACCEPTED} className="hidden" onChange={handleFilePick} />
              <div className="text-[32px] mb-2">📂</div>
              <div className="text-[13px] font-medium text-[#6B7280]">Bấm để chọn file</div>
              <div className="text-[11px] text-[#9CA3AF] mt-1">.csv · .xlsx · .vcf · .ics</div>
            </div>

            {error && <p className="text-[11px] text-[#E6002D]">{error}</p>}

            <button onClick={onClose}
              className="w-full py-2.5 rounded-[10px] text-[12px] font-medium bg-[rgba(0,0,0,0.04)] text-[#5F6368]">
              Huỷ
            </button>
          </>
        )}

        {step === 'preview' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold">{fileName}</p>
                <p className="text-[11px] text-[#6B7280]">{rows.length} dòng · Phát hiện: <strong>{importType === 'contacts' ? 'Người thân' : 'Sự kiện'}</strong></p>
              </div>
            </div>

            {error && <p className="text-[11px] text-[#E6002D]">{error}</p>}

            <div className="max-h-[280px] overflow-auto border border-[#EDEDF1] rounded-[8px]">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-[#F9F9FB] sticky top-0">
                    <th className="px-2 py-1.5 border-b border-[#EDEDF1] w-[32px]">
                      <input type="checkbox" checked={rows.every(r => r.selected)} onChange={toggleAll} className="accent-[var(--color-primary)]" />
                    </th>
                    {columns.map(col => (
                      <th key={col} className="px-2 py-1.5 text-left font-semibold text-[#6B7280] whitespace-nowrap border-b border-[#EDEDF1]">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} onClick={() => toggleRow(row.id)}
                      className={`border-b border-[#EDEDF1] last:border-b-0 cursor-pointer transition-colors ${
                        row.duplicate ? 'bg-[rgba(255,204,0,0.06)]' : 'hover:bg-[rgba(0,0,0,0.01)]'
                      }`}>
                      <td className="px-2 py-1 border-b border-[#EDEDF1]" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={row.selected} onChange={() => toggleRow(row.id)} className="accent-[var(--color-primary)]" />
                      </td>
                      {columns.map(col => (
                        <td key={col} className={`px-2 py-1 truncate max-w-[100px] ${row.duplicate ? 'text-[#B8860B]' : 'text-[#111]'}`}>
                          {row.data[col]}
                          {row.duplicate && col === columns[0] && <span className="ml-1 text-[9px] text-[#B8860B] font-semibold">⚠️ Trùng</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-[10px] text-[12px] font-medium bg-[rgba(0,0,0,0.04)] text-[#5F6368]">
                Huỷ
              </button>
              <button onClick={handleImport} disabled={importing}
                className="flex-1 py-2.5 rounded-[10px] text-[12px] font-semibold text-white disabled:opacity-50"
                style={{ background: 'var(--color-primary, #E6002D)' }}>
                {importing ? '⏳ Đang nhập...' : `✅ Xác nhận nhập (${rows.filter(r => r.selected).length})`}
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <>
            <div className="text-center py-6">
              <div className="text-[40px] mb-3">✅</div>
              <div className="text-[15px] font-bold text-[#111]">Nhập dữ liệu thành công!</div>
              <div className="text-[12px] text-[#6B7280] mt-2 space-y-1">
                <p>Đã nhập: <strong>{result.imported}</strong> dòng</p>
                <p>Bỏ qua/Bị trùng: <strong>{result.skipped}</strong> dòng</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-full py-2.5 rounded-[10px] text-[12px] font-semibold text-white"
              style={{ background: 'var(--color-primary, #E6002D)' }}>
              Đóng
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

// ── VCF Parser ──
function parseVCF(text: string): Record<string, string>[] {
  const records: Record<string, string>[] = [];
  const lines = text.split('\n');
  let current: Record<string, string> = {};
  let key = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed === 'BEGIN:VCARD') continue;
    if (trimmed === 'END:VCARD') {
      if (current.FN) records.push(current);
      current = {};
      continue;
    }
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const field = trimmed.substring(0, colonIdx);
    const value = trimmed.substring(colonIdx + 1);
    const fname = field.split(';')[0]; // Remove params like CHARSET=UTF-8

    if (fname === 'FN') current['Họ tên'] = value;
    else if (fname === 'TEL') {
      const existing = current['SĐT'] || '';
      current['SĐT'] = existing ? existing + ', ' + value : value;
    } else if (fname === 'EMAIL') current['Email'] = value;
    else if (fname === 'BDAY') current['Ngày sinh'] = value.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
    else if (fname === 'NOTE') current['Ghi chú'] = (current['Ghi chú'] || '') + value;
    else current['Khác ' + fname] = value;
  }

  return records;
}

// ── ICS Parser ──
function parseICS(text: string): Record<string, string>[] {
  const records: Record<string, string>[] = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let current: Record<string, string> = {};
  let inEvent = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    // Handle folded lines (continuation)
    while (i + 1 < lines.length && (lines[i + 1][0] === ' ' || lines[i + 1][0] === '\t')) {
      line += lines[i + 1].trim();
      i++;
    }
    if (line === 'BEGIN:VEVENT') { inEvent = true; current = {}; continue; }
    if (line === 'END:VEVENT') {
      if (inEvent) records.push(current);
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const field = line.substring(0, colonIdx);
    const value = line.substring(colonIdx + 1);
    const fname = field.split(';')[0];

    if (fname === 'SUMMARY') current['Sự kiện'] = value;
    else if (fname === 'DTSTART') {
      const dt = value.replace(/T/, ' ').replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
      current['Ngày'] = dt.split(' ')[0];
    } else if (fname === 'LOCATION') current['Địa điểm'] = value;
    else if (fname === 'DESCRIPTION') current['Ghi chú'] = (current['Ghi chú'] || '') + value;
    else current['Khác ' + fname] = value;
  }

  return records;
}
