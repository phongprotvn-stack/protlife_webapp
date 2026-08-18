'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Calendar, RefreshCw, ChevronLeft, ChevronRight, MapPin, ArrowUpDown, Users, SlidersHorizontal, X, Sparkles, UsersRound, Heart, ChevronDown } from 'lucide-react';
import { EventCard } from '@/components/events/event-card';
import { ListPagination } from '@/components/shared/list-pagination';
import { eventService } from '@/lib/services/event-service';
import { contactService } from '@/lib/services/contact-service';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/app-store';
import { useRouter } from 'next/navigation';
import type { EventItem } from '@/types/database';
import { formatDate, getMoodEmoji, getImportanceColor, formatVND } from '@/lib/utils';
import { DateInput } from '@/components/ui/date-input';

const PAGE_SIZE = 10;

const EVENT_TYPES = [
  { id: '', label: 'Tất cả', icon: '📋' },
  { id: 'Meeting', label: 'Gặp gỡ', icon: '🤝' },
  { id: 'Birthday', label: 'Sinh nhật', icon: '🎂' },
  { id: 'Travel', label: 'Du lịch', icon: '✈️' },
  { id: 'Work', label: 'Công việc', icon: '💼' },
  { id: 'Sport', label: 'Thể thao', icon: '⚽' },
  { id: 'Hospital', label: 'Bệnh viện', icon: '🏥' },
  { id: 'Meal', label: 'Bữa ăn', icon: '🍽️' },
  { id: 'PhoneCall', label: 'Cuộc gọi', icon: '📞' },
  { id: 'Shopping', label: 'Mua sắm', icon: '🛒' },
  { id: 'Study', label: 'Học tập', icon: '📚' },
  { id: 'Party', label: 'Buổi tiệc', icon: '🎉' },
  { id: 'Date', label: 'Hẹn hò', icon: '💕' },
  { id: 'Entertainment', label: 'Giải trí', icon: '🎮' },
  { id: 'Other', label: 'Khác', icon: '📌' },
];

