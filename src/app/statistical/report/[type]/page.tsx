'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Users, Calendar, LayoutList,
  FileText, FileSpreadsheet, File,
  Search, Download, Printer,
} from 'lucide-react';
import Link from 'next/link';
import { contactService } from '@/lib/services/contact-service';
import { eventService } from '@/lib/services/event-service';
import { memoryService } from '@/lib/services/memory-service';
import { formatDate, getMoodEmoji, getImportanceColor } from '@/lib/utils';
import { exportExcel, exportWord, exportPDF } from '@/lib/export-utils';
import type { Contact, EventItem, Memory } from '@/types/database';

const reportConfigs: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  fields: string[];
  fetchData: () => Promise<Record<string, string>[]>;
}> = {
  'danh-sach-quan-he': {
    label: 'Danh sách quan hệ',
    icon: Users,
    color: '#E6002D',
    fields: ['STT', 'Họ tên', 'Mối quan hệ', 'Ngày sinh', 'SĐT', 'Email', 'Điểm thân thiết', 'Trạng thái'],
    fetchData: async () => {
      const data = await contactService.getAll();
      return data.map((c: Contact, i: number) => ({
        'STT': String(i + 1),
        'Họ tên': c.Name,
        'Mối quan hệ': c.Relationship,
        'Ngày sinh': c.Birthday ? formatDate(c.Birthday, 'ddmmyyyy') : '-',
        'SĐT': c.Phone || '-',
        'Email': c.Email || '-',
        'Điểm thân thiết': String(c.RelationshipScore),
        'Trạng thái': c.Status === 'Active' ? 'Đang liên lạc' : c.Status === 'Lost Contact' ? 'Mất liên lạc' : c.Status === 'Deceased' ? 'Đã mất' : 'Đã chặn',
      }));
    },
  },
  'danh-sach-su-kien': {
    label: 'Danh sách sự kiện',
    icon: Calendar,
    color: '#007AFF',
    fields: ['STT', 'Sự kiện', 'Loại', 'Ngày bắt đầu', 'Ngày kết thúc', 'Địa điểm', 'Mức độ', 'Cảm xúc'],
    fetchData: async () => {
      const data = await eventService.getAll();
      return data.map((e: EventItem, i: number) => ({
        'STT': String(i + 1),
        'Sự kiện': e.Title,
        'Loại': e.EventType,
        'Ngày bắt đầu': formatDate(e.StartDate, 'ddmmyyyy'),
        'Ngày kết thúc': e.EndDate ? formatDate(e.EndDate, 'ddmmyyyy') : '-',
        'Địa điểm': e.Place || '-',
        'Mức độ': e.Importance,
        'Cảm xúc': e.Mood ? `${getMoodEmoji(e.Mood)} ${e.Mood}` : '-',
      }));
    },
  },
  'bao-cao-tong-hop': {
    label: 'Danh sách Tổng hợp',
    icon: LayoutList,
    color: '#5856D6',
    fields: ['STT', 'Loại', 'Nội dung', 'Ngày', 'Trạng thái'],
    fetchData: async () => {
      const [contacts, events, memories] = await Promise.all([
        contactService.getAll(),
        eventService.getAll(),
        memoryService.getAll(),
      ]);
      const rows: Record<string, string>[] = [];
      contacts.forEach((c: Contact, i: number) => {
        rows.push({
          'STT': String(rows.length + 1),
          'Loại': 'Quan hệ',
          'Nội dung': c.Name,
          'Ngày': formatDate(c.CreatedDate, 'ddmmyyyy'),
          'Trạng thái': c.Status === 'Active' ? 'Đang liên lạc' : 'Khác',
        });
      });
      events.forEach((e: EventItem) => {
        rows.push({
          'STT': String(rows.length + 1),
          'Loại': 'Sự kiện',
          'Nội dung': e.Title,
          'Ngày': formatDate(e.StartDate, 'ddmmyyyy'),
          'Trạng thái': e.Importance,
        });
      });
      memories.forEach((m: Memory) => {
        rows.push({
          'STT': String(rows.length + 1),
          'Loại': 'Ký ức',
          'Nội dung': m.Title,
          'Ngày': formatDate(m.CreatedDate, 'ddmmyyyy'),
          'Trạng thái': m.Mood || '-',
        });
      });
      return rows;
    },
  },
};

