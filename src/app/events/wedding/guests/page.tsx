'use client';

import React, { useMemo, useState } from 'react';
import { Search, Plus, Users, ArrowLeft, X, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query';
import EventPicker from '@/components/events/event-picker';
import { weddingService, getPartyEvents } from '@/lib/services/event-organization-service';
import { formatVND } from '@/lib/utils';

const INVITATIONS = ['Not Sent', 'Sent', 'Accepted', 'Declined'] as const;
const ATTENDANCES = ['Pending', 'Attended', 'Not Attended'] as const;
const GROUPS = ['Nhà Trai', 'Nhà Gái', 'Bạn bè', 'Đồng nghiệp', 'Họ hàng', 'Khác'] as const;

export default function WeddingGuestsPage() {
  const queryClient = useQueryClient();
  const [eventId, setEventId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Form — thêm khách
  const [name, setName] = useState('');
  const [group, setGroup] = useState('Nhà Trai');
  const [invitation, setInvitation] = useState<string>('Not Sent');
  const [attendance, setAttendance] = useState<string>('Pending');
  const [table, setTable] = useState('');
  const [gift, setGift] = useState('');
  const [note, setNote] = useState('');

  const { data: pickerEvents = [], isLoading: pickerLoading } = useQuery({
    queryKey: ['party-events'],
    queryFn: getPartyEvents,
    staleTime: 60_000,
  });

  const { data: guests = [], isLoading: guestsLoading, refetch } = useQuery({
    queryKey: ['wedding-guests', eventId],
    queryFn: () => weddingService.getGuests(eventId!),
    enabled: !!eventId,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return guests;
    const q = search.trim().toLowerCase();
    return guests.filter(g =>
      g.Name.toLowerCase().includes(q) ||
      (g.Group || '').toLowerCase().includes(q) ||
      (g.TableNumber || '').toLowerCase().includes(q)
    );
  }, [guests, search]);

  function resetForm() {
    setName(''); setGroup('Nhà Trai'); setInvitation('Not Sent');
    setAttendance('Pending'); setTable(''); setGift(''); setNote(''); setFormError('');
  }

  async function handleAdd() {
    if (!eventId) return;
    if (!name.trim()) { setFormError('Vui lòng nhập tên khách'); return; }
    setSaving(true); setFormError('');
    try {
      await weddingService.addGuest({
        EventID: eventId,
        Name: name.trim(),
        Group: group,
        InvitationStatus: invitation,
        AttendanceStatus: attendance,
        TableNumber: table.trim() || undefined,
        GiftAmount: gift.trim() ? Number(gift.replace(/\./g, '').replace(',', '.')) : 0,
        Notes: note.trim() || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['wedding-guests', eventId] });
      setShowAdd(false); resetForm();
    } catch (e: any) {
      setFormError(e?.message || 'Không thể thêm khách');
    } finally { setSaving(false); }
  }

  async function updateGuest(id: string, updates: Record<string, unknown>) {
    try {
      await weddingService.updateGuest(id, updates);
      await queryClient.invalidateQueries({ queryKey: ['wedding-guests', eventId] });
    } catch { /* ignore */ }
  }

  async function handleDelete(id: string) {
    try {
      await weddingService.deleteGuest(id);
      await queryClient.invalidateQueries({ queryKey: ['wedding-guests', eventId] });
      setConfirmDelete(null);
    } catch { setConfirmDelete(null); }
  }

  const invBadge = (v: string) =>
    v === 'Accepted' ? 'bg-[rgba(230,0,45,0.1)] text-[#E6002D]'
    : v === 'Sent' ? 'bg-[rgba(0,122,255,0.1)] text-[#007AFF]'
    : v === 'Declined' ? 'bg-[#FF3B30]/10 text-[#FF3B30]'
    : 'bg-[rgba(0,0,0,0.06)] text-[#8E8E93]';
  const attBadge = (v: string) =>
    v === 'Attended' ? 'bg-[#34C759]/10 text-[#34C759]'
    : v === 'Not Attended' ? 'bg-[#FF3B30]/10 text-[#FF3B30]'
    : 'bg-[rgba(0,0,0,0.06)] text-[#8E8E93]';

  const invLabel: Record<string, string> = { 'Not Sent': 'Chưa gửi', Sent: 'Đã gửi', Accepted: 'Đã mời', Declined: 'Từ chối' };
  const attLabel: Record<string, string> = { Pending: 'Chờ', Attended: 'Tham gia', 'Not Attended': 'Không tham gia' };

  return (
    <div className="page-content min-h-[80vh]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <Link href="/events/wedding">
          <button className="w-8 h-8 rounded-full bg-[rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-[rgba(0,0,0,0.08)] transition-colors shrink-0">
            <ArrowLeft size={18} className="text-[#5F6368]" />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-[22px] font-bold text-[#111] tracking-tight">Danh sách Khách mời</h2>
          <p className="text-[12px] text-[#8E8E93] mt-0.5">Tổng cộng {guests.length} khách</p>
        </div>
        <EventPicker value={eventId} onChange={setEventId} events={pickerEvents} loading={pickerLoading} />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm khách mời..."
            className="w-full h-[38px] pl-[34px] pr-[12px] rounded-[8px] bg-white border border-[rgba(0,0,0,0.06)] text-[13px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[#E6002D] transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <button
            onClick={() => setShowAdd(true)}
            className="flex-1 sm:flex-none h-[38px] px-4 rounded-[8px] bg-[#E6002D] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#D40028] transition-all shadow-sm"
          >
            <Plus size={16} strokeWidth={2.5} /> Thêm khách
          </button>
        </div>
      </div>

      {guestsLoading ? (
        <div className="glass-card p-10 text-center text-[13px] text-[#8E8E93]">Đang tải khách mời...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-10 text-center text-[13px] text-[#8E8E93]">
          {search ? 'Không tìm thấy khách mời phù hợp.' : 'Chưa có khách mời nào. Hãy thêm khách đầu tiên.'}
        </div>
      ) : (
        <div className="glass-card-compact overflow-hidden border border-[rgba(0,0,0,0.04)] rounded-[12px]">
          {/* Desktop Table View */}
          <div className="hidden md:block w-full overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[rgba(0,0,0,0.02)] border-b border-[rgba(0,0,0,0.03)]">
                  <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-[#8E8E93] uppercase">Tên khách</th>
                  <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-[#8E8E93] uppercase">Nhóm</th>
                  <th className="py-2.5 px-4 text-center text-[11px] font-semibold text-[#8E8E93] uppercase">Bàn</th>
                  <th className="py-2.5 px-4 text-center text-[11px] font-semibold text-[#8E8E93] uppercase">Lời mời</th>
                  <th className="py-2.5 px-4 text-center text-[11px] font-semibold text-[#8E8E93] uppercase">Phản hồi (RSVP)</th>
                  <th className="py-2.5 px-4 text-right text-[11px] font-semibold text-[#8E8E93] uppercase">Tiền mừng</th>
                  <th className="py-2.5 px-4 text-center w-[40px]"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((guest) => (
                  <tr key={guest.GuestID} className="border-b border-[rgba(0,0,0,0.03)] last:border-b-0 hover:bg-[rgba(230,0,45,0.02)] transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-[13px] font-semibold text-[#111]">{guest.Name}</span>
                      {guest.Notes && <span className="block text-[11px] text-[#9CA3AF] truncate max-w-[180px]">{guest.Notes}</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[12px] text-[#5F6368]">{guest.Group || '—'}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[12px] font-medium text-[#5F6368]">{guest.TableNumber || '—'}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <select
                        value={guest.InvitationStatus || 'Not Sent'}
                        onChange={e => updateGuest(guest.GuestID!, { InvitationStatus: e.target.value })}
                        className={`text-[11px] font-medium rounded-[6px] border-0 outline-none cursor-pointer ${invBadge(guest.InvitationStatus || 'Not Sent')}`}
                      >
                        {INVITATIONS.map(v => <option key={v} value={v}>{invLabel[v]}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <select
                        value={guest.AttendanceStatus || 'Pending'}
                        onChange={e => updateGuest(guest.GuestID!, { AttendanceStatus: e.target.value })}
                        className={`text-[11px] font-medium rounded-[6px] border-0 outline-none cursor-pointer ${attBadge(guest.AttendanceStatus || 'Pending')}`}
                      >
                        {ATTENDANCES.map(v => <option key={v} value={v}>{attLabel[v]}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[13px] font-medium text-[#111]">{guest.GiftAmount ? `+${formatVND(guest.GiftAmount)} đ` : '—'}</span>
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

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-[rgba(0,0,0,0.03)]">
            {filtered.map((guest) => (
              <div key={guest.GuestID} className="p-4 bg-white">
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[14px] font-bold text-[#111]">{guest.Name}</h4>
                    <p className="text-[12px] text-[#5F6368]">{guest.Group || '—'}{guest.TableNumber ? ` • Bàn ${guest.TableNumber}` : ''}</p>
                  </div>
                  <button
                    onClick={() => setConfirmDelete(guest.GuestID!)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[#9CA3AF] ml-2"
                    title="Xoá khách"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-dashed border-[rgba(0,0,0,0.06)]">
                  <select
                    value={guest.InvitationStatus || 'Not Sent'}
                    onChange={e => updateGuest(guest.GuestID!, { InvitationStatus: e.target.value })}
                    className={`text-[11px] font-medium rounded-[6px] border-0 outline-none cursor-pointer ${invBadge(guest.InvitationStatus || 'Not Sent')}`}
                  >
                    {INVITATIONS.map(v => <option key={v} value={v}>{invLabel[v]}</option>)}
                  </select>
                  <select
                    value={guest.AttendanceStatus || 'Pending'}
                    onChange={e => updateGuest(guest.GuestID!, { AttendanceStatus: e.target.value })}
                    className={`text-[11px] font-medium rounded-[6px] border-0 outline-none cursor-pointer ${attBadge(guest.AttendanceStatus || 'Pending')}`}
                  >
                    {ATTENDANCES.map(v => <option key={v} value={v}>{attLabel[v]}</option>)}
                  </select>
                  <div className="col-span-2 text-[15px] font-bold text-[#111] pt-1">
                    {guest.GiftAmount ? `+${formatVND(guest.GiftAmount)} đ` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal — Thêm khách */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md bg-white rounded-[16px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[17px] font-bold text-[#111]">Thêm khách mời</h3>
              <button onClick={() => { setShowAdd(false); resetForm(); }} className="w-8 h-8 rounded-full bg-[rgba(0,0,0,0.05)] flex items-center justify-center hover:bg-[rgba(0,0,0,0.1)] transition-colors">
                <X size={16} className="text-[#5F6368]" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#5F6368] mb-1.5">Tên khách *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="VD: Nguyễn Văn A" autoFocus className="w-full h-[42px] px-3.5 rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13.5px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[#E6002D] transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-[#5F6368] mb-1.5">Nhóm</label>
                  <select value={group} onChange={e => setGroup(e.target.value)} className="w-full h-[42px] px-3 rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13.5px] text-[#111] bg-white outline-none focus:border-[#E6002D] transition-all">
                    {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#5F6368] mb-1.5">Số bàn</label>
                  <input value={table} onChange={e => setTable(e.target.value)} placeholder="VD: 12" className="w-full h-[42px] px-3.5 rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13.5px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[#E6002D] transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-[#5F6368] mb-1.5">Lời mời</label>
                  <select value={invitation} onChange={e => setInvitation(e.target.value)} className="w-full h-[42px] px-3 rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13.5px] text-[#111] bg-white outline-none focus:border-[#E6002D] transition-all">
                    {INVITATIONS.map(v => <option key={v} value={v}>{invLabel[v]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#5F6368] mb-1.5">Phản hồi</label>
                  <select value={attendance} onChange={e => setAttendance(e.target.value)} className="w-full h-[42px] px-3 rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13.5px] text-[#111] bg-white outline-none focus:border-[#E6002D] transition-all">
                    {ATTENDANCES.map(v => <option key={v} value={v}>{attLabel[v]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#5F6368] mb-1.5">Tiền mừng (VND)</label>
                <input value={gift} onChange={e => setGift(e.target.value)} placeholder="VD: 1000000" inputMode="numeric" className="w-full h-[42px] px-3.5 rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13.5px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[#E6002D] transition-all" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#5F6368] mb-1.5">Ghi chú</label>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú (tuỳ chọn)" className="w-full h-[42px] px-3.5 rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13.5px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[#E6002D] transition-all" />
              </div>
              {formError && <p className="text-[12px] text-[#FF3B30]">{formError}</p>}
              <button onClick={handleAdd} disabled={saving} className="w-full h-[44px] rounded-[10px] bg-[#E6002D] text-white text-[13.5px] font-semibold flex items-center justify-center gap-2 hover:bg-[#D40028] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {saving && <Loader2 size={15} className="animate-spin" />}
                {saving ? 'Đang lưu...' : 'Thêm khách'}
              </button>
            </div>
          </div>
        </div>
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