type SortField = 'Title' | 'EventType' | 'StartDate' | 'Place' | 'Cost' | 'Participants';
type SortDir = 'asc' | 'desc';

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('');
    const router = useRouter();
    const [isDesktop, setIsDesktop] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<SortField>('StartDate');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [showBigMenu, setShowBigMenu] = useState(false);

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [showParticipantSuggestions, setShowParticipantSuggestions] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const selectEvent = useAppStore((s) => s.selectEvent);
  const refreshKey = useAppStore((s) => s.refreshKey);

  useEffect(() => { setIsDesktop(window.innerWidth >= 768); }, []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['events', refreshKey],
    queryFn: async () => {
      const data = await eventService.getAll();

      const eventIds = data.map((e: EventItem) => e.EventID);

      // Fetch participant counts AND names for ALL events
      let participantCounts: Record<string, number> = {};
      let participantNames: Record<string, string[]> = {};
      let participantContactIds: Record<string, string[]> = {};
      if (eventIds.length > 0) {
        const { data: participants } = await supabase
          .from('participants')
          .select(`
            EventID,
            ContactID,
            contacts!inner(Name)
          `)
          .in('EventID', eventIds);

        const counts: Record<string, number> = {};
        const names: Record<string, string[]> = {};
        const contactIds: Record<string, string[]> = {};
        if (participants) {
          participants.forEach((p: any) => {
            counts[p.EventID] = (counts[p.EventID] || 0) + 1;
            if (!names[p.EventID]) names[p.EventID] = [];
            if (!contactIds[p.EventID]) contactIds[p.EventID] = [];
            if (p.ContactID && !contactIds[p.EventID].includes(p.ContactID)) {
              contactIds[p.EventID].push(p.ContactID);
            }
            const contactName = p.contacts?.Name?.trim();
            if (contactName && !names[p.EventID].includes(contactName)) {
              names[p.EventID].push(contactName);
            }
          });
        }
        participantCounts = counts;
        participantNames = names;
        participantContactIds = contactIds;
      }

      return { events: data, participantCounts, participantNames, participantContactIds };
    },
    staleTime: 60_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1500 * attempt, 5000),
    refetchOnWindowFocus: false,
  });

  const { events, participantCounts, participantNames, participantContactIds } = data ?? {
    events: [],
    participantCounts: {},
    participantNames: {},
    participantContactIds: {},
  };
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactService.getAll(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const loadError = error ? (error as Error).message || 'Không thể tải dữ liệu' : '';

  const participantSuggestions = useMemo(() => {
    const term = participantSearch.trim().toLocaleLowerCase('vi');
    if (!term || selectedParticipantId) return [];
    return contacts
      .filter((contact) => contact.Name?.toLocaleLowerCase('vi').includes(term))
      .slice(0, 8);
  }, [contacts, participantSearch, selectedParticipantId]);

  const processed = useMemo(() => {
    let f = events.filter((e) => {
      // Type filter
      if (activeFilter && e.EventType !== activeFilter) return false;
      // Title search
      if (searchQuery && !e.Title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      // Participant name search
      if (selectedParticipantId || participantSearch) {
        const match = selectedParticipantId
          ? (participantContactIds[e.EventID] || []).includes(selectedParticipantId)
          : (participantNames[e.EventID] || []).some((name) =>
              name.toLocaleLowerCase('vi').includes(participantSearch.trim().toLocaleLowerCase('vi'))
            );
        if (!match) return false;
      }
      // Date range filter
      if (fromDate && e.StartDate && e.StartDate < fromDate) return false;
      if (toDate && e.StartDate && e.StartDate > toDate) return false;
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
  }, [events, activeFilter, searchQuery, sortField, sortDir, participantCounts, participantNames, participantContactIds, participantSearch, selectedParticipantId, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = processed.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSort = (f: SortField) => {
    if (sortField === f) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(f); setSortDir('asc'); }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setActiveFilter('');
    setParticipantSearch('');
    setSelectedParticipantId('');
    setShowParticipantSuggestions(false);
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters = !!searchQuery || !!activeFilter || !!participantSearch || !!fromDate || !!toDate;

  const filterBar = showFilters && (
    <div className="flex flex-wrap items-end gap-2.5">
      {/* Participant search */}
      <div className="flex-1 min-w-[160px]">
        <p className="text-[9px] font-semibold text-[#6B7280] uppercase mb-1">Người tham gia</p>
        <div
          className="relative"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setShowParticipantSuggestions(false);
            }
          }}
        >
          <Users size={13} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input value={participantSearch}
            onChange={(e) => {
              setParticipantSearch(e.target.value);
              setSelectedParticipantId('');
              setShowParticipantSuggestions(true);
              setCurrentPage(1);
            }}
            onFocus={() => setShowParticipantSuggestions(true)}
            placeholder="Tìm theo tên người tham gia..."
            autoComplete="off"
            className="w-full h-[36px] pl-[30px] pr-[30px] rounded-[8px] bg-white border border-[rgba(0,0,0,0.06)] text-[12px] outline-none focus:border-[#E6002D] transition-all" />
          {participantSearch && (
            <button type="button" aria-label="Xóa người tham gia"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setParticipantSearch('');
                setSelectedParticipantId('');
                setShowParticipantSuggestions(false);
                setCurrentPage(1);
              }}
              className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#E6002D]">
              <X size={13} />
            </button>
          )}
          {showParticipantSuggestions && participantSearch.trim() && !selectedParticipantId && (
            <div className="absolute left-0 right-0 top-[40px] z-50 max-h-[240px] overflow-y-auto rounded-[10px] border border-[rgba(0,0,0,0.08)] bg-white p-1 shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
              {participantSuggestions.length > 0 ? participantSuggestions.map((contact) => (
                <button key={contact.ContactID} type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setParticipantSearch(contact.Name);
                    setSelectedParticipantId(contact.ContactID);
                    setShowParticipantSuggestions(false);
                    setCurrentPage(1);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left hover:bg-[rgba(230,0,45,0.05)] active:bg-[rgba(230,0,45,0.08)]">
                  <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[rgba(230,0,45,0.08)] text-[10px] font-bold text-[#E6002D]">
                    {contact.Name.trim().charAt(0).toLocaleUpperCase('vi')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-semibold text-[#111]">{contact.Name}</span>
                    {(contact.Relationship || contact.Organization1) && (
                      <span className="block truncate text-[10px] text-[#8E8E93]">
                        {[contact.Relationship, contact.Organization1].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </span>
                </button>
              )) : (
                <p className="px-3 py-3 text-center text-[11px] text-[#8E8E93]">Không tìm thấy trong Quan hệ</p>
              )}
            </div>
          )}
        </div>
      </div>
      {/* From date */}
      <div className="min-w-[130px]">
        <p className="text-[9px] font-semibold text-[#6B7280] uppercase mb-1">Từ ngày</p>
        <DateInput value={fromDate} onChange={(v) => { setFromDate(v); setCurrentPage(1); }}
          className="w-full h-[36px] px-[10px] rounded-[8px] border border-[rgba(0,0,0,0.06)] text-[12px] outline-none focus:border-[#E6002D] transition-all" />
      </div>
      {/* To date */}
      <div className="min-w-[130px]">
        <p className="text-[9px] font-semibold text-[#6B7280] uppercase mb-1">Đến ngày</p>
        <DateInput value={toDate} onChange={(v) => { setToDate(v); setCurrentPage(1); }}
          className="w-full h-[36px] px-[10px] rounded-[8px] border border-[rgba(0,0,0,0.06)] text-[12px] outline-none focus:border-[#E6002D] transition-all" />
      </div>
      {/* Reset */}
      {hasActiveFilters && (
        <button onClick={resetFilters}
          className="h-[36px] px-3 rounded-[8px] text-[11px] font-medium text-[#E6002D] bg-[rgba(230,0,45,0.06)] hover:bg-[rgba(230,0,45,0.1)] flex items-center gap-1 transition-all">
          <X size={13} /> Xoá lọc
        </button>
      )}
    </div>
  );

  if (!isDesktop) {
    return (
      <div className="page-content">
        <div className="mobile-page-header flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#111] tracking-tight">Sự kiện</h1>
            <p className="text-[12px] text-[#8E8E93] mt-0.5">{events.length} sự kiện</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="w-[38px] h-[38px] rounded-[10px] bg-[rgba(0,0,0,0.04)] flex items-center justify-center">
              <RefreshCw size={15} className="text-[#8E8E93]" />
            </button>
            <button onClick={() => router.push('/events/add')}
              className="w-[38px] h-[38px] rounded-[10px] bg-[#E6002D] text-white flex items-center justify-center shadow-md active:scale-90">
              <Plus size={18} strokeWidth={2.5} />
            </button>
            <div className="relative">
              <button onClick={() => setShowBigMenu(v => !v)}
                className="h-[38px] px-3 rounded-[10px] text-white flex items-center gap-1 text-[12px] font-semibold shadow-md active:scale-90 bg-gradient-to-r from-[#7B2FF7] to-[#E6002D]">
                <Sparkles size={14} /> Sự kiện lớn
              </button>
              {showBigMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowBigMenu(false)} />
                  <div className="absolute right-0 top-[44px] z-40 w-[260px] bg-white rounded-[14px] border border-[rgba(0,0,0,0.06)] shadow-xl p-2">
                    <button
                      onClick={() => { setShowBigMenu(false); router.push('/events/group/new'); }}
                      className="w-full flex items-start gap-3 p-3 rounded-[10px] hover:bg-[rgba(0,0,0,0.03)] transition-all text-left">
                      <div className="w-9 h-9 rounded-[10px] bg-[rgba(0,122,255,0.1)] flex items-center justify-center shrink-0">
                        <UsersRound size={17} className="text-[#007AFF]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#111]">Sự kiện nhóm</p>
                        <p className="text-[11px] text-[#8E8E93] mt-0.5 leading-snug">Quỹ chung, chia tiền Splitwise cho chuyến đi / nhóm bạn</p>
                      </div>
                    </button>
                    <div className="h-px bg-[rgba(0,0,0,0.06)] my-1" />
                    <button
                      onClick={() => { setShowBigMenu(false); router.push('/events/wedding'); }}
                      className="w-full flex items-start gap-3 p-3 rounded-[10px] hover:bg-[rgba(0,0,0,0.03)] transition-all text-left">
                      <div className="w-9 h-9 rounded-[10px] bg-[rgba(230,0,45,0.1)] flex items-center justify-center shrink-0">
                        <Heart size={17} className="text-[#E6002D]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#111]">Đám cưới</p>
                        <p className="text-[11px] text-[#8E8E93] mt-0.5 leading-snug">Ngân sách, khách mời, checklist tổ chức đám cưới</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="relative mb-3">
          <Search size={15} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input type="text" placeholder="Tìm kiếm sự kiện..." value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full h-[40px] pl-[36px] pr-[36px] rounded-[10px] bg-[rgba(0,0,0,0.04)] text-[16px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[rgba(230,0,45,0.25)] transition-all" />
          <button onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-[10px] top-1/2 -translate-y-1/2 p-1 rounded-[6px] transition-all ${showFilters ? 'text-[#E6002D] bg-[rgba(230,0,45,0.08)]' : 'text-[#9CA3AF]'}`}>
            <SlidersHorizontal size={15} />
          </button>
        </div>
        {/* Filter bar on Mobile */}
        {filterBar && <div className="mb-3">{filterBar}</div>}
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
        ) : loadError ? (
          <div className="glass-card p-6 text-center"><p className="text-[13px] font-medium text-[#E6002D]">{loadError}</p><button onClick={() => refetch()} className="mt-3 px-4 py-1.5 rounded-[8px] text-[11px] font-medium text-white bg-[#E6002D]">Thử lại</button></div>
        ) : processed.length === 0 ? (
          <div className="glass-card p-8 text-center"><div className="w-12 h-12 rounded-full bg-[#007AFF]/5 mx-auto mb-3 flex items-center justify-center"><Calendar size={22} className="text-[#007AFF]/30" /></div><p className="text-[13px] font-medium text-[#6B7280]">{hasActiveFilters ? 'Không tìm thấy kết quả' : 'Chưa có sự kiện nào'}</p></div>
        ) : (
          <>
            <div className="space-y-2">{paginated.map((event) => (<EventCard key={event.EventID} event={event} />))}</div>
            <ListPagination
              total={processed.length}
              itemLabel="sự kiện"
              page={safePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    );
  }

  // ═══ DESKTOP TABLE ═══
  return (
    <div className="page-content">
      {isLoading && <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin" /></div>}
      {!isLoading && loadError && (<div className="glass-card p-8 text-center"><p className="text-[14px] font-medium text-[#E6002D]">{loadError}</p><button onClick={() => refetch()} className="btn-glass-primary mt-4 px-5 py-2 text-[12px]">Thử lại</button></div>)}
      {!isLoading && !loadError && (
        <>
          {/* TOP ROW */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-[28%] min-w-[180px] relative shrink-0">
              <Search size={15} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input type="text" placeholder="Tìm kiếm sự kiện..." value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full h-[38px] pl-[34px] pr-[36px] rounded-[8px] bg-white border border-[rgba(0,0,0,0.06)] text-[13px] outline-none focus:border-[#E6002D] transition-all" />
              <button onClick={() => setShowFilters(!showFilters)}
                className={`absolute right-[10px] top-1/2 -translate-y-1/2 p-1 rounded-[6px] transition-all ${showFilters ? 'text-[#E6002D] bg-[rgba(230,0,45,0.08)]' : 'text-[#9CA3AF] hover:text-[#5F6368]'}`}>
                <SlidersHorizontal size={15} />
              </button>
            </div>
            <div className="flex-1 flex items-center gap-1.5 overflow-x-auto pb-1 min-w-0">
              {EVENT_TYPES.map((t) => (
                <button key={t.id} onClick={() => { setActiveFilter(t.id); setCurrentPage(1); }}
                  className={`px-[10px] py-[6px] rounded-[6px] text-[11px] font-medium border transition-all whitespace-nowrap shrink-0 ${
                    activeFilter === t.id ? 'bg-[#E6002D] text-white border-[#E6002D]' : 'bg-white text-[#5F6368] border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)]'
                  }`}>{t.icon} {t.label}</button>
              ))}
            </div>
            <button onClick={() => router.push('/events/add')}
              className="h-[38px] px-4 rounded-[8px] bg-[#E6002D] text-white text-[12px] font-semibold flex items-center gap-1.5 hover:bg-[#D40028] transition-all shadow-sm shrink-0">
              <Plus size={16} strokeWidth={2.5} /> Thêm sự kiện
            </button>
            {/* Thêm sự kiện lớn — dropdown menu */}
            <div className="relative shrink-0">
              <button onClick={() => setShowBigMenu(v => !v)}
                className="h-[38px] px-4 rounded-[8px] text-white text-[12px] font-semibold flex items-center gap-1.5 transition-all shadow-md shrink-0 bg-gradient-to-r from-[#7B2FF7] to-[#E6002D] hover:opacity-90">
                <Sparkles size={15} /> Thêm sự kiện lớn <ChevronDown size={13} className={`transition-transform ${showBigMenu ? 'rotate-180' : ''}`} />
              </button>
              {showBigMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowBigMenu(false)} />
                  <div className="absolute right-0 top-[44px] z-40 w-[260px] bg-white rounded-[14px] border border-[rgba(0,0,0,0.06)] shadow-xl p-2">
                    <button
                      onClick={() => { setShowBigMenu(false); router.push('/events/group/new'); }}
                      className="w-full flex items-start gap-3 p-3 rounded-[10px] hover:bg-[rgba(0,0,0,0.03)] transition-all text-left">
                      <div className="w-9 h-9 rounded-[10px] bg-[rgba(0,122,255,0.1)] flex items-center justify-center shrink-0">
                        <UsersRound size={17} className="text-[#007AFF]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#111]">Sự kiện nhóm</p>
                        <p className="text-[11px] text-[#8E8E93] mt-0.5 leading-snug">Quỹ chung, chia tiền Splitwise cho chuyến đi / nhóm bạn</p>
                      </div>
                    </button>
                    <div className="h-px bg-[rgba(0,0,0,0.06)] my-1" />
                    <button
                      onClick={() => { setShowBigMenu(false); router.push('/events/wedding'); }}
                      className="w-full flex items-start gap-3 p-3 rounded-[10px] hover:bg-[rgba(0,0,0,0.03)] transition-all text-left">
                      <div className="w-9 h-9 rounded-[10px] bg-[rgba(230,0,45,0.1)] flex items-center justify-center shrink-0">
                        <Heart size={17} className="text-[#E6002D]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#111]">Đám cưới</p>
                        <p className="text-[11px] text-[#8E8E93] mt-0.5 leading-snug">Ngân sách, khách mời, checklist tổ chức đám cưới</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* FILTER BAR — Desktop */}
          {filterBar && <div className="mb-4 p-3 rounded-[10px] bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.04)]">{filterBar}</div>}

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
