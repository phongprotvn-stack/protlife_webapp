'use client';

import React, { useMemo, useState } from 'react';
import { Receipt, Users, Calculator, Plus, UserPlus, X, Loader2, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { groupEventService } from '@/lib/services/event-organization-service';
import { contactService } from '@/lib/services/contact-service';
import { calculateSplitwise, type ExpenseDetail } from '@/lib/expense-calculator';
import { formatVND } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';

export default function GroupEventPage() {
  const params = useParams();
  const eventId = params?.id as string;
  const queryClient = useQueryClient();

  const [showMember, setShowMember] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  // Form — thêm thành viên (quỹ)
  const [memberContact, setMemberContact] = useState('');
  const [memberAmount, setMemberAmount] = useState('');
  const [memberPaid, setMemberPaid] = useState<boolean>(true);
  // Form — thêm chi tiêu
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePaidBy, setExpensePaidBy] = useState('');
  const [expenseInvolved, setExpenseInvolved] = useState<string[]>([]);

  // Event hiện tại
  const { data: event = null } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data } = await supabase.from('events').select('EventID, Title, StartDate, EndDate').eq('EventID', eventId).single();
      return data;
    },
    enabled: !!eventId,
  });

  // Danh bạ (để chọn người tham gia / người trả)
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: contactService.getAll,
    staleTime: 60_000,
  });
  const contactName = (id: string) => contacts.find(c => c.ContactID === id)?.Name || id;

  // Quỹ
  const { data: funds = [] } = useQuery({
    queryKey: ['group-funds', eventId],
    queryFn: () => groupEventService.getFunds(eventId),
    enabled: !!eventId,
  });

  // Chi tiêu
  const { data: expenses = [] } = useQuery({
    queryKey: ['group-expenses', eventId],
    queryFn: () => groupEventService.getExpenses(eventId),
    enabled: !!eventId,
  });

  // Splitwise
  const splits = useMemo(() => {
    if (expenses.length === 0) return [];
    const participants = Array.from(new Set([
      ...funds.map(f => f.ContactID),
      ...expenses.flatMap(e => [e.PaidByContactID, ...(e.InvolvedContactIDs || [])]),
    ]));
    if (participants.length === 0) return [];
    const details: ExpenseDetail[] = expenses.map(e => ({
      paidBy: e.PaidByContactID,
      amount: e.Amount,
      involvedParticipants: e.InvolvedContactIDs && e.InvolvedContactIDs.length > 0 ? e.InvolvedContactIDs : undefined,
    }));
    return calculateSplitwise(participants, details);
  }, [expenses, funds]);

  const totalFund = funds.reduce((s, f) => s + (f.HasPaid ? f.AmountPaid : 0), 0);
  const totalExpense = expenses.reduce((s, e) => s + e.Amount, 0);
  const paidCount = funds.filter(f => f.HasPaid).length;
  const balance = totalFund - totalExpense;
  const avgPerPerson = expenses.length > 0 && funds.length > 0 ? Math.round(totalExpense / funds.length) : 0;

  async function handleAddMember() {
    setSaving(true); setFormError('');
    try {
      await groupEventService.upsertFund({
        EventID: eventId,
        ContactID: memberContact,
        HasPaid: memberPaid,
        AmountPaid: memberPaid ? (Number(memberAmount.replace(/\./g, '').replace(',', '.')) || 0) : 0,
      });
      await queryClient.invalidateQueries({ queryKey: ['group-funds', eventId] });
      setShowMember(false); setMemberContact(''); setMemberAmount(''); setMemberPaid(true);
    } catch (e: any) {
      setFormError(e?.message || 'Không thể thêm thành viên');
    } finally { setSaving(false); }
  }

  async function handleAddExpense() {
    setSaving(true); setFormError('');
    try {
      await groupEventService.addExpense({
        EventID: eventId,
        PaidByContactID: expensePaidBy,
        Amount: Number(expenseAmount.replace(/\./g, '').replace(',', '.')) || 0,
        Description: expenseDesc.trim() || undefined,
        InvolvedContactIDs: expenseInvolved.length > 0 ? expenseInvolved : undefined,
        CreatedDate: new Date().toISOString(),
      });
      await queryClient.invalidateQueries({ queryKey: ['group-expenses', eventId] });
      setShowExpense(false); setExpenseDesc(''); setExpenseAmount(''); setExpensePaidBy(''); setExpenseInvolved([]);
    } catch (e: any) {
      setFormError(e?.message || 'Không thể thêm chi tiêu');
    } finally { setSaving(false); }
  }

  async function handleDeleteExpense(id: string) {
    try {
      await groupEventService.deleteExpense(id);
      await queryClient.invalidateQueries({ queryKey: ['group-expenses', eventId] });
      setConfirmDel(null);
    } catch { setConfirmDel(null); }
  }

  const availableContacts = contacts.filter(c => !funds.some(f => f.ContactID === c.ContactID));
  const memberOptions = (availableContacts.length > 0 ? availableContacts : contacts).filter(c => c.Status !== 'Blocked');

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="page-content min-h-[80vh]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Link href="/events">
            <button className="w-8 h-8 rounded-full bg-[rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-[rgba(0,0,0,0.08)] transition-colors shrink-0">
              <ArrowLeft size={18} className="text-[#5F6368]" />
            </button>
          </Link>
          <div>
            <h2 className="text-[22px] font-bold text-[#111] tracking-tight">{event?.Title || 'Sự kiện nhóm'}</h2>
            <p className="text-[12px] text-[#8E8E93] mt-0.5">
              {event?.StartDate ? `${new Date(event.StartDate + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}` : ''}
              {event?.EndDate ? ` — ${new Date(event.EndDate + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}` : ''}
            </p>
          </div>
        </div>
        <div className="flex w-full sm:w-auto space-x-2">
          <button
            onClick={() => setShowMember(true)}
            className="flex-1 sm:flex-none px-4 py-2 bg-white border border-[rgba(0,0,0,0.06)] rounded-[10px] text-[12px] font-semibold text-[#5F6368] flex items-center justify-center gap-1.5 hover:bg-[rgba(0,0,0,0.02)] transition-all shadow-sm"
          >
            <UserPlus size={16} /> Thêm thành viên
          </button>
          <button
            onClick={() => setShowExpense(true)}
            className="flex-1 sm:flex-none px-4 py-2 bg-[#E6002D] rounded-[10px] text-[12px] font-semibold text-white flex items-center justify-center gap-1.5 hover:bg-[#D40028] transition-all shadow-sm"
          >
            <Plus size={16} strokeWidth={2.5} /> Thêm chi tiêu
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="glass-card p-5 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[rgba(52,199,89,0.05)] rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-[#5F6368]">Tổng Quỹ Thu Được</span>
            <Users size={16} className="text-[#34C759]" />
          </div>
          <div className="text-[24px] font-bold text-[#111] mb-1">{formatVND(totalFund)} đ</div>
          <p className="text-[11px] text-[#8E8E93]">{paidCount}/{funds.length} người đã đóng</p>
        </div>

        <div className="glass-card p-5 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[rgba(255,59,48,0.05)] rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-[#5F6368]">Tổng Chi Tiêu</span>
            <Receipt size={16} className="text-[#FF3B30]" />
          </div>
          <div className="text-[24px] font-bold text-[#111] mb-1">{formatVND(totalExpense)} đ</div>
          <p className="text-[11px] text-[#8E8E93]">{funds.length > 0 ? `Bình quân: ${formatVND(avgPerPerson)} đ / người` : ''}</p>
        </div>

        <div className={`glass-card p-5 relative overflow-hidden group hover:shadow-lg transition-all ${balance < 0 ? 'bg-[rgba(230,0,45,0.02)] border-[#E6002D]/10' : ''}`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-[rgba(230,0,45,0.05)] rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-[#5F6368]">Trạng thái quỹ</span>
            <Calculator size={16} className="text-[#E6002D]" />
          </div>
          <div className={`text-[24px] font-bold mb-1 ${balance < 0 ? 'text-[#E6002D]' : 'text-[#34C759]'}`}>
            {balance < 0 ? '- ' : ''}{formatVND(Math.abs(balance))} đ
          </div>
          <p className="text-[11px] text-[#8E8E93]">{balance < 0 ? 'Quỹ đang âm, cần thu thêm' : 'Quỹ cân bằng hoặc thừa'}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Lịch sử chi tiêu */}
        <div className="glass-card p-0 md:col-span-2 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[rgba(0,0,0,0.04)] bg-white/50 flex justify-between items-center">
            <div>
              <h3 className="text-[16px] font-bold text-[#111]">Lịch sử chi tiêu</h3>
              <p className="text-[11px] text-[#8E8E93] mt-0.5">{expenses.length} khoản chi</p>
            </div>
          </div>
          <div className="p-2 space-y-1 bg-[rgba(0,0,0,0.01)] flex-1">
            {expenses.length === 0 && (
              <div className="text-center py-10 text-[12.5px] text-[#8E8E93]">Chưa có khoản chi nào — hãy thêm chi tiêu đầu tiên.</div>
            )}
            {expenses.map((expense) => (
              <div key={expense.ExpenseID} className="group flex justify-between items-center p-4 bg-white rounded-[10px] border border-[rgba(0,0,0,0.03)] hover:shadow-sm transition-all">
                <div className="min-w-0">
                  <p className="font-semibold text-[#111] text-[14px] truncate">{expense.Description || 'Khoản chi'}</p>
                  <p className="text-[11px] text-[#8E8E93] mt-1">
                    Người trả: <span className="font-medium text-[#5F6368]">{expense.contacts?.Name || contactName(expense.PaidByContactID)}</span>
                    {expense.CreatedDate ? ` • ${new Date(expense.CreatedDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="font-bold text-[15px] text-[#FF3B30]">- {formatVND(expense.Amount)} đ</div>
                  <button onClick={() => setConfirmDel(expense.ExpenseID!)} className="w-7 h-7 rounded-full flex items-center justify-center text-[#9CA3AF] opacity-0 group-hover:opacity-100 hover:text-[#FF3B30] transition-all" title="Xoá khoản chi">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quyết toán Splitwise */}
        <div className="glass-card p-0 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[rgba(0,0,0,0.04)] bg-white/50">
            <h3 className="text-[16px] font-bold text-[#111]">Bảng Kê Quyết Toán</h3>
            <p className="text-[11px] text-[#8E8E93] mt-1">Hệ thống tối ưu số lần chuyển khoản.</p>
          </div>
          <div className="p-4 bg-[rgba(230,0,45,0.02)] flex-1 flex flex-col">
            <div className="space-y-3 flex-1">
              {splits.length === 0 && (
                <div className="text-center py-10 text-[12.5px] text-[#8E8E93]">Chưa đủ dữ liệu để quyết toán.</div>
              )}
              {splits.map((split, i) => (
                <div key={i} className="p-3 bg-white border border-[rgba(230,0,45,0.08)] rounded-[10px] shadow-sm">
                  <div className="flex items-center justify-between mb-1 text-[12px]">
                    <span className="font-bold text-[#111] truncate">{contactName(split.from)}</span>
                    <span className="text-[#8E8E93] px-1 shrink-0">cần trả cho</span>
                    <span className="font-bold text-[#E6002D] truncate">{contactName(split.to)}</span>
                  </div>
                  <div className="text-center font-black text-[18px] text-[#111]">
                    {formatVND(split.amount)} đ
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2.5 bg-[#111] text-white rounded-[10px] text-[12px] font-semibold hover:bg-black transition-all shadow-md">
              Sao chép tin nhắn nhóm
            </button>
          </div>
        </div>
      </div>

      {/* Modal — Thêm thành viên */}
      {showMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowMember(false)}>
          <div className="w-full max-w-md bg-white rounded-[16px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[17px] font-bold text-[#111]">Thêm thành viên</h3>
              <button onClick={() => setShowMember(false)} className="w-8 h-8 rounded-full bg-[rgba(0,0,0,0.05)] flex items-center justify-center hover:bg-[rgba(0,0,0,0.1)] transition-colors">
                <X size={16} className="text-[#5F6368]" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#5F6368] mb-1.5">Người trong danh bạ *</label>
                <select value={memberContact} onChange={e => setMemberContact(e.target.value)} className="w-full h-[42px] px-3 rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13.5px] text-[#111] bg-white outline-none focus:border-[#E6002D] transition-all">
                  <option value="">Chọn người...</option>
                  {memberOptions.map(c => <option key={c.ContactID} value={c.ContactID}>{c.Name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#5F6368] mb-1.5">Số tiền đã đóng (VND)</label>
                <input value={memberAmount} onChange={e => setMemberAmount(e.target.value)} placeholder="VD: 500000" inputMode="numeric" className="w-full h-[42px] px-3.5 rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13.5px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[#E6002D] transition-all" />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={memberPaid} onChange={e => setMemberPaid(e.target.checked)} className="w-4 h-4 accent-[#E6002D]" />
                <span className="text-[13px] text-[#111]">Đã đóng quỹ</span>
              </label>
              {formError && <p className="text-[12px] text-[#FF3B30]">{formError}</p>}
              <button onClick={handleAddMember} disabled={saving || !memberContact} className="w-full h-[44px] rounded-[10px] bg-[#E6002D] text-white text-[13.5px] font-semibold flex items-center justify-center gap-2 hover:bg-[#D40028] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {saving && <Loader2 size={15} className="animate-spin" />}
                {saving ? 'Đang lưu...' : 'Thêm thành viên'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Thêm chi tiêu */}
      {showExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowExpense(false)}>
          <div className="w-full max-w-md bg-white rounded-[16px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[17px] font-bold text-[#111]">Thêm chi tiêu</h3>
              <button onClick={() => setShowExpense(false)} className="w-8 h-8 rounded-full bg-[rgba(0,0,0,0.05)] flex items-center justify-center hover:bg-[rgba(0,0,0,0.1)] transition-colors">
                <X size={16} className="text-[#5F6368]" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#5F6368] mb-1.5">Mô tả *</label>
                <input value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} placeholder="VD: Tiền taxi sân bay" autoFocus className="w-full h-[42px] px-3.5 rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13.5px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[#E6002D] transition-all" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#5F6368] mb-1.5">Số tiền (VND) *</label>
                <input value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} placeholder="VD: 350000" inputMode="numeric" className="w-full h-[42px] px-3.5 rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13.5px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[#E6002D] transition-all" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#5F6368] mb-1.5">Người trả *</label>
                <select value={expensePaidBy} onChange={e => setExpensePaidBy(e.target.value)} className="w-full h-[42px] px-3 rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13.5px] text-[#111] bg-white outline-none focus:border-[#E6002D] transition-all">
                  <option value="">Chọn người trả...</option>
                  {funds.map(f => (
                    <option key={f.ContactID} value={f.ContactID}>{f.contacts?.Name || contactName(f.ContactID)}</option>
                  ))}
                </select>
                {funds.length === 0 && <p className="text-[11.5px] text-[#FF9500] mt-1">Cần thêm thành viên (đóng quỹ) trước khi ghi chi tiêu.</p>}
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#5F6368] mb-1.5">Chia cho (mọi người nếu bỏ trống)</label>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto border border-[rgba(0,0,0,0.08)] rounded-[10px] p-2.5">
                  {funds.map(f => {
                    const id = f.ContactID;
                    const checked = expenseInvolved.includes(id);
                    return (
                      <label key={id} className="flex items-center gap-2.5 cursor-pointer px-1 py-1 rounded-[6px] hover:bg-[rgba(0,0,0,0.03)]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => setExpenseInvolved(prev => e.target.checked ? [...prev, id] : prev.filter(x => x !== id))}
                          className="w-4 h-4 accent-[#E6002D]"
                        />
                        <span className="text-[13px] text-[#111]">{f.contacts?.Name || contactName(f.ContactID)}</span>
                      </label>
                    );
                  })}
                  {funds.length === 0 && <div className="text-[12px] text-[#8E8E93] px-1 py-1">Chưa có thành viên.</div>}
                </div>
              </div>
              {formError && <p className="text-[12px] text-[#FF3B30]">{formError}</p>}
              <button onClick={handleAddExpense} disabled={saving || !expenseDesc.trim() || !expenseAmount || !expensePaidBy} className="w-full h-[44px] rounded-[10px] bg-[#E6002D] text-white text-[13.5px] font-semibold flex items-center justify-center gap-2 hover:bg-[#D40028] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {saving && <Loader2 size={15} className="animate-spin" />}
                {saving ? 'Đang lưu...' : 'Thêm chi tiêu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Xác nhận xoá chi tiêu */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDel(null)}>
          <div className="w-full max-w-sm bg-white rounded-[16px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-[17px] font-bold text-[#111] mb-2">Xoá khoản chi</h3>
            <p className="text-[13px] text-[#5F6368] mb-5">Bạn có chắc muốn xoá khoản chi này? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDel(null)} className="flex-1 h-[42px] rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13px] font-semibold text-[#5F6368] hover:bg-[rgba(0,0,0,0.02)] transition-all">Huỷ</button>
              <button onClick={() => handleDeleteExpense(confirmDel)} className="flex-1 h-[42px] rounded-[10px] bg-[#FF3B30] text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#E5352B] transition-all">
                <Trash2 size={14} /> Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}