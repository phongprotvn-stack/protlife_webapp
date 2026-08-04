'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Users, Wallet, CalendarDays, Plus, X, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query';
import EventPicker from '@/components/events/event-picker';
import { weddingService, getPartyEvents } from '@/lib/services/event-organization-service';
import { formatVND } from '@/lib/utils';

export default function WeddingDashboardPage() {
  const queryClient = useQueryClient();
  const [eventId, setEventId] = useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [taskError, setTaskError] = useState('');
  // Form state — thêm công việc
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskDesc, setTaskDesc] = useState('');

  // Danh sách event cho picker (ưu tiên tên "cưới"/wedding + sắp tới)
  const { data: pickerEvents = [], isLoading: pickerLoading } = useQuery({
    queryKey: ['party-events'],
    queryFn: getPartyEvents,
    staleTime: 60_000,
  });

  // Event hiện tại (lấy từ events để hiện tên/ngày)
  const { data: event = null } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const { data } = await supabase.from('events').select('EventID, Title, StartDate').eq('EventID', eventId).single();
      return data;
    },
    enabled: !!eventId,
  });

  // Details (ngân sách, cô dâu/chú rể)
  const { data: details = null, isLoading: detailsLoading } = useQuery({
    queryKey: ['wedding-details', eventId],
    queryFn: () => weddingService.getDetails(eventId!),
    enabled: !!eventId,
  });

  // Tasks (checklist)
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['wedding-tasks', eventId],
    queryFn: () => weddingService.getTasks(eventId!),
    enabled: !!eventId,
  });

  // Expenses (ngân sách đã chi + tiến độ hạng mục)
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['wedding-expenses', eventId],
    queryFn: () => weddingService.getExpenses(eventId!),
    enabled: !!eventId,
  });

  // Guests (đếm số lượng)
  const { data: guests = [] } = useQuery({
    queryKey: ['wedding-guests', eventId],
    queryFn: () => weddingService.getGuests(eventId!),
    enabled: !!eventId,
  });

  const budgetLimit = details?.BudgetLimit ?? 0;
  const totalSpent = expenses.reduce((s, e) => s + (e.ActualCost || 0), 0);
  const budgetPct = budgetLimit > 0 ? Math.min(100, Math.round((totalSpent / budgetLimit) * 100)) : 0;
  const doneCount = tasks.filter(t => t.Status === 'Done').length;
  const confirmedGuests = guests.filter(g => g.AttendanceStatus === 'Attending' || g.AttendanceStatus === 'Confirmed').length;

  // Tiến độ hạng mục — gộp chi tiêu theo category
  const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
    Apparel: { label: 'Trang phục & Makeup', color: '#AF52DE' },
    Photography: { label: 'Chụp ảnh & Quay phim', color: '#007AFF' },
    Food: { label: 'Cỗ bàn & Ẩm thực', color: '#FF9500' },
    Venue: { label: 'Địa điểm', color: '#34C759' },
    Decoration: { label: 'Trang trí', color: '#E6002D' },
    Transport: { label: 'Di chuyển', color: '#5AC8FA' },
    Other: { label: 'Khác', color: '#8E8E93' },
  };
  const categoryStats = useMemo(() => {
    const map: Record<string, { spent: number; est: number }> = {};
    expenses.forEach(e => {
      const c = e.Category || 'Other';
      if (!map[c]) map[c] = { spent: 0, est: 0 };
      map[c].spent += e.ActualCost || 0;
      map[c].est += e.EstimatedCost || 0;
    });
    return Object.entries(map).map(([cat, v]) => ({
      cat,
      label: CATEGORY_LABELS[cat]?.label || cat,
      color: CATEGORY_LABELS[cat]?.color || '#8E8E93',
      pct: v.est > 0 ? Math.min(100, Math.round((v.spent / v.est) * 100)) : (v.spent > 0 ? 100 : 0),
    }));
  }, [expenses]);

  async function handleAddTask() {
    if (!eventId || !taskTitle.trim()) return;
    setSaving(true);
    setTaskError('');
    try {
      await weddingService.addTask({
        EventID: eventId,
        Title: taskTitle.trim(),
        Description: taskDesc.trim() || null,
        Status: 'Pending',
        DueDate: taskDue ? new Date(taskDue + 'T00:00:00').toISOString() : null,
      });
      await queryClient.invalidateQueries({ queryKey: ['wedding-tasks', eventId] });
      setShowTaskModal(false);
      setTaskTitle(''); setTaskDue(''); setTaskDesc('');
    } catch (e: any) {
      setTaskError(e?.message || 'Không thể thêm công việc');
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(taskId: string, current: string) {
    if (!eventId) return;
    const next = current === 'Done' ? 'Pending' : 'Done';
    try {
      await weddingService.updateTask(taskId, { Status: next as any });
      await queryClient.invalidateQueries({ queryKey: ['wedding-tasks', eventId] });
    } catch { /* ignore */ }
  }

  const dayCount = useMemo(() => {
    if (!event?.StartDate) return null;
    const target = new Date(event.StartDate + 'T00:00:00');
    const diff = Math.ceil((target.getTime() - Date.now()) / 86400000);
    return diff;
  }, [event?.StartDate]);

  return (
    <div className="page-content min-h-[80vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-[22px] font-bold text-[#111] tracking-tight">{event?.Title || 'Đám cưới của tôi'}</h2>
          <p className="text-[12px] text-[#8E8E93] mt-0.5">Tổng quan sự kiện</p>
        </div>
        <div className="flex items-center gap-2">
          <EventPicker value={eventId} onChange={setEventId} events={pickerEvents} loading={pickerLoading} />
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['wedding'] })}
            className="w-[38px] h-[38px] rounded-[10px] bg-white border border-[rgba(0,0,0,0.06)] flex items-center justify-center text-[#5F6368] hover:bg-[rgba(0,0,0,0.02)] transition-all shadow-sm shrink-0"
            title="Làm mới"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {!eventId ? (
        <div className="glass-card p-10 text-center text-[13px] text-[#8E8E93]">
          {pickerLoading ? 'Đang tải danh sách sự kiện...' : 'Chưa có sự kiện Party/Đám cưới. Hãy tạo sự kiện trước.'}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            {/* Ngân sách */}
            <div className="glass-card p-5 relative overflow-hidden group hover:shadow-lg transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[rgba(230,0,45,0.05)] rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-semibold text-[#5F6368]">Ngân sách dự kiến</span>
                <Wallet size={16} className="text-[#E6002D]" />
              </div>
              <div className="text-[24px] font-bold text-[#111] mb-1">{budgetLimit ? formatVND(budgetLimit) : '0'} đ</div>
              <p className="text-[11px] text-[#8E8E93] mb-3">Đã chi {formatVND(totalSpent)} đ</p>
              <div className="w-full bg-[rgba(0,0,0,0.06)] rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#E6002D] h-1.5 rounded-full transition-all" style={{ width: `${budgetPct}%` }}></div>
              </div>
            </div>

            {/* Khách mời */}
            <div className="glass-card p-5 relative overflow-hidden group hover:shadow-lg transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[rgba(0,122,255,0.05)] rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-semibold text-[#5F6368]">Khách mời (Đã chốt)</span>
                <Users size={16} className="text-[#007AFF]" />
              </div>
              <div className="text-[24px] font-bold text-[#111] mb-1">{confirmedGuests} <span className="text-[16px] text-[#8E8E93] font-normal">/ {guests.length}</span></div>
              <p className="text-[11px] text-[#8E8E93] mb-3">Tổng cộng {guests.length} khách trong danh sách</p>
              <Link href="/events/wedding/guests">
                <button className="w-full py-1.5 border border-[rgba(0,0,0,0.1)] rounded-[8px] text-[12px] font-medium hover:bg-[rgba(0,0,0,0.02)] transition-all">
                  Quản lý khách mời
                </button>
              </Link>
            </div>

            {/* Thời gian */}
            <div className="glass-card p-5 relative overflow-hidden group hover:shadow-lg transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[rgba(52,199,89,0.05)] rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-semibold text-[#5F6368]">Thời gian còn lại</span>
                <CalendarDays size={16} className="text-[#34C759]" />
              </div>
              <div className="text-[24px] font-bold text-[#111] mb-1">
                {dayCount === null ? '—' : dayCount >= 0 ? `${dayCount} ngày` : `Đã qua ${Math.abs(dayCount)} ngày`}
              </div>
              <p className="text-[11px] text-[#8E8E93]">
                {event?.StartDate ? new Date(event.StartDate + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-7">
            {/* Công việc cần làm */}
            <div className="glass-card p-6 md:col-span-4">
              <div className="mb-4">
                <h3 className="text-[16px] font-bold text-[#111]">Công việc cần làm</h3>
                <p className="text-[12px] text-[#8E8E93]">
                  {tasksLoading ? 'Đang tải...' : `${tasks.length} công việc — đã hoàn thành ${doneCount}`}
                </p>
              </div>
              <div className="space-y-3">
                {tasks.map(task => {
                  const done = task.Status === 'Done';
                  return (
                    <div key={task.TaskID} className="flex items-center justify-between p-3 border border-[rgba(0,0,0,0.06)] rounded-[10px] hover:bg-[rgba(0,0,0,0.02)] transition-colors cursor-pointer" onClick={() => toggleTask(task.TaskID!, task.Status || 'Pending')}>
                      <div className="flex items-center gap-3 min-w-0">
                        {done ? (
                          <CheckCircle2 size={18} className="text-[#34C759] shrink-0" />
                        ) : (
                          <Circle size={18} className="text-[#8E8E93] shrink-0" />
                        )}
                        <span className={`text-[13px] truncate ${done ? 'line-through text-[#8E8E93]' : 'font-medium text-[#111]'}`}>
                          {task.Title}
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-[6px] text-[10px] font-medium shrink-0 ml-2 ${done ? 'bg-[rgba(0,0,0,0.06)] text-[#8E8E93]' : 'bg-[rgba(230,0,45,0.1)] text-[#E6002D]'}`}>
                        {task.DueDate ? new Date(task.DueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : 'Chưa hẹn'}
                      </span>
                    </div>
                  );
                })}
                {!tasksLoading && tasks.length === 0 && (
                  <div className="text-center py-6 text-[12.5px] text-[#8E8E93]">Chưa có công việc nào — hãy thêm công việc đầu tiên.</div>
                )}
              </div>
              <button
                onClick={() => setShowTaskModal(true)}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 border border-dashed border-[rgba(0,0,0,0.2)] rounded-[10px] text-[13px] font-medium text-[#5F6368] hover:bg-[rgba(0,0,0,0.02)] transition-all"
              >
                <Plus size={16} /> Thêm công việc
              </button>
            </div>

            {/* Tiến độ hạng mục */}
            <div className="glass-card p-6 md:col-span-3">
              <div className="mb-4">
                <h3 className="text-[16px] font-bold text-[#111]">Tiến độ hạng mục</h3>
                <p className="text-[12px] text-[#8E8E93]">Tỉ lệ chi so với dự trù từng hạng mục</p>
              </div>
              <div className="space-y-5">
                {categoryStats.length === 0 && !expensesLoading && (
                  <div className="text-center py-6 text-[12.5px] text-[#8E8E93]">Chưa có hạng mục chi tiêu.</div>
                )}
                {categoryStats.map(stat => (
                  <div key={stat.cat} className="space-y-2">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-[#5F6368] font-medium">{stat.label}</span>
                      <span className="font-bold text-[#111]">{stat.pct}%</span>
                    </div>
                    <div className="w-full bg-[rgba(0,0,0,0.06)] rounded-full h-1.5 overflow-hidden">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${stat.pct}%`, backgroundColor: stat.color }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal — Thêm công việc */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowTaskModal(false)}>
          <div className="w-full max-w-md bg-white rounded-[16px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[17px] font-bold text-[#111]">Thêm công việc</h3>
              <button onClick={() => setShowTaskModal(false)} className="w-8 h-8 rounded-full bg-[rgba(0,0,0,0.05)] flex items-center justify-center hover:bg-[rgba(0,0,0,0.1)] transition-colors">
                <X size={16} className="text-[#5F6368]" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#5F6368] mb-1.5">Tên công việc *</label>
                <input
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="VD: Chốt thực đơn nhà hàng"
                  className="w-full h-[42px] px-3.5 rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13.5px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[#E6002D] transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#5F6368] mb-1.5">Hạn chót</label>
                <input
                  type="date"
                  value={taskDue}
                  onChange={e => setTaskDue(e.target.value)}
                  className="w-full h-[42px] px-3.5 rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13.5px] text-[#111] outline-none focus:border-[#E6002D] transition-all"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#5F6368] mb-1.5">Ghi chú</label>
                <textarea
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  rows={3}
                  placeholder="Mô tả chi tiết công việc (tuỳ chọn)"
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13.5px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[#E6002D] transition-all resize-none"
                />
              </div>
              {taskError && <p className="text-[12px] text-[#FF3B30]">{taskError}</p>}
              <button
                onClick={handleAddTask}
                disabled={saving || !taskTitle.trim()}
                className="w-full h-[44px] rounded-[10px] bg-[#E6002D] text-white text-[13.5px] font-semibold flex items-center justify-center gap-2 hover:bg-[#D40028] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                {saving ? 'Đang lưu...' : 'Thêm công việc'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