const formatOptions = [
  { id: 'word', label: 'Word', icon: FileText, color: '#007AFF' },
  { id: 'excel', label: 'Excel', icon: FileSpreadsheet, color: '#34C759' },
  { id: 'pdf', label: 'PDF', icon: File, color: '#E6002D' },
];

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const type = params.type as string;

  const config = reportConfigs[type];
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showExportMenu, setShowExportMenu] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (config?.fetchData) {
      setLoading(true);
      setError('');
      config.fetchData()
        .then(setData)
        .catch((e) => setError(e?.message || 'Lỗi tải dữ liệu'))
        .finally(() => setLoading(false));
    }
  }, [config?.label]);

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (searchQuery && !Object.values(row).some(v =>
        v.toLowerCase().includes(searchQuery.toLowerCase())
      )) return false;
      if (fromDate || toDate) {
        const dateVal = row['Ngày'] || row['Ngày bắt đầu'] || '';
        if (fromDate && dateVal && dateVal < fromDate) return false;
        if (toDate && dateVal && dateVal > toDate) return false;
      }
      return true;
    });
  }, [data, searchQuery, fromDate, toDate]);

  if (!config) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto text-center py-20">
        <p className="text-[16px] text-[#8E8E93]">Không tìm thấy báo cáo</p>
        <Link href="/statistical" className="mt-4 inline-flex items-center gap-2 text-[#E6002D] text-[14px] font-medium hover:underline">
          <ArrowLeft size={16} /> Quay lại
        </Link>
      </div>
    );
  }

  const Icon = config.icon;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Back + Title */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/statistical"
          className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-[rgba(0,0,0,0.08)] transition-all"
        >
          <ArrowLeft size={17} className="text-[#6B7280]" />
        </Link>
        <div>
          <h1 className="text-[22px] font-bold text-[#111] tracking-tight flex items-center gap-2">
            <Icon size={22} style={{ color: config.color }} />
            {config.label}
          </h1>
          <p className="text-[12px] text-[#8E8E93] mt-0.5">
            {loading ? 'Đang tải...' : `${data.length} bản ghi`}
            {' · Tìm kiếm, lọc và xuất dữ liệu'}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card-ios mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search size={15} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[40px] pl-[36px] pr-[12px] rounded-[10px] bg-[rgba(0,0,0,0.04)] text-[14px] text-[#111] placeholder:text-[#9CA3AF] outline-none border border-transparent focus:border-[rgba(230,0,45,0.2)] focus:bg-white focus:ring-2 focus:ring-[rgba(230,0,45,0.08)] transition-all"
            />
          </div>

          {/* From date */}
          <div>
            <label className="block text-[11px] font-medium text-[#8E8E93] mb-1">Từ ngày</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full h-[40px] px-3 rounded-[10px] bg-[rgba(0,0,0,0.04)] text-[14px] text-[#111] outline-none border border-transparent focus:border-[rgba(230,0,45,0.2)] focus:bg-white focus:ring-2 focus:ring-[rgba(230,0,45,0.08)] transition-all"
            />
          </div>

          {/* To date */}
          <div>
            <label className="block text-[11px] font-medium text-[#8E8E93] mb-1">Đến ngày</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full h-[40px] px-3 rounded-[10px] bg-[rgba(0,0,0,0.04)] text-[14px] text-[#111] outline-none border border-transparent focus:border-[rgba(230,0,45,0.2)] focus:bg-white focus:ring-2 focus:ring-[rgba(230,0,45,0.08)] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] text-[#8E8E93]">
          {loading ? 'Đang tải...' : `${filteredData.length} bản ghi`}
          {(fromDate || toDate) && (
            <span className="ml-2 text-[11px] text-[#E6002D] bg-[#E6002D]/8 px-2 py-0.5 rounded-full">
              Đã lọc theo ngày
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          {/* Print button */}
          <button
            onClick={() => window.print()}
            className="h-[36px] w-[36px] rounded-[10px] bg-[rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-[rgba(0,0,0,0.08)] transition-all"
          >
            <Printer size={16} className="text-[#6B7280]" />
          </button>

          {/* Export buttons */}
          {formatOptions.map((fmt) => {
            const FmtIcon = fmt.icon;
            const handleExport = async () => {
              if (filteredData.length === 0) return;
              const label = config.label.replace(/[^a-zA-Z0-9À-ỹ]/g, '_');
              try {
                if (fmt.id === 'word') await exportWord(config.fields, filteredData, label);
                else if (fmt.id === 'excel') await exportExcel(config.fields, filteredData, label);
                else if (fmt.id === 'pdf') await exportPDF(config.fields, filteredData, label);
              } catch (e) { console.error('Export error:', e); }
            };
            return (
              <button
                key={fmt.id}
                onClick={handleExport}
                disabled={filteredData.length === 0}
                className="h-[36px] px-3 rounded-[10px] flex items-center gap-1.5 text-[12px] font-semibold transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                style={{ backgroundColor: `${fmt.color}12`, color: fmt.color }}
              >
                <FmtIcon size={14} />
                {fmt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Data table */}
      <div className="card-ios overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 border-3 border-[rgba(var(--color-primary-rgb),.2)] border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[14px] text-[#6B7280]">Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-[14px] text-[#E6002D]">{error}</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[rgba(0,0,0,0.04)] mx-auto mb-4 flex items-center justify-center">
              <Icon size={28} className="text-[#D1D5DB]" />
            </div>
            <p className="text-[15px] font-medium text-[#6B7280]">Chưa có dữ liệu</p>
            <p className="text-[13px] text-[#9CA3AF] mt-1">
              {type === 'danh-sach-quan-he'
                ? 'Thêm quan hệ để xem báo cáo'
                : type === 'danh-sach-su-kien'
                  ? 'Thêm sự kiện để xem báo cáo'
                  : 'Thêm dữ liệu để xem báo cáo tổng hợp'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.04)]">
                  {config.fields.map((field) => (
                    <th
                      key={field}
                      className="text-left px-4 py-3 text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider"
                    >
                      {field}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-[rgba(0,0,0,0.02)] hover:bg-[rgba(0,0,0,0.02)] transition-colors"
                  >
                    {config.fields.map((field) => (
                      <td
                        key={field}
                        className="px-4 py-3 text-[13px] text-[#111]"
                      >
                        {row[field] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
