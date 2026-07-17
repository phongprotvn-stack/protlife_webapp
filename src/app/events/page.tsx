'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Calendar, RefreshCw, ChevronLeft, ChevronRight, MapPin, ArrowUpDown, Users } from 'lucide-react';
import { EventCard } from '@/components/events/event-card';
import { eventService } from '@/lib/services/event-service';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/app-store';
import { useRouter } from 'next/navigation';
import type { EventItem } from '@/types/database';
import { formatDate, getMoodEmoji, getImportanceColor, formatVND } from '@/lib/utils';

const PAGE_SIZE = 10;

const EVENT_TYPES = [
  { id: '', label: 'Tất cả', icon: '📋' },
  { id: 'Meeting', label: 'Gặp gỡ', icon: '🤝' },
  { id: 'Birthday', label: 'Sinh nhật', icon: '🎂' },
  { id: 'Travel', label: 'Du lịch', icon: '✈️' },
  { id: 'Work', label: 'Công việc', icon: '💼' },
  { id: 'Sport', label: 'Thể thao', icon: '⚽' },
  { id: 'Meal', label: 'Ăn uống', icon: '🍽️' },
  { id: 'Entertainment', label: 'Giải trí', icon: '🎮' },
  { id: 'Other', label: 'Khác', icon: '📌' },
];

