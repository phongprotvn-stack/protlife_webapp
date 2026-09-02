'use client';

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Users, ArrowLeft, X, Trash2, CheckCheck, UserPlus, Phone, Building2, Table2, PartyPopper, Wallet, ArrowUp, ArrowDown, ChevronsUpDown, Filter } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { weddingService, type WeddingGuest } from '@/lib/services/event-organization-service';
import { contactService } from '@/lib/services/contact-service';
import { formatVND, parseVND } from '@/lib/utils';

// Trạng thái lời mời (Bước 3) — Đã mời / Chưa mời / Không liên lạc được
const INVITATION_FLOW = ['Not Sent', 'Sent', 'Unreachable'] as const;
// Trạng thái tham dự (Bước 4) — sau đám cưới
const ATTENDANCES = ['Pending', 'Attended', 'Not Attended'] as const;

type StepId = 'add' | 'tables' | 'invite' | 'gifts';

const STEPS: { id: StepId; label: string; icon: React.ReactNode }[] = [
  { id: 'add', label: 'Thêm khách', icon: <UserPlus size={14} /> },
  { id: 'tables', label: 'Xếp bàn', icon: <Table2 size={14} /> },
  { id: 'invite', label: 'Lời mời', icon: <CheckCheck size={14} /> },
  { id: 'gifts', label: 'Đã đến & Tiền mừng', icon: <PartyPopper size={14} /> },
];

function SortIcon({ col, sortKey, sortDir }: { col: string; sortKey: string; sortDir: 1 | -1 }) {
  if (sortKey !== col) return <ChevronsUpDown size={12} className="inline ml-1 text-[#B8BCC4]" />;
  return sortDir === 1
    ? <ArrowUp size={12} className="inline ml-1 text-[#E6002D]" />
    : <ArrowDown size={12} className="inline ml-1 text-[#E6002D]" />;
}

