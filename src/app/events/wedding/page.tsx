'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, Circle, Users, Wallet, CalendarDays, Plus, X, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { weddingService, createBigEvent } from '@/lib/services/event-organization-service';
import { DateInput } from '@/components/ui/date-input';
import { formatVND, parseVND } from '@/lib/utils';

export default function WeddingDashboardPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [eventId, setEventId] = useState<string | null>(() => searchParams?.get('event') || null);
  const [resolving, setResolving] = useState(true);
  const [noWedding, setNoWedding] = useState(false);
  const [creating, setCreating] = useState(false);
  const [weddingDate, setWeddingDate] = useState(() => {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const d = String(t.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [createError, setCreateError] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [taskError, setTaskError] = useState('');
  // Form state — thêm công việc
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskParent, setTaskParent] = useState('');
  const [taskCost, setTaskCost] = useState('');
  const [taskCategory, setTaskCategory] = useState('Other');

  // Tự resolve event đám cưới khi không có ?event= — lấy event Party có wedding_details gần nhất
  useEffect(() => {
    if (eventId) { setResolving(false); return; }
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
            router.replace(`/events/wedding?event=${ev.EventID}`, { scroll: false });
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

  async function handleStartWedding() {
    if (!weddingDate) { setCreateError('Vui lòng chọn ngày sự kiện'); return; }
    setCreating(true); setCreateError('');
    try {
      const eventId = await createBigEvent({ title: 'Đám cưới của tôi', startDate: weddingDate, eventType: 'Party' });
      await weddingService.upsertDetails({ EventID: eventId, BudgetLimit: 0 });
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      router.replace(`/events/wedding?event=${eventId}`, { scroll: false });
      setEventId(eventId);
      setNoWedding(false);
    } catch (e: any) {
      alert('Không thể tạo đám cưới: ' + (e?.message || ''));
    } finally { setCreating(false); }
  }

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
  const taskBudget = tasks.reduce((s, t) => s + (t.EstimatedCost || 0), 0);
  const totalBudget = budgetLimit + taskBudget;
  const totalSpent = expenses.reduce((s, e) => s + (e.ActualCost || 0), 0);
  const budgetPct = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;
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
        ParentTaskID: taskParent || null,
        EstimatedCost: parseVND(taskCost),
        Category: taskCategory,
      });
      await queryClient.invalidateQueries({ queryKey: ['wedding-tasks', eventId] });
      setShowTaskModal(false);
      setTaskTitle(''); setTaskDue(''); setTaskDesc(''); setTaskParent(''); setTaskCost(''); setTaskCategory('Other');
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
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['wedding'] })}
            className="w-[38px] h-[38px] rounded-[10px] bg-white border border-[rgba(0,0,0,0.06)] flex items-center justify-center text-[#5F6368] hover:bg-[rgba(0,0,0,0.02)] transition-all shadow-sm shrink-0"
            title="Làm mới"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {resolving ? (
        <div className="glass-card p-10 text-center text-[13px] text-[#8E8E93]">Đang tải sự kiện đám cưới...</div>
      ) : noWedding || !eventId ? (
        <div className="glass-card p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-[rgba(230,0,45,0.08)] mx-auto mb-4 flex items-center justify-center">
            <Sparkles size={24} className="text-[#E6002D]" />
          </div>
          <h3 className="text-[17px] font-bold text-[#111] mb-1.5">Bắt đầu lên kế hoạch đám cưới</h3>
          <p className="text-[13px] text-[#8E8E93] max-w-sm mx-auto mb-5">
            Tạo sự kiện đám cưới để quản lý ngân sách, danh sách khách mời và checklist công việc.
            Sự kiện sẽ xuất hiện trong dòng thời gian chung của bạn.
          </p>
          <div className="max-w-[240px] mx-auto mb-4 text-left">
            <label className="block text-[12px] font-semibold text-[#5F6368] mb-1.5">Ngày sự kiện (dd/mm/yyyy) *</label>
            <DateInput
              value={weddingDate}
              onChange={setWeddingDate}
              className="w-full h-[42px] px-3 rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13.5px] text-[#111] outline-none focus:border-[#E6002D] transition-all text-center"
            />
          </div>
          {createError && <p className="text-[12px] text-[#FF3B30] mb-3">{createError}</p>}
          <button
            onClick={handleStartWedding}
            disabled={creating || !weddingDate}
            className="px-6 h-[44px] rounded-[10px] bg-[#E6002D] text-white text-[13.5px] font-semibold flex items-center justify-center gap-2 mx-auto hover:bg-[#D40028] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating && <Loader2 size={15} className="animate-spin" />}
            {creating ? 'Đang tạo...' : 'Bắt đầu đám cưới'}
          </button>
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
              <div className="text-[24px] font-bold text-[#111] mb-1">{totalBudget ? formatVND(totalBudget) : '0'} đ</div>
              <p className="text-[11px] text-[#8E8E93] mb-3">Đã chi {formatVND(totalSpent)} đ{taskBudget > 0 && <span className="text-[#34C759] font-semibold"> · {formatVND(taskBudget)} đ dự toán công việc</span>}</p>
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
                {(() => {
                  const childrenOf = (parentId: string) => tasks.filter(t => t.ParentTaskID === parentId);
                  const renderTask = (task: any, depth: number) => {
                    const kids = childrenOf(task.TaskID);
                    const kidsDone = kids.length > 0 && kids.every(k => k.Status === 'Done');
                    const done = task.Status === 'Done' || kidsDone;
                    return (
                      <div key={task.TaskID}>
                        <div
                          className={`flex items-center justify-between p-3 border border-[rgba(0,0,0,0.06)] rounded-[10px] hover:bg-[rgba(0,0,0,0.02)] transition-colors cursor-pointer ${depth > 0 ? 'ml-5' : ''} ${done ? 'bg-[rgba(52,199,89,0.04)]' : 'bg-white'}`}
                          onClick={() => {
                            // Việc cha có con thì không toggle trực tiếp — chỉ con mới toggle
                            if (kids.length === 0) toggleTask(task.TaskID!, task.Status || 'Pending');
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {kids.length > 0 ? (
                              done ? <CheckCircle2 size={18} className="text-[#34C759] shrink-0" /> : <Circle size={18} className="text-[#007AFF] shrink-0" />
                            ) : done ? (
                              <CheckCircle2 size={18} className="text-[#34C759] shrink-0" />
                            ) : (
                              <Circle size={18} className="text-[#8E8E93] shrink-0" />
                            )}
                            <span className={`text-[13px] truncate ${done ? 'line-through text-[#8E8E93]' : 'font-medium text-[#111]'}`}>
                              {task.Title}
                            </span>
                            {task.EstimatedCost ? (
                              <span className="text-[11px] font-semibold text-[#E6002D] shrink-0">{formatVND(task.EstimatedCost)} đ</span>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {kids.length > 0 && (
                              <span className="text-[10px] font-medium text-[#007AFF]">{kids.filter(k => k.Status === 'Done').length}/{kids.length}</span>
                            )}
                            <span className={`px-2.5 py-1 rounded-[6px] text-[10px] font-medium ${done ? 'bg-[rgba(0,0,0,0.06)] text-[#8E8E93]' : 'bg-[rgba(230,0,45,0.1)] text-[#E6002D]'}`}>
                              {task.DueDate ? new Date(task.DueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : 'Chưa hẹn'}
                            </span>
                          </div>
                        </div>
                        {kids.map(k => renderTask(k, depth + 1))}
                      </div>
                    );
                  };
                  return tasks.filter(t => !t.ParentTaskID).map(t => renderTask(t, 0));
                })()}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-[#5F6368] mb-1.5">Số tiền dự toán (VND)</label>
                  <input
                    value={taskCost}
                    onChange={e => setTaskCost(e.target.value)}
                    onBlur={e => {
                      const n = parseVND(e.target.value);
                      if (n > 0) setTaskCost(formatVND(n));
                    }}
                    inputMode="numeric"
                    placeholder="VD: 10.000.000"
                    className="w-full h-[42px] px-3.5 rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13.5px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[#E6002D] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#5F6368] mb-1.5">Hạng mục</label>
                  <select
                    value={taskCategory}
                    onChange={e => setTaskCategory(e.target.value)}
                    className="w-full h-[42px] px-3 rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13.5px] text-[#111] bg-white outline-none focus:border-[#E6002D] transition-all"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, v]) => (
                      <option key={key} value={key}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#5F6368] mb-1.5">Hạn chót (dd/mm/yyyy)</label>
                <DateInput
                  value={taskDue}
                  onChange={setTaskDue}
                  className="w-full h-[42px] px-3 rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13.5px] text-[#111] outline-none focus:border-[#E6002D] transition-all text-center"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#5F6368] mb-1.5">Là việc phụ của</label>
                <select
                  value={taskParent}
                  onChange={e => setTaskParent(e.target.value)}
                  className="w-full h-[42px] px-3 rounded-[10px] border border-[rgba(0,0,0,0.1)] text-[13.5px] text-[#111] bg-white outline-none focus:border-[#E6002D] transition-all"
                >
                  <option value="">— Việc lớn (không phải việc phụ) —</option>
                  {tasks.filter(t => !t.ParentTaskID).map(t => (
                    <option key={t.TaskID} value={t.TaskID}>{t.Title}</option>
                  ))}
                </select>
                <p className="text-[11px] text-[#9CA3AF] mt-1">Chọn việc cha để tạo việc phụ nhỏ bên trong việc lớn.</p>
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