type SortField = 'Title' | 'EventType' | 'StartDate' | 'Place' | 'Cost' | 'Participants';
type SortDir = 'asc' | 'desc';

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDesktop, setIsDesktop] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('StartDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Participant count per event
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});

  const selectEvent = useAppStore((s) => s.selectEvent);
  const refreshKey = useAppStore((s) => s.refreshKey);

  useEffect(() => { setIsDesktop(window.innerWidth >= 768); loadEvents(); }, [refreshKey]);

  const loadEvents = async () => {
    setIsLoading(true); setError('');
    try {
      const data = await eventService.getAll();
      setEvents(data);

      // Fetch participant counts for ALL events
      const { data: participants } = await supabase
        .from('participants')
        .select('EventID')
        .in('EventID', data.map((e: EventItem) => e.EventID));

      const counts: Record<string, number> = {};
      if (participants) {
        participants.forEach((p: any) => {
          counts[p.EventID] = (counts[p.EventID] || 0) + 1;
        });
      }
      setParticipantCounts(counts);
    } catch (e: any) { setError(e.message || 'Không thể tải dữ liệu'); }
    finally { setIsLoading(false); }
  };

  const processed = useMemo(() => {
    let f = events.filter((e) => {
      if (activeFilter && e.EventType !== activeFilter) return false;
      if (searchQuery && !e.Title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
    f.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'Title') cmp = a.Title.localeCompare(b.Title);
      else if (sortField === 'EventType') cmp = (a.EventType || '').localeCompare(b.EventType || '');
      else if (sortField === 'StartDate') cmp = (a.StartDate || '').localeCompare(b.StartDate || '');
      else if (sortField === 'Place') cmp = (a.Place || '').localeCompare(b.Place || '');
      else if (sortField === 'Cost') cmp = (a.Cost || 0) - (b.Cost || 0);
      else if (sortField === 'Participants') {
        cmp = (participantCounts[a.EventID] || 0) - (participantCounts[b.EventID] || 0);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return f;
  }, [events, activeFilter, searchQuery, sortField, sortDir, participantCounts]);

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = processed.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSort = (f: SortField) => {
    if (sortField === f) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(f); setSortDir('asc'); }
  };

  if (!isDesktop) {
    return (
      <div className="page-content">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[22px] font-bold text-[#111] tracking-tight">Sự kiện</h1>
            <p className="text-[12px] text-[#8E8E93] mt-0.5">{events.length} sự kiện</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadEvents} className="w-[38px] h-[38px] rounded-[10px] bg-[rgba(0,0,0,0.04)] flex items-center justify-center">
              <RefreshCw size={15} className="text-[#8E8E93]" />
            </button>
            <button onClick={() => router.push('/events/add')}
              className="w-[38px] h-[38px] rounded-[10px] bg-[#E6002D] text-white flex items-center justify-center shadow-md active:scale-90">
              <Plus size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        <div className="relative mb-3">
          <Search size={15} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input type="text" placeholder="Tìm kiếm sự kiện..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[40px] pl-[36px] pr-[12px] rounded-[10px] bg-[rgba(0,0,0,0.04)] text-[13px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[rgba(230,0,45,0.25)] transition-all" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
          {EVENT_TYPES.map((t) => (
            <button key={t.id} onClick={() => { setActiveFilter(t.id); setCurrentPage(1); }}
              className={`flex items-center gap-1 px-[10px] py-[5px] rounded-full text-[11px] font-medium whitespace-nowrap ${
                activeFilter === t.id ? 'bg-[#E6002D] text-white' : 'bg-[rgba(0,0,0,0.04)] text-[#6B7280]'
              }`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
        {isLoading ? (
          <div className="flex flex-col items-center py-12"><div className="w-7 h-7 border-2 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin mb-2" /><p className="text-[12px] text-[#8E8E93]">Đang tải...</p></div>
        ) : error ? (
          <div className="glass-card p-6 text-center"><p className="text-[13px] font-medium text-[#E6002D]">{error}</p><button onClick={loadEvents} className="mt-3 px-4 py-1.5 rounded-[8px] text-[11px] font-medium text-white bg-[#E6002D]">Thử lại</button></div>
        ) : processed.length === 0 ? (
          <div className="glass-card p-8 text-center"><div className="w-12 h-12 rounded-full bg-[#007AFF]/5 mx-auto mb-3 flex items-center justify-center"><Calendar size={22} className="text-[#007AFF]/30" /></div><p className="text-[13px] font-medium text-[#6B7280]">{searchQuery || activeFilter ? 'Không tìm thấy kết quả' : 'Chưa có sự kiện nào'}</p></div>
        ) : (
          <div className="space-y-2">{paginated.map((event) => (<EventCard key={event.EventID} event={event} />))}</div>
        )}
      </div>
    );
  }

  // ═══ DESKTOP TABLE ═══
  return (
    <div className="page-content">
      {isLoading && <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin" /></div>}
      {!isLoading && error && (<div className="glass-card p-8 text-center"><p className="text-[14px] font-medium text-[#E6002D]">{error}</p><button onClick={loadEvents} className="btn-glass-primary mt-4 px-5 py-2 text-[12px]">Thử lại</button></div>)}
      {!isLoading && !error && (
        <>
          {/* TOP ROW */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input type="text" placeholder="Tìm kiếm sự kiện..." value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full h-[38px] pl-[34px] pr-[12px] rounded-[8px] bg-white border border-[rgba(0,0,0,0.06)] text-[13px] outline-none focus:border-[#E6002D] transition-all" />
            </div>
            <div className="flex items-center gap-1.5">
              {EVENT_TYPES.slice(0, 5).map((t) => (
                <button key={t.id} onClick={() => { setActiveFilter(t.id); setCurrentPage(1); }}
                  className={`px-[10px] py-[6px] rounded-[6px] text-[11px] font-medium border transition-all ${
                    activeFilter === t.id ? 'bg-[#E6002D] text-white border-[#E6002D]' : 'bg-white text-[#5F6368] border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)]'
                  }`}>{t.icon} {t.label}</button>
              ))}
            </div>
            <button onClick={() => router.push('/events/add')}
              className="h-[38px] px-4 rounded-[8px] bg-[#E6002D] text-white text-[12px] font-semibold flex items-center gap-1.5 hover:bg-[#D40028] transition-all shadow-sm">
              <Plus size={16} strokeWidth={2.5} /> Thêm sự kiện
            </button>
          </div>

          {/* TABLE */}
          <div className="glass-card-compact overflow-hidden" style={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.04)' }}>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[rgba(0,0,0,0.02)]">
                  <TH label="Tiêu đề" field="Title" current={sortField} dir={sortDir} onSort={handleSort} />
                  <TH label="Loại" field="EventType" current={sortField} dir={sortDir} onSort={handleSort} width="90px" />
                  <TH label="Ngày" field="StartDate" current={sortField} dir={sortDir} onSort={handleSort} width="110px" center />
                  <TH label="Địa điểm" field="Place" current={sortField} dir={sortDir} onSort={handleSort} width="120px" />
                  <TH label="Người tham gia" field="Participants" current={sortField} dir={sortDir} onSort={handleSort} width="80px" center />
                  <TH label="Chi phí" field="Cost" current={sortField} dir={sortDir} onSort={handleSort} width="100px" center />
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-[13px] text-[#8E8E93]">Không tìm thấy kết quả</td></tr>
                ) : (
                  paginated.map((event) => {
                    const d = new Date(event.StartDate);
                    const pCount = participantCounts[event.EventID] || 0;
                    return (
                      <tr key={event.EventID} onClick={() => selectEvent(event.EventID)}
                        className="border-b border-[rgba(0,0,0,0.03)] cursor-pointer hover:bg-[rgba(230,0,45,0.02)] transition-colors last:border-b-0">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-[32px] h-[36px] rounded-[6px] bg-[#E6002D]/5 flex flex-col items-center justify-center flex-shrink-0">
                              <span className="text-[11px] font-bold text-[#E6002D] leading-none">{String(d.getDate()).padStart(2, '0')}</span>
                              <span className="text-[7px] font-medium text-[#E6002D]/60 mt-0.5">{d.toLocaleDateString('vi-VN', { month: 'short' })}</span>
                            </div>
                            <div className="min-w-0">
                              <span className="text-[13px] font-medium text-[#111] truncate block">{event.Title}</span>
                              {event.Mood && <span className="text-[11px] text-[#8E8E93]">{getMoodEmoji(event.Mood)} {event.Importance && <span style={{ color: getImportanceColor(event.Importance) }}>● {event.Importance}</span>}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3"><span className="text-[12px] text-[#5F6368]">{event.EventType}</span></td>
                        <td className="py-2.5 px-3 text-center"><span className="text-[12px] text-[#5F6368]">{formatDate(event.StartDate, 'ddmmyyyy')}</span></td>
                        <td className="py-2.5 px-3"><div className="flex items-center gap-1"><MapPin size={11} className="text-[#FF9500] flex-shrink-0" /><span className="text-[12px] text-[#5F6368] truncate">{event.Place || '—'}</span></div></td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users size={12} className="text-[#34C759]" />
                            <span className="text-[12px] font-medium" style={{ color: pCount > 0 ? '#34C759' : '#8E8E93' }}>{pCount || '—'}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center"><span className="text-[12px] font-medium text-[#FF4D6A]">{event.Cost > 0 ? `${formatVND(event.Cost)} VND` : '—'}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <Pagination total={processed.length} page={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
    </div>
  );
}

function TH({ label, field, current, dir, onSort, width, center }: { label: string; field: SortField; current: SortField; dir: SortDir; onSort: (f: SortField) => void; width?: string; center?: boolean }) {
  const active = current === field;
  return (
    <th onClick={() => onSort(field)}
      className={`py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase tracking-[0.3px] cursor-pointer select-none hover:text-[#5F6368] transition-colors ${center ? 'text-center' : 'text-left'}`}
      style={{ width }}>
      <div className={`flex items-center gap-1 ${center ? 'justify-center' : ''}`}>{label}<ArrowUpDown size={11} className={`transition-all ${active ? 'text-[#E6002D] opacity-100' : 'opacity-30'}`} /></div>
    </th>
  );
}

function Pagination({ total, page, totalPages, onPageChange }: { total: number; page: number; totalPages: number; onPageChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between mt-4 text-[12px]">
      <span className="text-[#8E8E93] font-medium">{total} sự kiện — Trang {page}/{totalPages}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
          className="w-[30px] h-[30px] rounded-[6px] flex items-center justify-center border border-[rgba(0,0,0,0.06)] bg-white text-[#5F6368] disabled:opacity-30 hover:bg-[rgba(0,0,0,0.03)]">
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, idx, arr) => (
          <span key={p} className="flex items-center">
            {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-[#B0B0B8]">...</span>}
            <button onClick={() => onPageChange(p)}
              className={`w-[30px] h-[30px] rounded-[6px] text-[12px] font-medium ${p === page ? 'bg-[#E6002D] text-white' : 'text-[#5F6368] hover:bg-[rgba(0,0,0,0.04)]'}`}>{p}</button>
          </span>
        ))}
        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
          className="w-[30px] h-[30px] rounded-[6px] flex items-center justify-center border border-[rgba(0,0,0,0.06)] bg-white text-[#5F6368] disabled:opacity-30 hover:bg-[rgba(0,0,0,0.03)]">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