export default function WeddingGuestsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEventId = searchParams?.get('event') || null;
  const [eventId, setEventId] = useState<string | null>(initialEventId);
  const [resolving, setResolving] = useState(() => !initialEventId);
  const [noWedding, setNoWedding] = useState(false);
  const [step, setStep] = useState<StepId>('add');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // ─── Tự resolve event đám cưới (giống wedding dashboard, không dùng EventPicker) ───
  useEffect(() => {
    if (eventId) return;
    let cancelled = false;
    (async () => {
      try {
        const { supabase } = await import('@/lib/supabase/client');
        const { data: wd } = await supabase
          .from('wedding_details')
          .select('EventID')
          .order('CreatedDate', { ascending: false })
          .limit(1);
        if (cancelled) return;
        if (wd && wd.length > 0) {
          const { data: ev } = await supabase
            .from('events')
            .select('EventID')
            .eq('EventID', wd[0].EventID)
            .maybeSingle();
          if (!cancelled && ev) {
            setEventId(ev.EventID);
            router.replace(`/events/wedding/guests?event=${ev.EventID}`, { scroll: false });
            setResolving(false);
            return;
          }
        }
        if (!cancelled) { setNoWedding(true); setResolving(false); }
      } catch {
        if (!cancelled) { setNoWedding(true); setResolving(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [eventId, router]);

  // ─── Data ───
  const { data: guests = [], isLoading: guestsLoading } = useQuery({
    queryKey: ['wedding-guests', eventId],
    queryFn: () => weddingService.getGuests(eventId!),
    enabled: !!eventId,
  });
  const { data: tables = [] } = useQuery({
    queryKey: ['wedding-tables', eventId],
    queryFn: () => weddingService.getTables(eventId!),
    enabled: !!eventId,
  });
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactService.getAll(),
    staleTime: 60_000,
  });

  // ─── Bước 1: Thêm từ danh bạ ───
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const existingContactIds = useMemo(() => new Set(guests.map(g => g.ContactID).filter(Boolean)), [guests]);
  const availableContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    return contacts.filter(c =>
      !existingContactIds.has(c.ContactID) &&
      (!q || c.Name.toLowerCase().includes(q) || (c.Organization1 || '').toLowerCase().includes(q) || (c.Phone || '').includes(q))
    );
  }, [contacts, existingContactIds, contactSearch]);

  // ─── Bước 1: Tự nhập nhanh ───
  const [quickRows, setQuickRows] = useState([{ Name: '', Organization: '', PhoneNumber: '' }]);

  // ─── Bước 2: Bàn tiệc ───
  const [tableName, setTableName] = useState('');
  const [tableCapacity, setTableCapacity] = useState<6 | 10>(6);
  const [assignTarget, setAssignTarget] = useState<string | null>(null); // TableName đang gán

  // ─── Bước 4: Tiền mừng ───
  const [giftInputs, setGiftInputs] = useState<Record<string, string>>({});
  const [cashierSearch, setCashierSearch] = useState('');
  const [cashierGuestId, setCashierGuestId] = useState<string | null>(null);
  const [cashierAmount, setCashierAmount] = useState('');
  const [cashierMethod, setCashierMethod] = useState<'Cash' | 'Transfer'>('Cash');
  const [cashierSaving, setCashierSaving] = useState(false);
  const cashierAmountRef = useRef<HTMLInputElement>(null);
  const cashierSearchRef = useRef<HTMLInputElement>(null);

    // ─── Tab Lời mời: lọc + sắp xếp ───
    const [invFilter, setInvFilter] = useState('all'); // 'all' | trạng thái mời
    const [orgFilter, setOrgFilter] = useState('all'); // 'all' | tên tổ chức
    const [sortKey, setSortKey] = useState<string>('Name'); // 'Name' | 'Org' | 'Phone' | 'Status' | 'Table'
    const [sortDir, setSortDir] = useState<1 | -1>(1); // 1 asc, -1 desc

    // Map ContactID -> Phone / Organization1 (để lấy SĐT & Tổ chức của khách thêm từ danh bạ)
    const contactMap = useMemo(() => {
      const map: Record<string, { phone: string; org: string }> = {};
      contacts.forEach(c => {
        map[c.ContactID] = { phone: c.Phone || '', org: c.Organization1 || '' };
      });
      return map;
    }, [contacts]);

    /** Lấy SĐT khách: ưu tiên phone đã lưu (tự nhập), fallback từ contact */
    const phoneOf = useCallback((g: WeddingGuest) => g.PhoneNumber || (g.ContactID ? contactMap[g.ContactID]?.phone : '') || '', [contactMap]);
    /** Lấy Tổ chức khách: ưu tiên org đã lưu, fallback Organization1 từ contact */
    const orgOf = useCallback((g: WeddingGuest) => g.Organization || (g.ContactID ? contactMap[g.ContactID]?.org : '') || '', [contactMap]);

    // Danh sách tổ chức duy nhất (cho bộ lọc)
    const orgOptions = useMemo(() => {
      const set = new Set<string>();
      guests.forEach(g => { const o = orgOf(g); if (o) set.add(o); });
      return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
    }, [guests, orgOf]);

    // Danh sách khách đã lọc + sắp xếp cho Tab Lời mời (sort ổn định — không tự đẩy người đã mời xuống cuối, không xáo khi refetch)
    const filteredSortableGuests = useMemo(() => {
      let list = [...guests];
      if (invFilter !== 'all') list = list.filter(g => (g.InvitationStatus || 'Not Sent') === invFilter);
      if (orgFilter !== 'all') list = list.filter(g => orgOf(g) === orgFilter);
      const dir = sortDir;
      const key = sortKey;
      list.sort((a, b) => {
        let va = '', vb = '';
        if (key === 'Name') { va = a.Name || ''; vb = b.Name || ''; }
        else if (key === 'Org') { va = orgOf(a).toLowerCase(); vb = orgOf(b).toLowerCase(); }
        else if (key === 'Phone') { va = phoneOf(a); vb = phoneOf(b); }
        else if (key === 'Status') { va = a.InvitationStatus || 'Not Sent'; vb = b.InvitationStatus || 'Not Sent'; }
        else if (key === 'Table') { va = a.TableNumber || ''; vb = b.TableNumber || ''; }
        const cmp = va.localeCompare(vb, 'vi');
        if (cmp !== 0) return cmp * dir;
        // Tie-break ổn định: không bao giờ xáo thứ tự giữa 2 khách giống nhau khi refetch
        return (a.GuestID || '').localeCompare(b.GuestID || '');
      });
      return list;
    }, [guests, invFilter, orgFilter, sortKey, sortDir, orgOf, phoneOf]);

    // Danh sách cho Tab Tiền mừng: bỏ khách "Không liên lạc được", sort ổn định theo cột
    const giftGuests = useMemo(() => {
      const list = guests.filter(g => (g.InvitationStatus || 'Not Sent') !== 'Unreachable');
      const dir = sortDir;
      const key = sortKey;
      list.sort((a, b) => {
        let va = '', vb = '';
        if (key === 'Name') { va = a.Name || ''; vb = b.Name || ''; }
        else if (key === 'Org') { va = orgOf(a).toLowerCase(); vb = orgOf(b).toLowerCase(); }
        else if (key === 'Phone') { va = phoneOf(a); vb = phoneOf(b); }
        else if (key === 'Status') { va = a.AttendanceStatus || 'Pending'; vb = b.AttendanceStatus || 'Pending'; }
        else if (key === 'Table') { va = a.TableNumber || ''; vb = b.TableNumber || ''; }
        const cmp = va.localeCompare(vb, 'vi');
        if (cmp !== 0) return cmp * dir;
        return (a.GuestID || '').localeCompare(b.GuestID || '');
      });
      return list;
    }, [guests, sortKey, sortDir, orgOf, phoneOf]);

    function toggleSort(col: string) {
      if (sortKey === col) setSortDir(d => (d === 1 ? -1 : 1));
      else { setSortKey(col); setSortDir(1); }
    }
  // ─── Thống kê ───
  const totalGift = useMemo(() => guests.reduce((s, g) => s + (g.GiftAmount || 0), 0), [guests]);
  const totalCashGift = useMemo(() => guests.reduce((sum, guest) =>
    sum + (guest.GiftMethod !== 'Transfer' ? (guest.GiftAmount || 0) : 0), 0), [guests]);
  const totalTransferGift = useMemo(() => guests.reduce((sum, guest) =>
    sum + (guest.GiftMethod === 'Transfer' ? (guest.GiftAmount || 0) : 0), 0), [guests]);
  const invitedCount = guests.filter(g => g.InvitationStatus === 'Sent' || g.InvitationStatus === 'Accepted' || g.InvitationStatus === 'Declined').length;
  const unreachableCount = guests.filter(g => g.InvitationStatus === 'Unreachable').length;
  const attendedCount = guests.filter(g => g.AttendanceStatus === 'Attended').length;
  const byTable = useMemo(() => {
    const map: Record<string, number> = {};
    guests.forEach(g => { if (g.TableNumber) map[g.TableNumber] = (map[g.TableNumber] || 0) + 1; });
    return map;
  }, [guests]);
  const cashierCandidates = useMemo(() => {
    const query = cashierSearch.trim().toLocaleLowerCase('vi');
    if (!query) return [];
    return giftGuests.filter(guest =>
      guest.Name.toLocaleLowerCase('vi').includes(query) || phoneOf(guest).includes(query),
    ).slice(0, 6);
  }, [cashierSearch, giftGuests, phoneOf]);
  const cashierGuest = useMemo(() => guests.find(guest => guest.GuestID === cashierGuestId) || null, [cashierGuestId, guests]);

  async function handleAddFromContacts() {
    if (!eventId || selectedContacts.length === 0) return;
    setSaving(true); setFormError('');
    try {
      const picked = contacts.filter(c => selectedContacts.includes(c.ContactID));
      await weddingService.addGuestsBatch(picked.map(c => ({
        EventID: eventId,
        ContactID: c.ContactID,
        Name: c.Name,
        Group: 'Other',
        InvitationStatus: 'Not Sent',
        AttendanceStatus: 'Pending',
        GiftAmount: 0,
      })));
      await queryClient.invalidateQueries({ queryKey: ['wedding-guests', eventId] });
      setSelectedContacts([]); setContactSearch('');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Không thể thêm khách từ danh bạ');
    } finally { setSaving(false); }
  }

  async function handleAddQuick() {
    if (!eventId) return;
    const valid = quickRows.filter(r => r.Name.trim());
    if (valid.length === 0) { setFormError('Vui lòng nhập ít nhất 1 tên khách'); return; }
    setSaving(true); setFormError('');
    try {
      await weddingService.addGuestsBatch(valid.map(r => ({
        EventID: eventId,
        Name: r.Name.trim(),
        Organization: r.Organization.trim() || undefined,
        PhoneNumber: r.PhoneNumber.trim() || undefined,
        Group: 'Other',
        InvitationStatus: 'Not Sent',
        AttendanceStatus: 'Pending',
        GiftAmount: 0,
      })));
      await queryClient.invalidateQueries({ queryKey: ['wedding-guests', eventId] });
      setQuickRows([{ Name: '', Organization: '', PhoneNumber: '' }]);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Không thể thêm khách');
    } finally { setSaving(false); }
  }

  async function handleAddTable() {
    if (!eventId || !tableName.trim()) return;
    setSaving(true); setFormError('');
    try {
      await weddingService.addTable({ EventID: eventId, TableName: tableName.trim(), Capacity: tableCapacity });
      await queryClient.invalidateQueries({ queryKey: ['wedding-tables', eventId] });
      setTableName('');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Không thể tạo bàn');
    } finally { setSaving(false); }
  }

  async function updateGuest(id: string, updates: Partial<WeddingGuest>) {
    try {
      await weddingService.updateGuest(id, updates);
      await queryClient.invalidateQueries({ queryKey: ['wedding-guests', eventId] });
    } catch { /* ignore */ }
  }

  async function assignGuestToTable(guestId: string, tableName: string) {
    const table = tables.find(item => item.TableName === tableName);
    const guest = guests.find(item => item.GuestID === guestId);
    const occupied = guests.filter(item => item.TableNumber === tableName && item.GuestID !== guestId).length;
    if (!table || !guest) return;
    if (occupied >= table.Capacity) {
      setFormError(`${tableName} đã đủ ${table.Capacity} chỗ.`);
      return;
    }
    setFormError('');
    await updateGuest(guestId, { TableNumber: tableName });
  }

  /** Format tiền mừng live khi gõ: chỉ giữ số, chèn dấu chấm ngàn VN */
  function handleGiftChange(guestId: string, raw: string) {
    const digits = raw.replace(/[^0-9]/g, '');
    const formatted = digits ? formatVND(parseInt(digits, 10) || 0) : '';
    setGiftInputs(prev => ({ ...prev, [guestId]: formatted }));
  }

  async function handleGiftBlur(guestId: string, raw: string) {
      const value = parseVND(raw);
      setGiftInputs(prev => ({ ...prev, [guestId]: value ? formatVND(value) : '' }));
      // Luôn đồng bộ DB: rỗng -> set null (xoá số cũ), có giá trị -> lưu số tiền.
      // (Trước đây early-return khi rỗng khiến GiftAmount cũ vẫn nằm lại DB và hiện lại sau F5)
      await updateGuest(guestId, value ? { GiftAmount: value } : { GiftAmount: null });
    }

  async function handleQuickCashierSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!cashierGuestId || parseVND(cashierAmount) <= 0) return;
    setCashierSaving(true);
    try {
      await weddingService.updateGuest(cashierGuestId, {
        GiftAmount: parseVND(cashierAmount),
        GiftMethod: cashierMethod,
        AttendanceStatus: 'Attended',
      });
      await queryClient.invalidateQueries({ queryKey: ['wedding-guests', eventId] });
      setCashierSearch('');
      setCashierGuestId(null);
      setCashierAmount('');
      window.setTimeout(() => cashierSearchRef.current?.focus(), 0);
    } finally {
      setCashierSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await weddingService.deleteGuest(id);
      await queryClient.invalidateQueries({ queryKey: ['wedding-guests', eventId] });
      setConfirmDelete(null);
    } catch { setConfirmDelete(null); }
  }

  const invBadge = (v: string) =>
    v === 'Sent' ? 'bg-[#34C759]/10 text-[#34C759]'
    : v === 'Unreachable' ? 'bg-[#FF3B30]/10 text-[#FF3B30]'
    : 'bg-[rgba(0,0,0,0.06)] text-[#8E8E93]';
  const attBadge = (v: string) =>
    v === 'Attended' ? 'bg-[#34C759]/10 text-[#34C759]'
    : v === 'Not Attended' ? 'bg-[#FF3B30]/10 text-[#FF3B30]'
    : 'bg-[rgba(0,0,0,0.06)] text-[#8E8E93]';

  const invLabel: Record<string, string> = { 'Not Sent': 'Chưa mời', Sent: 'Đã mời', Unreachable: 'Không liên lạc được' };
  const attLabel: Record<string, string> = { Pending: 'Chờ', Attended: 'Đã đến', 'Not Attended': 'Không đến' };
  return (
    <div className="page-content min-h-[80vh]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <Link href="/events/wedding">
          <button className="w-8 h-8 rounded-full bg-[rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-[rgba(0,0,0,0.08)] transition-colors shrink-0">
            <ArrowLeft size={18} className="text-[#5F6368]" />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-[22px] font-bold text-[#111] tracking-tight">Quản lý Khách mời</h2>
          <p className="text-[12px] text-[#8E8E93] mt-0.5">Tổng cộng {guests.length} khách · {tables.length} bàn</p>
        </div>
      </div>

      {/* Thanh tiến độ 4 bước */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {STEPS.map((s) => (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] text-[12px] font-semibold whitespace-nowrap transition-all shrink-0 ${
              step === s.id ? 'bg-[#E6002D] text-white shadow-md' : 'bg-white text-[#5F6368] border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.14)]'
            }`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {resolving ? (
        <div className="glass-card p-10 text-center text-[13px] text-[#8E8E93]">Đang tải sự kiện đám cưới...</div>
      ) : noWedding || !eventId ? (
        <div className="glass-card p-10 text-center text-[13px] text-[#8E8E93]">
          Chưa có đám cưới nào. Hãy tạo đám cưới trước ở trang Sự kiện → Thêm sự kiện lớn → Đám cưới.
        </div>
      ) : (
        <>
          {/* ══════════════ BƯỚC 1: THÊM KHÁCH ══════════════ */}
          {step === 'add' && (
            <div className="space-y-5">
              {/* Nguồn A — Từ danh bạ Quan hệ */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Users size={16} className="text-[#007AFF]" />
                  <h3 className="text-[15px] font-bold text-[#111]">Từ danh bạ Quan hệ</h3>
                </div>
                <p className="text-[12px] text-[#8E8E93] mb-4">Chọn sẵn từ danh bạ — có thể chọn Tất cả hoặc tìm kiếm từng người.</p>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                    <input
                      type="search"
                      value={contactSearch}
                      onChange={e => setContactSearch(e.target.value)}
                      placeholder="Tìm theo tên, tổ chức, số điện thoại..."
                      className="w-full h-[40px] pl-[34px] pr-[12px] rounded-[10px] bg-white border border-[rgba(0,0,0,0.08)] text-[14px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[#E6002D] transition-all"
                    />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedContacts(availableContacts.length > 0 ? availableContacts.map(c => c.ContactID) : [])}
                      className="h-[40px] px-4 rounded-[10px] bg-white border border-[rgba(0,0,0,0.08)] text-[12px] font-semibold text-[#5F6368] hover:bg-[rgba(0,0,0,0.02)] transition-all"
                    >
                      <CheckCheck size={14} className="inline mr-1" /> Tất cả ({availableContacts.length})
                    </button>
                    <button
                      onClick={handleAddFromContacts}
                      disabled={saving || selectedContacts.length === 0}
                      className="h-[40px] px-4 rounded-[10px] bg-[#E6002D] text-white text-[12px] font-semibold flex items-center gap-1.5 hover:bg-[#D40028] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={15} strokeWidth={2.5} /> Thêm {selectedContacts.length > 0 ? `(${selectedContacts.length})` : ''}
                    </button>
                  </div>
                </div>
                <div className="max-h-[280px] overflow-y-auto border border-[rgba(0,0,0,0.06)] rounded-[10px] divide-y divide-[rgba(0,0,0,0.04)]">
                  {availableContacts.length === 0 ? (
                    <p className="p-6 text-center text-[12px] text-[#8E8E93]">
                      {contactSearch ? 'Không tìm thấy liên hệ phù hợp.' : 'Không còn liên hệ nào để thêm (đã thêm hết).'}
                    </p>
                  ) : availableContacts.map(c => (
                    <label key={c.ContactID} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[rgba(0,0,0,0.02)] transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(c.ContactID)}
                        onChange={e => setSelectedContacts(prev => e.target.checked ? [...prev, c.ContactID] : prev.filter(x => x !== c.ContactID))}
                        className="w-4 h-4 accent-[#E6002D] shrink-0"
                      />
                      <div className="w-8 h-8 rounded-full bg-[rgba(0,0,0,0.06)] flex items-center justify-center text-[11px] font-bold text-[#5F6368] shrink-0">
                        {c.Name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-[#111] truncate">{c.Name}</p>
                        {(c.Organization1 || c.Phone) && (
                          <p className="text-[11px] text-[#8E8E93] truncate">
                            {c.Organization1 || ''}{c.Organization1 && c.Phone ? ' · ' : ''}{c.Phone || ''}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Nguồn B — Tự nhập nhanh */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <UserPlus size={16} className="text-[#E6002D]" />
                  <h3 className="text-[15px] font-bold text-[#111]">Tự nhập nhanh</h3>
                </div>
                <p className="text-[12px] text-[#8E8E93] mb-4">Thêm mới thông tin cơ bản: tên, tổ chức, số điện thoại.</p>
                <div className="space-y-2.5">
                  {quickRows.map((row, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2">
                      <input
                        value={row.Name}
                        onChange={e => setQuickRows(prev => prev.map((r, idx) => idx === i ? { ...r, Name: e.target.value } : r))}
                        placeholder="Tên khách *"
                        className="h-[40px] px-3.5 rounded-[10px] border border-[rgba(0,0,0,0.08)] text-[13.5px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[#E6002D] transition-all"
                      />
                      <input
                        value={row.Organization}
                        onChange={e => setQuickRows(prev => prev.map((r, idx) => idx === i ? { ...r, Organization: e.target.value } : r))}
                        placeholder="Tổ chức"
                        className="h-[40px] px-3.5 rounded-[10px] border border-[rgba(0,0,0,0.08)] text-[13.5px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[#E6002D] transition-all"
                      />
                      <input
                        value={row.PhoneNumber}
                        onChange={e => setQuickRows(prev => prev.map((r, idx) => idx === i ? { ...r, PhoneNumber: e.target.value } : r))}
                        placeholder="Số điện thoại"
                        inputMode="tel"
                        className="h-[40px] px-3.5 rounded-[10px] border border-[rgba(0,0,0,0.08)] text-[13.5px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[#E6002D] transition-all"
                      />
                      <button
                        onClick={() => setQuickRows(prev => prev.filter((_, idx) => idx !== i))}
                        disabled={quickRows.length === 1}
                        className="h-[40px] w-[40px] rounded-[10px] flex items-center justify-center text-[#9CA3AF] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-all disabled:opacity-30"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <button
                      onClick={() => setQuickRows(prev => [...prev, { Name: '', Organization: '', PhoneNumber: '' }])}
                      className="h-[38px] px-4 rounded-[9px] border border-dashed border-[rgba(0,0,0,0.15)] text-[12px] font-medium text-[#5F6368] flex items-center justify-center gap-1 hover:bg-[rgba(0,0,0,0.02)] transition-all"
                    >
                      <Plus size={14} /> Thêm dòng
                    </button>
                    <button
                      onClick={handleAddQuick}
                      disabled={saving}
                      className="h-[38px] px-5 rounded-[9px] bg-[#E6002D] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#D40028] transition-all shadow-sm disabled:opacity-50"
                    >
                      <Plus size={15} strokeWidth={2.5} /> Thêm {quickRows.filter(r => r.Name.trim()).length > 0 ? `(${quickRows.filter(r => r.Name.trim()).length})` : ''} khách
                    </button>
                  </div>
                </div>
              </div>

              {formError && <p className="text-[12px] text-[#FF3B30]">{formError}</p>}
            </div>
          )}

          {/* ══════════════ BƯỚC 2: XẾP BÀN ══════════════ */}
          {step === 'tables' && (
            <div className="space-y-5">
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Table2 size={16} className="text-[#007AFF]" />
                  <h3 className="text-[15px] font-bold text-[#111]">Tạo bàn tiệc</h3>
                </div>
                <p className="text-[12px] text-[#8E8E93] mb-4">Mở bàn 6 người hoặc 10 người, đặt tên theo ý bạn (VD: Bàn A, Bàn Trưởng họ...).</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    value={tableName}
                    onChange={e => setTableName(e.target.value)}
                    placeholder="Tên bàn (VD: Bàn A)"
                    className="flex-1 h-[42px] px-3.5 rounded-[10px] border border-[rgba(0,0,0,0.08)] text-[13.5px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[#E6002D] transition-all"
                  />
                  <div className="flex gap-2 shrink-0">
                    {([6, 10] as const).map(cap => (
                      <button
                        key={cap}
                        onClick={() => setTableCapacity(cap)}
                        className={`px-4 h-[42px] rounded-[10px] text-[12.5px] font-semibold border transition-all ${
                          tableCapacity === cap ? 'bg-[#E6002D] text-white border-[#E6002D] shadow-sm' : 'bg-white text-[#5F6368] border-[rgba(0,0,0,0.1)] hover:border-[rgba(0,0,0,0.2)]'
                        }`}
                      >
                        {cap} người
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleAddTable}
                    disabled={saving || !tableName.trim()}
                    className="h-[42px] px-5 rounded-[10px] bg-[#111] text-white text-[12.5px] font-semibold flex items-center gap-1.5 hover:bg-black transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    <Plus size={15} strokeWidth={2.5} /> Tạo bàn
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tables.map(t => {
                  const count = byTable[t.TableName] || 0;
                  const capacity = t.Capacity;
                  const full = count >= capacity;
                  const tableGuests = guests.filter(g => g.TableNumber === t.TableName);
                  return (
                    <div key={t.TableID} className={`glass-card p-4 border ${full ? 'border-[rgba(230,0,45,0.35)]' : 'border-[rgba(0,0,0,0.04)]'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-[10px] bg-[rgba(0,122,255,0.1)] flex items-center justify-center">
                            <Table2 size={15} className="text-[#007AFF]" />
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-[#111]">{t.TableName}</p>
                            <p className={`text-[11px] font-medium ${full ? 'text-[#E6002D]' : 'text-[#8E8E93]'}`}>
                              {count}/{capacity} người {full ? '· Đầy' : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setAssignTarget(assignTarget === t.TableName ? null : t.TableName)}
                          className={`px-3 h-[30px] rounded-[8px] text-[11px] font-semibold transition-all ${
                            assignTarget === t.TableName ? 'bg-[#E6002D] text-white' : 'bg-[rgba(0,0,0,0.05)] text-[#5F6368] hover:bg-[rgba(0,0,0,0.08)]'
                          }`}
                        >
                          {assignTarget === t.TableName ? 'Xong' : '+ Gán khách'}
                        </button>
                      </div>
                      {/* Sơ đồ ghế: mỗi ghế có avatar/tên khách hoặc nút + để xếp nhanh */}
                      <div className={`grid gap-2 ${capacity === 6 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                        {Array.from({ length: capacity }, (_, seatIndex) => {
                          const guest = tableGuests[seatIndex];
                          if (!guest) {
                            return (
                              <button
                                key={`empty-${seatIndex}`}
                                onClick={() => { if (!full) setAssignTarget(t.TableName); }}
                                disabled={full}
                                className="min-h-[54px] rounded-[10px] border border-dashed border-[rgba(0,122,255,0.28)] bg-[#007AFF]/[0.025] text-[#007AFF] flex flex-col items-center justify-center gap-1 hover:bg-[#007AFF]/[0.08] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                title={`Thêm khách vào ghế ${seatIndex + 1}`}
                              >
                                <Plus size={16} />
                                <span className="text-[9px] font-semibold">Ghế trống</span>
                              </button>
                            );
                          }
                          const initials = guest.Name.split(/\s+/).filter(Boolean).slice(-2).map(name => name[0]).join('').toUpperCase();
                          return (
                            <div key={guest.GuestID} className="relative min-h-[54px] rounded-[10px] border border-[rgba(0,0,0,0.05)] bg-white px-2 py-2 flex items-center gap-2 shadow-sm">
                              <div className="w-7 h-7 rounded-full shrink-0 bg-[#E6002D]/10 text-[#E6002D] flex items-center justify-center text-[9px] font-bold">{initials || '?'}</div>
                              <span className="min-w-0 flex-1 text-[10px] font-semibold text-[#374151] leading-snug line-clamp-2">{guest.Name}</span>
                              <button
                                onClick={() => updateGuest(guest.GuestID!, { TableNumber: null })}
                                className="absolute -right-1 -top-1 w-4 h-4 rounded-full bg-white border border-black/[0.08] text-[#9CA3AF] hover:text-[#FF3B30] hover:border-[#FF3B30]/30 flex items-center justify-center transition-colors"
                                title="Bỏ khỏi bàn"
                              ><X size={10} /></button>
                            </div>
                          );
                        })}
                      </div>
                      {/* Chọn khách gán vào bàn */}
                      {assignTarget === t.TableName && (
                        <div className="mt-3 pt-3 border-t border-dashed border-[rgba(0,0,0,0.08)]">
                          <select
                            value=""
                            onChange={e => {
                              if (e.target.value) assignGuestToTable(e.target.value, t.TableName);
                            }}
                            className="w-full h-[36px] px-2.5 rounded-[8px] border border-[rgba(0,0,0,0.08)] text-[12px] text-[#111] bg-white outline-none focus:border-[#E6002D] transition-all"
                          >
                            <option value="">Chọn khách để xếp vào {t.TableName}...</option>
                            {guests.filter(g => !g.TableNumber || g.TableNumber === t.TableName).map(g => (
                              <option key={g.GuestID} value={g.GuestID}>{g.Name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
                {tables.length === 0 && (
                  <div className="glass-card p-8 text-center text-[12.5px] text-[#8E8E93] md:col-span-2 lg:col-span-3">
                    Chưa có bàn nào. Hãy tạo bàn đầu tiên (6 hoặc 10 người) ở trên.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════ BƯỚC 3: CHECKLIST LỜI MỜI ══════════════ */}
          {step === 'invite' && (
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1.5 rounded-full bg-[#34C759]/10 text-[#34C759] text-[11.5px] font-semibold">✓ {invitedCount} đã mời</span>
                <span className="px-3 py-1.5 rounded-full bg-[rgba(0,0,0,0.06)] text-[#8E8E93] text-[11.5px] font-semibold">{guests.length - invitedCount - unreachableCount} chưa mời</span>
                <span className="px-3 py-1.5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] text-[11.5px] font-semibold">! {unreachableCount} không liên lạc được</span>
              </div>
              {guestsLoading ? (
                <div className="glass-card p-10 text-center text-[13px] text-[#8E8E93]">Đang tải khách mời...</div>
              ) : guests.length === 0 ? (
                <div className="glass-card p-10 text-center text-[13px] text-[#8E8E93]">Chưa có khách mời. Quay lại Bước 1 để thêm khách.</div>
              ) : (
                <div className="glass-card-compact overflow-hidden border border-[rgba(0,0,0,0.04)] rounded-[12px]">
                                {/* Bộ lọc trạng thái + tổ chức */}
                                <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[rgba(0,0,0,0.04)] bg-white">
                                  <Filter size={13} className="text-[#8E8E93]" />
                                  <span className="text-[11px] font-semibold text-[#8E8E93] mr-1">Lọc:</span>
                                  {([
                                    ['all', 'Tất cả'],
                                    ['Sent', 'Đã mời'],
                                    ['Not Sent', 'Chưa mời'],
                                    ['Unreachable', 'Không liên lạc được'],
                                  ] as const).map(([val, label]) => (
                                    <button
                                      key={val}
                                      onClick={() => setInvFilter(val)}
                                      className={`px-2.5 py-1 rounded-[7px] text-[11px] font-semibold transition-colors ${
                                        invFilter === val ? 'bg-[#E6002D] text-white' : 'bg-[rgba(0,0,0,0.05)] text-[#5F6368] hover:bg-[rgba(0,0,0,0.09)]'
                                      }`}
                                    >
                                      {label}
                                    </button>
                                  ))}
                                  <span className="w-px h-5 bg-[rgba(0,0,0,0.08)] mx-1 hidden sm:block" />
                                  <select
                                    value={orgFilter}
                                    onChange={e => setOrgFilter(e.target.value)}
                                    className="h-[26px] px-2 rounded-[7px] bg-white border border-[rgba(0,0,0,0.1)] text-[11px] font-semibold text-[#5F6368] outline-none cursor-pointer focus:border-[#E6002D] transition-colors"
                                  >
                                    <option value="all">Tổ chức: Tất cả</option>
                                    {orgOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                  </select>
                                </div>
                                <div className="hidden md:block w-full overflow-x-auto">
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="bg-[rgba(0,0,0,0.02)] border-b border-[rgba(0,0,0,0.03)]">
                                        <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-[#8E8E93] uppercase cursor-pointer select-none" onClick={() => toggleSort('Name')}>Tên khách <SortIcon col="Name" sortKey={sortKey} sortDir={sortDir} /></th>
                                        <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-[#8E8E93] uppercase cursor-pointer select-none" onClick={() => toggleSort('Org')}>Tổ chức <SortIcon col="Org" sortKey={sortKey} sortDir={sortDir} /></th>
                                        <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-[#8E8E93] uppercase cursor-pointer select-none" onClick={() => toggleSort('Phone')}>SĐT <SortIcon col="Phone" sortKey={sortKey} sortDir={sortDir} /></th>
                                        <th className="py-2.5 px-4 text-center text-[11px] font-semibold text-[#8E8E93] uppercase cursor-pointer select-none" onClick={() => toggleSort('Status')}>Trạng thái mời <SortIcon col="Status" sortKey={sortKey} sortDir={sortDir} /></th>
                                        <th className="py-2.5 px-4 text-center text-[11px] font-semibold text-[#8E8E93] uppercase cursor-pointer select-none" onClick={() => toggleSort('Table')}>Bàn <SortIcon col="Table" sortKey={sortKey} sortDir={sortDir} /></th>
                                        <th className="py-2.5 px-4 text-center w-[40px]"></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {filteredSortableGuests.map((guest) => (
                                        <tr key={guest.GuestID} className="border-b border-[rgba(0,0,0,0.03)] last:border-b-0 hover:bg-[rgba(230,0,45,0.02)] transition-colors">
                                          <td className="py-3 px-4">
                                            <span className="text-[13px] font-semibold text-[#111]">{guest.Name}</span>
                                            {guest.Notes && <span className="block text-[11px] text-[#9CA3AF] truncate max-w-[180px]">{guest.Notes}</span>}
                                          </td>
                                          <td className="py-3 px-4">
                                            <div className="flex items-center gap-1.5 text-[11.5px] text-[#8E8E93]">
                                              {orgOf(guest) ? <><Building2 size={11} />{orgOf(guest)}</> : '—'}
                                            </div>
                                          </td>
                                          <td className="py-3 px-4">
                                            <div className="flex items-center gap-1.5 text-[11.5px] text-[#8E8E93]">
                                              {phoneOf(guest) ? <><Phone size={11} />{phoneOf(guest)}</> : '—'}
                                            </div>
                                          </td>
                                          <td className="py-3 px-4 text-center">
                                            <select
                                              value={guest.InvitationStatus || 'Not Sent'}
                                              onChange={e => updateGuest(guest.GuestID!, { InvitationStatus: e.target.value })}
                                              className={`text-[11.5px] font-medium rounded-[6px] border-0 outline-none cursor-pointer px-1.5 py-1 ${invBadge(guest.InvitationStatus || 'Not Sent')}`}
                                            >
                                              {INVITATION_FLOW.map(v => <option key={v} value={v}>{invLabel[v]}</option>)}
                                            </select>
                                          </td>
                                          <td className="py-3 px-4 text-center">
                                            <select
                                              value={guest.TableNumber || ''}
                                              onChange={e => e.target.value ? assignGuestToTable(guest.GuestID!, e.target.value) : updateGuest(guest.GuestID!, { TableNumber: null })}
                                              className="text-[11.5px] font-medium rounded-[6px] border border-[rgba(0,0,0,0.08)] outline-none cursor-pointer px-1.5 py-1 bg-white text-[#5F6368]"
                                            >
                                              <option value="">—</option>
                                              {tables.map(t => <option key={t.TableID} value={t.TableName}>{t.TableName}</option>)}
                                            </select>
                                          </td>
                                          <td className="py-3 px-4 text-center">
                                            <button
                                              onClick={() => setConfirmDelete(guest.GuestID!)}
                                              className="w-7 h-7 rounded-full flex items-center justify-center text-[#9CA3AF] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors"
                                              title="Xoá khách"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                {/* Mobile */}
                                <div className="md:hidden divide-y divide-[rgba(0,0,0,0.03)]">
                                  {filteredSortableGuests.map((guest) => (
                                    <div key={guest.GuestID} className="p-4 bg-white space-y-2.5">
                                      <div className="flex justify-between items-start">
                                        <div className="min-w-0 flex-1">
                                          <h4 className="text-[14px] font-bold text-[#111]">{guest.Name}</h4>
                                          <div className="text-[11.5px] text-[#8E8E93]">
                                            <p className="flex items-center gap-1"><Phone size={11} />{phoneOf(guest) || '—'}</p>
                                            <p className="flex items-center gap-1"><Building2 size={11} />{orgOf(guest) || '—'}</p>
                                          </div>
                                        </div>
                                        <button onClick={() => setConfirmDelete(guest.GuestID!)} className="w-7 h-7 rounded-full flex items-center justify-center text-[#9CA3AF]" title="Xoá">
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <select
                                          value={guest.InvitationStatus || 'Not Sent'}
                                          onChange={e => updateGuest(guest.GuestID!, { InvitationStatus: e.target.value })}
                                          className={`text-[11.5px] font-medium rounded-[6px] border-0 outline-none cursor-pointer px-1.5 py-1 ${invBadge(guest.InvitationStatus || 'Not Sent')}`}
                                        >
                                          {INVITATION_FLOW.map(v => <option key={v} value={v}>{invLabel[v]}</option>)}
                                        </select>
                                        <select
                                          value={guest.TableNumber || ''}
                                          onChange={e => e.target.value ? assignGuestToTable(guest.GuestID!, e.target.value) : updateGuest(guest.GuestID!, { TableNumber: null })}
                                          className="text-[11.5px] font-medium rounded-[6px] border border-[rgba(0,0,0,0.08)] outline-none cursor-pointer px-1.5 py-1 bg-white text-[#5F6368]"
                                        >
                                          <option value="">Bàn: —</option>
                                          {tables.map(t => <option key={t.TableID} value={t.TableName}>{t.TableName}</option>)}
                                        </select>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════ BƯỚC 4: ĐÃ ĐẾN & TIỀN MỪNG ══════════════ */}
          {step === 'gifts' && (
            <div>
              <form onSubmit={handleQuickCashierSubmit} className="glass-card p-4 sm:p-5 mb-5 border border-[#E6002D]/15 bg-[linear-gradient(135deg,rgba(255,240,242,0.9),rgba(255,255,255,0.82))]">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                  <div>
                    <div className="flex items-center gap-2"><Wallet size={17} className="text-[#E6002D]" /><h3 className="text-[15px] font-bold text-[#111]">Quầy thu tiền mừng nhanh</h3></div>
                    <p className="text-[11px] text-[#8E8E93] mt-1">Gõ tên → chọn khách → nhập tiền → nhấn Enter để lưu ngay.</p>
                  </div>
                  <span className="text-[10px] font-semibold text-[#E6002D] bg-[#E6002D]/8 px-2.5 py-1 rounded-full">Phím Enter để lưu</span>
                </div>
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(180px,0.7fr)_auto] lg:items-start">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-[18px] -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                    <input
                      ref={cashierSearchRef}
                      value={cashierSearch}
                      onChange={e => { setCashierSearch(e.target.value); setCashierGuestId(null); }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && cashierCandidates[0]) {
                          e.preventDefault();
                          setCashierGuestId(cashierCandidates[0].GuestID!);
                          setCashierAmount(cashierCandidates[0].GiftAmount ? formatVND(cashierCandidates[0].GiftAmount) : '');
                          window.setTimeout(() => cashierAmountRef.current?.focus(), 0);
                        }
                      }}
                      placeholder="Tìm tên hoặc số điện thoại khách..."
                      className="w-full h-[38px] pl-9 pr-3 rounded-[10px] border border-black/[0.09] bg-white text-[13px] outline-none focus:border-[#E6002D]"
                    />
                    {cashierCandidates.length > 0 && !cashierGuestId && (
                      <div className="absolute z-20 top-[43px] inset-x-0 rounded-[11px] border border-black/[0.07] bg-white shadow-xl overflow-hidden">
                        {cashierCandidates.map(guest => (
                          <button key={guest.GuestID} type="button" onClick={() => { setCashierGuestId(guest.GuestID!); setCashierAmount(guest.GiftAmount ? formatVND(guest.GiftAmount) : ''); window.setTimeout(() => cashierAmountRef.current?.focus(), 0); }} className="w-full px-3 py-2.5 flex items-center gap-2 text-left hover:bg-[#FFF5F6] transition-colors">
                            <span className="w-7 h-7 rounded-full bg-[#E6002D]/10 text-[#E6002D] flex items-center justify-center text-[10px] font-bold">{guest.Name.charAt(0).toUpperCase()}</span>
                            <span className="min-w-0"><span className="block text-[12px] font-semibold text-[#111] truncate">{guest.Name}</span><span className="block text-[10px] text-[#8E8E93]">{phoneOf(guest) || guest.TableNumber || 'Khách mời'}</span></span>
                          </button>
                        ))}
                      </div>
                    )}
                    {cashierGuest && <div className="mt-2 flex items-center gap-2 text-[11px] text-[#5F6368]"><span className="w-5 h-5 rounded-full bg-[#34C759]/10 text-[#34C759] inline-flex items-center justify-center"><CheckCheck size={12} /></span><span>Đang thu: <strong className="text-[#111]">{cashierGuest.Name}</strong></span><button type="button" onClick={() => { setCashierGuestId(null); setCashierAmount(''); }} className="text-[#E6002D]">Đổi</button></div>}
                  </div>
                  <div>
                    <div className="relative"><input ref={cashierAmountRef} value={cashierAmount} onChange={e => { const digits = e.target.value.replace(/\D/g, ''); setCashierAmount(digits ? formatVND(Number(digits)) : ''); }} inputMode="numeric" placeholder="Số tiền mừng" className="w-full h-[38px] px-3 pr-7 rounded-[10px] border border-black/[0.09] bg-white text-[13px] font-semibold text-right outline-none focus:border-[#E6002D]" /><span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#8E8E93]">đ</span></div>
                    <div className="flex flex-wrap gap-1 mt-2">{[500000, 1000000, 2000000, 5000000].map(amount => <button key={amount} type="button" onClick={() => { setCashierAmount(formatVND(amount)); cashierAmountRef.current?.focus(); }} className="h-[24px] px-2 rounded-[6px] bg-white border border-black/[0.07] text-[9.5px] font-semibold text-[#5F6368] hover:border-[#E6002D]/30 hover:text-[#E6002D]">{amount >= 1000000 ? `${amount / 1000000}M` : '500k'}</button>)}</div>
                  </div>
                  <div className="flex gap-2 lg:flex-col xl:flex-row">
                    <div className="flex h-[38px] rounded-[10px] border border-black/[0.09] bg-white p-0.5"><button type="button" onClick={() => setCashierMethod('Cash')} className={`px-2.5 rounded-[7px] text-[10px] font-semibold transition-colors ${cashierMethod === 'Cash' ? 'bg-[#34C759]/12 text-[#228B45]' : 'text-[#8E8E93]'}`}>Tiền mặt</button><button type="button" onClick={() => setCashierMethod('Transfer')} className={`px-2.5 rounded-[7px] text-[10px] font-semibold transition-colors ${cashierMethod === 'Transfer' ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'text-[#8E8E93]'}`}>Chuyển khoản</button></div>
                    <button type="submit" disabled={!cashierGuestId || parseVND(cashierAmount) <= 0 || cashierSaving} className="h-[38px] px-3.5 rounded-[10px] bg-[#E6002D] text-white text-[11px] font-bold inline-flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"><CheckCheck size={14} />{cashierSaving ? 'Đang lưu' : 'Thu tiền'}</button>
                  </div>
                </div>
              </form>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <div className="glass-card p-4">
                  <p className="text-[11px] font-semibold text-[#8E8E93] mb-1">Tiền mặt</p>
                  <p className="text-[20px] font-bold text-[#34C759]">{formatVND(totalCashGift)} đ</p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-[11px] font-semibold text-[#8E8E93] mb-1">Chuyển khoản</p>
                  <p className="text-[20px] font-bold text-[#007AFF]">{formatVND(totalTransferGift)} đ</p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-[11px] font-semibold text-[#8E8E93] mb-1">Khách đã đến</p>
                  <p className="text-[22px] font-bold text-[#34C759]">{attendedCount}</p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-[11px] font-semibold text-[#8E8E93] mb-1 flex items-center gap-1"><Wallet size={11} /> Tổng tiền mừng</p>
                  <p className="text-[22px] font-bold text-[#E6002D]">{formatVND(totalGift)} đ</p>
                </div>
              </div>

              {giftGuests.length === 0 ? (
                <div className="glass-card p-10 text-center text-[13px] text-[#8E8E93]">Chưa có khách mời hợp lệ.</div>
              ) : (
                <div className="glass-card-compact overflow-hidden border border-[rgba(0,0,0,0.04)] rounded-[12px]">
                  <div className="hidden md:block w-full overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[rgba(0,0,0,0.02)] border-b border-[rgba(0,0,0,0.03)]">
                          <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-[#8E8E93] uppercase cursor-pointer select-none" onClick={() => toggleSort('Name')}>Tên khách <SortIcon col="Name" sortKey={sortKey} sortDir={sortDir} /></th>
                          <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-[#8E8E93] uppercase cursor-pointer select-none" onClick={() => toggleSort('Org')}>Tổ chức <SortIcon col="Org" sortKey={sortKey} sortDir={sortDir} /></th>
                          <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-[#8E8E93] uppercase cursor-pointer select-none" onClick={() => toggleSort('Phone')}>SĐT <SortIcon col="Phone" sortKey={sortKey} sortDir={sortDir} /></th>
                          <th className="py-2.5 px-4 text-center text-[11px] font-semibold text-[#8E8E93] uppercase cursor-pointer select-none" onClick={() => toggleSort('Status')}>Đã đến? <SortIcon col="Status" sortKey={sortKey} sortDir={sortDir} /></th>
                          <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-[#8E8E93] uppercase">Tiền mừng (VND)</th>
                          <th className="py-2.5 px-4 text-center text-[11px] font-semibold text-[#8E8E93] uppercase cursor-pointer select-none" onClick={() => toggleSort('Table')}>Bàn <SortIcon col="Table" sortKey={sortKey} sortDir={sortDir} /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {giftGuests.map((guest) => (
                          <tr key={guest.GuestID} className="border-b border-[rgba(0,0,0,0.03)] last:border-b-0 hover:bg-[rgba(230,0,45,0.02)] transition-colors">
                            <td className="py-3 px-4">
                              <span className="text-[13px] font-semibold text-[#111]">{guest.Name}</span>
                              {guest.Notes && <span className="block text-[11px] text-[#9CA3AF] truncate max-w-[160px]">{guest.Notes}</span>}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 text-[11.5px] text-[#8E8E93]">
                                {orgOf(guest) ? <><Building2 size={11} />{orgOf(guest)}</> : '—'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 text-[11.5px] text-[#8E8E93]">
                                {phoneOf(guest) ? <><Phone size={11} />{phoneOf(guest)}</> : '—'}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <select
                                value={guest.AttendanceStatus || 'Pending'}
                                onChange={e => updateGuest(guest.GuestID!, { AttendanceStatus: e.target.value })}
                                className={`text-[11.5px] font-medium rounded-[6px] border-0 outline-none cursor-pointer px-1.5 py-1 ${attBadge(guest.AttendanceStatus || 'Pending')}`}
                              >
                                {ATTENDANCES.map(v => <option key={v} value={v}>{attLabel[v]}</option>)}
                              </select>
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={giftInputs[guest.GuestID!] ?? (guest.GiftAmount ? formatVND(guest.GiftAmount) : '')}
                                onChange={e => handleGiftChange(guest.GuestID!, e.target.value)}
                                onBlur={e => handleGiftBlur(guest.GuestID!, e.target.value)}
                                placeholder="0"
                                className="w-full max-w-[160px] h-[36px] px-3 rounded-[8px] border border-[rgba(0,0,0,0.08)] text-[13px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[#E6002D] transition-all text-right"
                              />
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-[12px] text-[#5F6368]">{guest.TableNumber || '—'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile */}
                  <div className="md:hidden divide-y divide-[rgba(0,0,0,0.03)]">
                    {giftGuests.map((guest) => (
                      <div key={guest.GuestID} className="p-4 bg-white space-y-2.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-[14px] font-bold text-[#111]">{guest.Name}</h4>
                            <p className="text-[11.5px] text-[#8E8E93]">
                              {orgOf(guest) && <span className="flex items-center gap-1"><Building2 size={11} />{orgOf(guest)}</span>}
                              {phoneOf(guest) && <span className="flex items-center gap-1"><Phone size={11} />{phoneOf(guest)}</span>}
                              <span>{guest.TableNumber ? `Bàn ${guest.TableNumber}` : 'Chưa xếp bàn'}</span>
                            </p>
                          </div>
                          <select
                            value={guest.AttendanceStatus || 'Pending'}
                            onChange={e => updateGuest(guest.GuestID!, { AttendanceStatus: e.target.value })}
                            className={`text-[11.5px] font-medium rounded-[6px] border-0 outline-none cursor-pointer px-1.5 py-1 ${attBadge(guest.AttendanceStatus || 'Pending')}`}
                          >
                            {ATTENDANCES.map(v => <option key={v} value={v}>{attLabel[v]}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10.5px] font-semibold text-[#8E8E93] mb-1">Tiền mừng (VND)</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={giftInputs[guest.GuestID!] ?? (guest.GiftAmount ? formatVND(guest.GiftAmount) : '')}
                            onChange={e => handleGiftChange(guest.GuestID!, e.target.value)}
                            onBlur={e => handleGiftBlur(guest.GuestID!, e.target.value)}
                            placeholder="0"
                            className="w-full h-[38px] px-3 rounded-[8px] border border-[rgba(0,0,0,0.08)] text-[14px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[#E6002D] transition-all"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal — Xác nhận xoá */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm bg-white rounded-[16px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-[17px] font-bold text-[#111] mb-2">Xoá khách mời</h3>
            <p className="text-[13px] text-[#5F6368] mb-5">Bạn có chắc muốn xoá khách này khỏi danh sách? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 h-[42px] rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13px] font-semibold text-[#5F6368] hover:bg-[rgba(0,0,0,0.02)] transition-all">
                Huỷ
              </button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 h-[42px] rounded-[10px] bg-[#FF3B30] text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#E5352B] transition-all">
                <Trash2 size={14} /> Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
