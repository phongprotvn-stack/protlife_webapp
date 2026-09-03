'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Heart,
  ListChecks,
  Loader2,
  Plus,
  ReceiptText,
  RefreshCw,
  Sparkles,
  UserRoundCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createBigEvent,
  initWeddingBlueprint,
  type WeddingSubEvent,
  type WeddingTask,
  weddingService,
} from '@/lib/services/event-organization-service';
import { DateInput } from '@/components/ui/date-input';
import { formatVND, parseVND } from '@/lib/utils';

type TimelineFilter = 'all' | 'long' | 'mid' | 'near' | 'week' | 'day';

interface WeddingEvent {
  EventID: string;
  Title: string;
  StartDate: string;
}

const TIMELINE_FILTERS: { id: TimelineFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'long', label: 'Trước 6–9 tháng' },
  { id: 'mid', label: 'Trước 3–5 tháng' },
  { id: 'near', label: 'Trước 1–2 tháng' },
  { id: 'week', label: 'Tuần cưới' },
  { id: 'day', label: 'Ngày cưới' },
];

const SUB_EVENTS: { id: WeddingSubEvent; label: string; detail: string }[] = [
  { id: 'engagement-visit', label: 'Lễ Dạm ngõ', detail: 'Gặp gỡ, thưa chuyện hai gia đình' },
  { id: 'engagement-ceremony', label: 'Lễ Ăn hỏi', detail: 'Tráp lễ, đội bê tráp và nghi thức' },
  { id: 'wedding-reception', label: 'Tiệc cưới chính', detail: 'Rước dâu và đãi tiệc' },
];

const GUEST_SCALES = [
  { id: 'small', label: '< 150 khách', detail: '~15 bàn' },
  { id: 'medium', label: '150–300 khách', detail: '20–30 bàn' },
  { id: 'large', label: '> 300 khách', detail: '35+ bàn' },
] as const;

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  Apparel: { label: 'Trang phục & Makeup', color: '#AF52DE' },
  Photography: { label: 'Chụp ảnh & Quay phim', color: '#007AFF' },
  Food: { label: 'Ẩm thực', color: '#FF9500' },
  Venue: { label: 'Sảnh tiệc', color: '#34C759' },
  Decoration: { label: 'Trang trí', color: '#E6002D' },
  Transport: { label: 'Xe hoa & Di chuyển', color: '#5AC8FA' },
  Other: { label: 'Khác & Dự phòng', color: '#8E8E93' },
};

const BUDGET_GROUPS = [
  { id: 'venue-food', label: 'Ẩm thực & Sảnh', categories: ['Food', 'Venue'], color: '#E6002D' },
  { id: 'photo', label: 'Chụp ảnh / Phim', categories: ['Photography'], color: '#007AFF' },
  { id: 'apparel', label: 'Trang phục / Makeup', categories: ['Apparel'], color: '#AF52DE' },
  { id: 'decor', label: 'Trang trí', categories: ['Decoration'], color: '#FF9500' },
  { id: 'transport', label: 'Xe hoa', categories: ['Transport'], color: '#5AC8FA' },
  { id: 'other', label: 'Dự phòng', categories: ['Other'], color: '#8E8E93' },
];

function todayAsIsoDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function differenceInCalendarDays(fromDate: Date, toDate: Date) {
  const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const to = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

function getTaskTimeline(task: WeddingTask, weddingDate?: string): TimelineFilter {
  if (!task.DueDate || !weddingDate) return 'all';
  const daysUntilWedding = differenceInCalendarDays(new Date(task.DueDate), new Date(`${weddingDate}T12:00:00`));
  if (daysUntilWedding >= 180) return 'long';
  if (daysUntilWedding >= 75) return 'mid';
  if (daysUntilWedding >= 14) return 'near';
  if (daysUntilWedding >= 1) return 'week';
  return 'day';
}

function formatDateInVietnamese(value?: string) {
  if (!value) return 'Chưa chọn ngày';
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}

export default function WeddingDashboardPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEventId = searchParams?.get('event') || null;
  const [eventId, setEventId] = useState<string | null>(initialEventId);
  const [resolving, setResolving] = useState(() => !initialEventId);
  const [noWedding, setNoWedding] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [brideName, setBrideName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [weddingDate, setWeddingDate] = useState(todayAsIsoDate);
  const [subEvents, setSubEvents] = useState<WeddingSubEvent[]>(SUB_EVENTS.map(item => item.id));
  const [guestScale, setGuestScale] = useState<(typeof GUEST_SCALES)[number]['id']>('medium');
  const [budgetInput, setBudgetInput] = useState('');
  const [timeline, setTimeline] = useState<TimelineFilter>('all');
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Keep the page behind a modal/sheet from scrolling (especially on iOS Safari).
  // The dialog panel owns scrolling; restore the previous body style on close.
  useEffect(() => {
    const modalOpen = wizardOpen || showTaskModal;
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [wizardOpen, showTaskModal]);
  const [savingTask, setSavingTask] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskCategory, setTaskCategory] = useState('Other');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (eventId) return;
    let cancelled = false;
    (async () => {
      try {
        const { supabase } = await import('@/lib/supabase/client');
        const { data: details } = await supabase
          .from('wedding_details')
          .select('EventID')
          .order('CreatedDate', { ascending: false })
          .limit(1);
        if (cancelled) return;
        if (details?.[0]?.EventID) {
          setEventId(details[0].EventID);
          router.replace(`/events/wedding?event=${details[0].EventID}`, { scroll: false });
          return;
        }
        setNoWedding(true);
      } catch {
        if (!cancelled) {
          setNoWedding(true);
        }
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();
    return () => { cancelled = true; };
  }, [eventId, router]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: event = null } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async (): Promise<WeddingEvent | null> => {
      const { supabase } = await import('@/lib/supabase/client');
      const { data, error } = await supabase
        .from('events')
        .select('EventID, Title, StartDate')
        .eq('EventID', eventId!)
        .maybeSingle();
      if (error) throw error;
      return data as WeddingEvent | null;
    },
    enabled: !!eventId,
  });
  const { data: details = null } = useQuery({
    queryKey: ['wedding-details', eventId], queryFn: () => weddingService.getDetails(eventId!), enabled: !!eventId,
  });
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['wedding-tasks', eventId], queryFn: () => weddingService.getTasks(eventId!), enabled: !!eventId,
  });
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['wedding-expenses', eventId], queryFn: () => weddingService.getExpenses(eventId!), enabled: !!eventId,
  });
  const { data: guests = [] } = useQuery({
    queryKey: ['wedding-guests', eventId], queryFn: () => weddingService.getGuests(eventId!), enabled: !!eventId,
  });
  const { data: tables = [] } = useQuery({
    queryKey: ['wedding-tables', eventId], queryFn: () => weddingService.getTables(eventId!), enabled: !!eventId,
  });

  const totalProjected = expenses.reduce((sum, item) => sum + (item.EstimatedCost || 0), 0);
  const budgetLimit = details?.BudgetLimit || totalProjected;
  const paidAmount = expenses.reduce((sum, item) => sum + (item.ActualCost || 0), 0);
  const budgetPercent = budgetLimit > 0 ? Math.round((paidAmount / budgetLimit) * 100) : 0;
  const isOverBudget = budgetLimit > 0 && paidAmount > budgetLimit;
  const doneCount = tasks.filter(task => task.Status === 'Done').length;
  const taskProgress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;
  const confirmedGuests = guests.filter(guest =>
    guest.AttendanceStatus === 'Attended' || guest.InvitationStatus === 'Accepted' || guest.InvitationStatus === 'Confirmed',
  ).length;
  const seatedGuests = guests.filter(guest => Boolean(guest.TableNumber)).length;
  const occupiedTables = tables.filter(table => guests.some(guest => guest.TableNumber === table.TableName)).length;

  const budgetGroups = useMemo(() => BUDGET_GROUPS.map(group => {
    const items = expenses.filter(expense => group.categories.includes(expense.Category));
    const estimated = items.reduce((sum, item) => sum + (item.EstimatedCost || 0), 0);
    const actual = items.reduce((sum, item) => sum + (item.ActualCost || 0), 0);
    return { ...group, estimated, actual, percent: estimated > 0 ? Math.min(100, Math.round((actual / estimated) * 100)) : 0 };
  }), [expenses]);
  const countdown = event?.StartDate
    ? differenceInCalendarDays(now, new Date(`${event.StartDate}T12:00:00`))
    : null;
  const filteredTasks = useMemo(() => tasks.filter(task =>
    timeline === 'all' || getTaskTimeline(task, event?.StartDate) === timeline,
  ), [event?.StartDate, tasks, timeline]);
  const urgentCount = tasks.filter(task => task.Status !== 'Done' && ['week', 'day'].includes(getTaskTimeline(task, event?.StartDate))).length;

  function openWizard() {
    setCreateError('');
    setWizardStep(1);
    setWizardOpen(true);
  }

  function toggleSubEvent(subEvent: WeddingSubEvent) {
    setSubEvents(current => current.includes(subEvent)
      ? current.filter(item => item !== subEvent)
      : [...current, subEvent]);
  }

  function validateWizardStep(step: number) {
    if (step === 1) {
      if (!brideName.trim() || !groomName.trim()) return 'Vui lòng nhập tên cô dâu và chú rể.';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(weddingDate) || Number.isNaN(new Date(`${weddingDate}T12:00:00`).getTime())) return 'Vui lòng nhập ngày cưới theo định dạng dd/mm/yyyy.';
    }
    if (step === 2 && parseVND(budgetInput) <= 0) return 'Vui lòng nhập tổng ngân sách dự kiến lớn hơn 0.';
    return '';
  }

  function goToNextWizardStep() {
    const error = validateWizardStep(wizardStep);
    if (error) { setCreateError(error); return; }
    setCreateError('');
    setWizardStep(current => Math.min(3, current + 1));
  }

  async function handleCreateWedding() {
    const error = validateWizardStep(2);
    if (error) { setWizardStep(2); setCreateError(error); return; }
    setCreating(true);
    setCreateError('');
    try {
      const newEventId = await createBigEvent({
        title: `Đám cưới của ${groomName.trim()} & ${brideName.trim()}`,
        startDate: weddingDate,
        eventType: 'Party',
      });
      await initWeddingBlueprint({ eventId: newEventId, brideName, groomName, budget: parseVND(budgetInput), weddingDate, subEvents });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['wedding-details', newEventId] }),
        queryClient.invalidateQueries({ queryKey: ['wedding-tasks', newEventId] }),
        queryClient.invalidateQueries({ queryKey: ['wedding-expenses', newEventId] }),
      ]);
      setEventId(newEventId);
      setNoWedding(false);
      setWizardOpen(false);
      router.replace(`/events/wedding?event=${newEventId}`, { scroll: false });
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Không thể khởi tạo hành trình cưới. Vui lòng thử lại.');
    } finally { setCreating(false); }
  }

  async function toggleTask(task: WeddingTask) {
    if (!eventId || !task.TaskID) return;
    const queryKey = ['wedding-tasks', eventId] as const;
    const previous = queryClient.getQueryData<WeddingTask[]>(queryKey);
    const nextStatus = task.Status === 'Done' ? 'Pending' : 'Done';
    queryClient.setQueryData<WeddingTask[]>(queryKey, current => current?.map(item =>
      item.TaskID === task.TaskID ? { ...item, Status: nextStatus } : item,
    ) || []);
    try { await weddingService.updateTask(task.TaskID, { Status: nextStatus }); }
    catch { queryClient.setQueryData(queryKey, previous); }
    finally { await queryClient.invalidateQueries({ queryKey }); }
  }

  async function handleAddTask() {
    if (!eventId || !taskTitle.trim()) return;
    setSavingTask(true);
    setTaskError('');
    try {
      await weddingService.addTask({
        EventID: eventId, Title: taskTitle.trim(), Status: 'Pending',
        DueDate: taskDue ? new Date(`${taskDue}T12:00:00`).toISOString() : null,
        Category: taskCategory, Order: tasks.length + 1,
      });
      await queryClient.invalidateQueries({ queryKey: ['wedding-tasks', eventId] });
      setTaskTitle(''); setTaskDue(''); setTaskCategory('Other'); setShowTaskModal(false);
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : 'Không thể thêm công việc.');
    } finally { setSavingTask(false); }
  }

  async function refreshWedding() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['event', eventId] }),
      queryClient.invalidateQueries({ queryKey: ['wedding-details', eventId] }),
      queryClient.invalidateQueries({ queryKey: ['wedding-tasks', eventId] }),
      queryClient.invalidateQueries({ queryKey: ['wedding-expenses', eventId] }),
      queryClient.invalidateQueries({ queryKey: ['wedding-guests', eventId] }),
      queryClient.invalidateQueries({ queryKey: ['wedding-tables', eventId] }),
    ]);
  }

  const coupleTitle = details?.GroomName && details?.BrideName
    ? `Đám cưới của ${details.GroomName} & ${details.BrideName}`
    : event?.Title || 'Hành trình cưới của chúng mình';

  return <div className="page-content min-h-[80vh]">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
      <div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#E6002D]">Wedding Command Center</p><h1 className="text-[23px] font-bold text-[#111] tracking-tight mt-0.5">Kế hoạch cưới</h1></div>
      <div className="flex items-center gap-2">{eventId && <button onClick={refreshWedding} className="w-[38px] h-[38px] rounded-[11px] border border-white/70 bg-white/70 backdrop-blur-xl text-[#5F6368] flex items-center justify-center hover:bg-white transition-all" title="Làm mới dữ liệu"><RefreshCw size={15} /></button>}<button onClick={openWizard} className="h-[38px] px-3.5 rounded-[11px] bg-[#E6002D] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 shadow-[0_8px_20px_rgba(230,0,45,0.2)] hover:bg-[#D40028] transition-all"><Plus size={15} strokeWidth={2.5} /> Tạo đám cưới mới</button></div>
    </div>

    {resolving ? <div className="glass-card p-10 text-center text-[13px] text-[#8E8E93]">Đang chuẩn bị không gian kế hoạch cưới...</div> : noWedding || !eventId ? <EmptyWeddingState onOpen={openWizard} /> : <>
      <section className="relative overflow-hidden rounded-[22px] border border-white/90 bg-[linear-gradient(135deg,#FFF0F2_0%,#FFFFFF_72%)] p-5 sm:p-7 shadow-[0_16px_45px_rgba(172,40,71,0.08)] backdrop-blur-xl">
        <div className="absolute -right-8 -top-12 w-48 h-48 rounded-full bg-[#FFCCD5]/45 blur-2xl" /><div className="absolute -left-10 bottom-0 w-36 h-24 rounded-full bg-white/90 blur-xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-[#E6002D]"><Heart size={16} fill="currentColor" /><span className="text-[11px] font-bold uppercase tracking-[0.12em]">Ngày trọng đại</span></div><h2 className="mt-2 text-[25px] sm:text-[30px] font-bold tracking-tight text-[#24171A]">{coupleTitle}</h2><p className="mt-1.5 text-[13px] text-[#7A6167]"><CalendarDays size={14} className="inline mr-1.5 -mt-0.5" />{formatDateInVietnamese(event?.StartDate)}</p></div><div className="self-start sm:self-auto rounded-[15px] border border-white/90 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-xl"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#97757D]">Live countdown</p><p className="mt-0.5 text-[18px] font-bold text-[#E6002D]">{countdown === null ? 'Đang cập nhật' : countdown >= 0 ? `Còn ${countdown} ngày` : `Đã qua ${Math.abs(countdown)} ngày`}</p></div></div>
      </section>

      <section className="grid gap-3 mt-4 lg:grid-cols-3">
        <StatCard icon={<Wallet size={17} />} iconClass="bg-[#E6002D]/10 text-[#E6002D]" title="Ngân sách & dòng tiền" value={`${formatVND(budgetLimit)} đ`}>
          <div className="mt-3 flex items-center justify-between text-[11px]"><span className="text-[#6B7280]">Đã cọc / đã chi</span><span className={isOverBudget ? 'font-bold text-[#FF3B30]' : 'font-bold text-[#111]'}>{formatVND(paidAmount)} đ · {budgetPercent}%</span></div><Progress value={budgetPercent} color={isOverBudget ? '#FF3B30' : budgetPercent >= 80 ? '#FF9500' : '#34C759'} /><p className={`mt-2 text-[10.5px] ${isOverBudget ? 'text-[#FF3B30]' : 'text-[#8E8E93]'}`}>{isOverBudget ? 'Đã vượt hạn mức — cần rà soát các khoản phát sinh.' : `Còn lại ${formatVND(Math.max(0, budgetLimit - paidAmount))} đ trong hạn mức.`}</p>
        </StatCard>
        <StatCard icon={<Users size={17} />} iconClass="bg-[#007AFF]/10 text-[#007AFF]" title="Khách mời" value={<>{confirmedGuests}<span className="text-[15px] font-medium text-[#8E8E93]"> / {guests.length}</span></>}>
          <div className="mt-3 flex items-center justify-between text-[11px]"><span className="text-[#6B7280]">Đã xác nhận tham dự</span><span className="font-bold text-[#111]">{guests.length ? Math.round((confirmedGuests / guests.length) * 100) : 0}%</span></div><Progress value={guests.length ? Math.round((confirmedGuests / guests.length) * 100) : 0} color="#007AFF" /><Link href={`/events/wedding/guests?event=${eventId}`} className="mt-2.5 text-[10.5px] font-semibold text-[#007AFF] inline-flex items-center gap-1">{seatedGuests} khách đã xếp · {occupiedTables}/{tables.length} bàn <ChevronRight size={12} /></Link>
        </StatCard>
        <StatCard icon={<ListChecks size={17} />} iconClass="bg-[#34C759]/10 text-[#34C759]" title="Tiến độ công việc" value={`${taskProgress}%`}>
          <div className="mt-3 flex items-center justify-between text-[11px]"><span className="text-[#6B7280]">{doneCount}/{tasks.length} việc hoàn tất</span><span className={`font-bold ${urgentCount ? 'text-[#FF9500]' : 'text-[#34C759]'}`}>{urgentCount ? `${urgentCount} việc gấp` : 'Đúng tiến độ'}</span></div><Progress value={taskProgress} color="#34C759" /><p className="mt-2 text-[10.5px] text-[#8E8E93]">Đánh dấu trực tiếp để cập nhật tiến độ tức thì.</p>
        </StatCard>
      </section>

      <section className="grid min-w-0 gap-4 mt-4 xl:grid-cols-3">
        <article className="glass-card min-w-0 w-full overflow-hidden p-4 sm:p-5 xl:col-span-2"><div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h3 className="text-[16px] font-bold text-[#111]">Danh sách công việc theo mốc thời gian</h3><p className="text-[11.5px] text-[#8E8E93] mt-0.5">Bấm vào vòng tròn để hoàn thành công việc.</p></div><button onClick={() => { setTaskError(''); setShowTaskModal(true); }} className="h-[34px] shrink-0 px-3 rounded-[9px] bg-black/[0.05] text-[#4B5563] text-[11px] font-semibold inline-flex items-center justify-center gap-1 hover:bg-black/[0.08] transition-colors"><Plus size={14} /> Thêm việc</button></div><div className="flex min-w-0 gap-1.5 overflow-x-auto mt-4 pb-1">{TIMELINE_FILTERS.map(filter => <button key={filter.id} onClick={() => setTimeline(filter.id)} className={`h-[30px] shrink-0 whitespace-nowrap px-3 rounded-full text-[10.5px] font-semibold transition-all ${timeline === filter.id ? 'bg-[#E6002D] text-white shadow-sm' : 'bg-black/[0.04] text-[#667085] hover:bg-black/[0.07]'}`}>{filter.label}</button>)}</div><div className="mt-4 space-y-2">{tasksLoading ? <p className="py-8 text-center text-[12px] text-[#8E8E93]">Đang tải checklist...</p> : filteredTasks.length === 0 ? <p className="py-8 text-center text-[12px] text-[#8E8E93]">Không có công việc trong mốc thời gian này.</p> : filteredTasks.map(task => <TaskRow key={task.TaskID} task={task} weddingDate={event?.StartDate} onToggle={toggleTask} />)}</div></article>
        <aside className="glass-card min-w-0 w-full overflow-hidden p-4 sm:p-5"><div className="flex min-w-0 items-start gap-2"><ReceiptText size={16} className="mt-0.5 shrink-0 text-[#E6002D]" /><div className="min-w-0"><h3 className="text-[15px] font-bold text-[#111]">Phân bổ ngân sách</h3><p className="text-[11px] text-[#8E8E93]">Dự toán {formatVND(totalProjected)} đ</p></div></div><div className="space-y-4 mt-5">{expensesLoading ? <p className="text-[12px] text-[#8E8E93]">Đang tải dòng tiền...</p> : budgetGroups.map(group => <div key={group.id} className="min-w-0"><div className="flex min-w-0 items-start justify-between gap-2 text-[11px]"><span className="min-w-0 font-medium text-[#5F6368]">{group.label}</span><span className="min-w-0 text-right font-semibold break-words text-[#111]">{formatVND(group.actual)} / {formatVND(group.estimated)} đ</span></div><Progress value={group.percent} color={group.color} /></div>)}</div><Link href={`/events/wedding/guests?event=${eventId}`} className="mt-6 w-full h-[36px] rounded-[9px] bg-[#E6002D]/[0.07] text-[#E6002D] text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#E6002D]/10 transition-colors"><UserRoundCheck size={14} /> Mở quản lý khách mời</Link></aside>
      </section>
    </>}

    {wizardOpen && <WeddingWizard step={wizardStep} brideName={brideName} groomName={groomName} weddingDate={weddingDate} subEvents={subEvents} guestScale={guestScale} budgetInput={budgetInput} error={createError} creating={creating} onClose={() => { if (!creating) setWizardOpen(false); }} onBack={() => { setCreateError(''); setWizardStep(current => Math.max(1, current - 1)); }} onNext={goToNextWizardStep} onCreate={handleCreateWedding} onBrideNameChange={setBrideName} onGroomNameChange={setGroomName} onWeddingDateChange={setWeddingDate} onToggleSubEvent={toggleSubEvent} onGuestScaleChange={setGuestScale} onBudgetChange={raw => { const digits = raw.replace(/\D/g, ''); setBudgetInput(digits ? formatVND(Number(digits)) : ''); }} />}
    {showTaskModal && <TaskModal taskTitle={taskTitle} taskDue={taskDue} taskCategory={taskCategory} error={taskError} saving={savingTask} onClose={() => setShowTaskModal(false)} onTitleChange={setTaskTitle} onDueChange={setTaskDue} onCategoryChange={setTaskCategory} onSave={handleAddTask} />}
  </div>;
}

function EmptyWeddingState({ onOpen }: { onOpen: () => void }) {
  return <div className="glass-card p-10 sm:p-14 text-center"><div className="w-16 h-16 rounded-[22px] bg-[#E6002D]/10 mx-auto mb-4 flex items-center justify-center"><Heart size={29} className="text-[#E6002D]" fill="currentColor" /></div><h2 className="text-[19px] font-bold text-[#111]">Bắt đầu hành trình cưới của hai bạn</h2><p className="max-w-md mx-auto mt-2 text-[13px] leading-relaxed text-[#6B7280]">Chỉ với ba bước, Prot Life sẽ tạo checklist phong tục Việt Nam và sáu nhóm ngân sách để hai bạn bắt đầu ngay.</p><button onClick={onOpen} className="mt-6 h-[44px] px-5 rounded-[12px] bg-[#E6002D] text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-md"><Sparkles size={16} /> Mở Wedding Wizard</button></div>;
}

function StatCard({ title, value, icon, iconClass, children }: { title: string; value: React.ReactNode; icon: React.ReactNode; iconClass: string; children: React.ReactNode }) {
  return <article className="glass-card p-4 sm:p-5 border border-white/75 bg-white/65 backdrop-blur-xl"><div className="flex items-start justify-between gap-3"><div><p className="text-[12px] font-semibold text-[#5F6368]">{title}</p><p className="mt-1 text-[22px] font-bold tracking-tight text-[#111]">{value}</p></div><div className={`w-9 h-9 rounded-[12px] flex items-center justify-center ${iconClass}`}>{icon}</div></div>{children}</article>;
}

function Progress({ value, color }: { value: number; color: string }) {
  return <div className="mt-2 h-2 rounded-full bg-black/[0.06] overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }} /></div>;
}

function TaskRow({ task, weddingDate, onToggle }: { task: WeddingTask; weddingDate?: string; onToggle: (task: WeddingTask) => void }) {
  const done = task.Status === 'Done';
  const stage = getTaskTimeline(task, weddingDate);
  const label = TIMELINE_FILTERS.find(filter => filter.id === stage)?.label || 'Chưa hẹn';
  return <button onClick={() => onToggle(task)} className={`w-full text-left flex items-center gap-3 rounded-[12px] border p-3 transition-all duration-200 ${done ? 'border-[#34C759]/20 bg-[#34C759]/[0.045]' : 'border-black/[0.06] bg-white hover:border-[#E6002D]/25 hover:bg-[#FFF7F8]'}`}>{done ? <CheckCircle2 size={19} className="text-[#34C759] shrink-0" /> : <Circle size={19} className="text-[#A5A9B0] shrink-0" />}<span className="min-w-0 flex-1"><span className={`block text-[12.5px] transition-all ${done ? 'line-through text-[#8E8E93]' : 'font-semibold text-[#1F2937]'}`}>{task.Title}</span>{task.Category && <span className="text-[10px] text-[#9CA3AF]">{CATEGORY_LABELS[task.Category]?.label || task.Category}</span>}</span><span className={`hidden sm:inline-flex shrink-0 px-2 py-1 rounded-[6px] text-[9.5px] font-semibold ${stage === 'week' || stage === 'day' ? 'bg-[#FF9500]/10 text-[#D66D00]' : 'bg-black/[0.04] text-[#8E8E93]'}`}>{label}</span></button>;
}

function TaskModal(props: { taskTitle: string; taskDue: string; taskCategory: string; error: string; saving: boolean; onClose: () => void; onTitleChange: (value: string) => void; onDueChange: (value: string) => void; onCategoryChange: (value: string) => void; onSave: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm p-4" onMouseDown={props.onClose}><div className="w-full max-w-md rounded-[18px] border border-white/80 bg-white/95 p-5 shadow-2xl backdrop-blur-xl" onMouseDown={event => event.stopPropagation()}><div className="flex items-center justify-between"><div><h3 className="text-[17px] font-bold text-[#111]">Thêm công việc</h3><p className="text-[11px] text-[#8E8E93] mt-0.5">Bổ sung vào timeline cưới.</p></div><button onClick={props.onClose} className="w-8 h-8 rounded-full bg-black/[0.05] flex items-center justify-center text-[#6B7280]"><X size={15} /></button></div><div className="space-y-3 mt-5"><div><label className="block text-[11px] font-semibold text-[#5F6368] mb-1.5">Tên công việc *</label><input value={props.taskTitle} onChange={event => props.onTitleChange(event.target.value)} placeholder="Ví dụ: Chốt thực đơn nhà hàng" autoFocus className="w-full h-[42px] px-3 rounded-[10px] border border-black/[0.1] text-[13px] outline-none focus:border-[#E6002D]" /></div><div className="grid grid-cols-2 gap-3"><div><label className="block text-[11px] font-semibold text-[#5F6368] mb-1.5">Hạn chót</label><DateInput value={props.taskDue} onChange={props.onDueChange} className="w-full h-[42px] px-3 rounded-[10px] border border-black/[0.1] text-[13px] outline-none focus:border-[#E6002D] text-center" /></div><div><label className="block text-[11px] font-semibold text-[#5F6368] mb-1.5">Hạng mục</label><select value={props.taskCategory} onChange={event => props.onCategoryChange(event.target.value)} className="w-full h-[42px] px-3 rounded-[10px] border border-black/[0.1] text-[12px] bg-white outline-none focus:border-[#E6002D]">{Object.entries(CATEGORY_LABELS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></div></div>{props.error && <p className="text-[11px] text-[#FF3B30]">{props.error}</p>}<button onClick={props.onSave} disabled={!props.taskTitle.trim() || props.saving} className="w-full h-[43px] rounded-[10px] bg-[#E6002D] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50">{props.saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}{props.saving ? 'Đang lưu...' : 'Thêm vào checklist'}</button></div></div></div>;
}

function WeddingWizard(props: { step: number; brideName: string; groomName: string; weddingDate: string; subEvents: WeddingSubEvent[]; guestScale: (typeof GUEST_SCALES)[number]['id']; budgetInput: string; error: string; creating: boolean; onClose: () => void; onBack: () => void; onNext: () => void; onCreate: () => void; onBrideNameChange: (value: string) => void; onGroomNameChange: (value: string) => void; onWeddingDateChange: (value: string) => void; onToggleSubEvent: (value: WeddingSubEvent) => void; onGuestScaleChange: (value: (typeof GUEST_SCALES)[number]['id']) => void; onBudgetChange: (value: string) => void }) {
  const { step } = props;
  return <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center overscroll-none bg-[#24171A]/35 p-0 sm:p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Khởi tạo hành trình cưới"><div className="flex h-[100dvh] w-full max-w-[620px] flex-col overflow-hidden overscroll-contain rounded-t-[24px] sm:h-auto sm:max-h-[92dvh] sm:rounded-[24px] border border-white/90 bg-white/95 shadow-2xl backdrop-blur-2xl"><div className="shrink-0 border-b border-black/[0.05] bg-white/90 px-4 py-3 sm:px-7 sm:py-4 backdrop-blur-xl"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#E6002D]">Smart Wedding Onboarding</p><h2 className="mt-0.5 text-[18px] font-bold text-[#111]">Tạo hành trình cưới</h2></div><button onClick={props.onClose} className="w-8 h-8 rounded-full bg-black/[0.05] text-[#6B7280] flex items-center justify-center" aria-label="Đóng"><X size={16} /></button></div><div className="flex gap-1.5 mt-3">{[1, 2, 3].map(number => <div key={number} className={`h-1.5 flex-1 rounded-full transition-colors ${number <= step ? 'bg-[#E6002D]' : 'bg-black/[0.08]'}`} />)}</div><div className="flex justify-between mt-1.5 text-[10px] font-semibold text-[#8E8E93]"><span>Thông tin cặp đôi</span><span>Quy mô & ngân sách</span><span>Xác nhận</span></div></div><div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-7">{step === 1 && <WizardCoupleStep {...props} />}{step === 2 && <WizardBudgetStep {...props} />}{step === 3 && <WizardSummaryStep {...props} />}{props.error && <p className="mt-4 flex gap-1.5 text-[11px] text-[#FF3B30]"><AlertTriangle size={14} className="shrink-0" />{props.error}</p>}</div><div className="flex shrink-0 items-center justify-between gap-3 border-t border-black/[0.05] bg-white/90 px-4 py-3 sm:px-7 sm:py-4 backdrop-blur-xl">{step > 1 ? <button onClick={props.onBack} disabled={props.creating} className="h-[40px] px-3 rounded-[10px] text-[12px] font-semibold text-[#5F6368] inline-flex items-center gap-1 disabled:opacity-50"><ChevronLeft size={15} /> Quay lại</button> : <span />}{step < 3 ? <button onClick={props.onNext} className="h-[40px] px-4 rounded-[10px] bg-[#E6002D] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 shadow-sm">Tiếp tục <ChevronRight size={15} /></button> : <button onClick={props.onCreate} disabled={props.creating} className="h-[42px] px-4 rounded-[11px] bg-[#E6002D] text-white text-[12px] font-bold inline-flex items-center gap-1.5 shadow-[0_8px_20px_rgba(230,0,45,0.22)] disabled:opacity-50">{props.creating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}{props.creating ? 'Đang khởi tạo...' : 'Bắt đầu Hành trình Cưới ✨'}</button>}</div></div></div>;
}

type WizardProps = Parameters<typeof WeddingWizard>[0];

function WizardCoupleStep(props: WizardProps) {
  return <div className="space-y-5"><div><h3 className="text-[17px] font-bold text-[#111]">Câu chuyện của hai bạn</h3><p className="text-[12px] text-[#8E8E93] mt-1">Nhập thông tin chính để tạo timeline phù hợp với ngày cưới.</p></div><div className="grid gap-3 sm:grid-cols-2"><div><label className="block text-[11px] font-semibold text-[#5F6368] mb-1.5">Tên cô dâu *</label><input value={props.brideName} onChange={event => props.onBrideNameChange(event.target.value)} placeholder="Ví dụ: Phương Thảo" className="w-full h-[44px] rounded-[11px] border border-black/[0.1] px-3.5 text-[13px] outline-none focus:border-[#E6002D]" /></div><div><label className="block text-[11px] font-semibold text-[#5F6368] mb-1.5">Tên chú rể *</label><input value={props.groomName} onChange={event => props.onGroomNameChange(event.target.value)} placeholder="Ví dụ: Hà Phong" className="w-full h-[44px] rounded-[11px] border border-black/[0.1] px-3.5 text-[13px] outline-none focus:border-[#E6002D]" /></div></div><div><label className="block text-[11px] font-semibold text-[#5F6368] mb-1.5">Ngày cưới chính thức *</label><DateInput value={props.weddingDate} onChange={props.onWeddingDateChange} className="w-full h-[44px] rounded-[11px] border border-black/[0.1] px-3.5 text-[13px] outline-none focus:border-[#E6002D] text-center" /></div><div><p className="text-[11px] font-semibold text-[#5F6368] mb-2">Các nghi lễ dự kiến</p><div className="grid gap-2 sm:grid-cols-3">{SUB_EVENTS.map(item => { const checked = props.subEvents.includes(item.id); return <button key={item.id} type="button" onClick={() => props.onToggleSubEvent(item.id)} className={`text-left rounded-[12px] border p-3 transition-all ${checked ? 'border-[#E6002D]/40 bg-[#FFF4F5]' : 'border-black/[0.08] bg-white hover:bg-black/[0.02]'}`}><span className={`inline-flex w-4 h-4 rounded-[5px] items-center justify-center mr-1.5 align-middle ${checked ? 'bg-[#E6002D] text-white' : 'border border-[#B0B5BC]'}`}>{checked && <CheckCircle2 size={12} />}</span><span className="text-[12px] font-bold text-[#111]">{item.label}</span><span className="block mt-1 text-[10px] leading-snug text-[#8E8E93]">{item.detail}</span></button>; })}</div></div></div>;
}

function WizardBudgetStep(props: WizardProps) {
  return <div className="space-y-5"><div><h3 className="text-[17px] font-bold text-[#111]">Quy mô và ngân sách</h3><p className="text-[12px] text-[#8E8E93] mt-1">Prot Life sẽ tự chia thành sáu nhóm chi tiêu để bạn dễ kiểm soát.</p></div><div><p className="text-[11px] font-semibold text-[#5F6368] mb-2">Số lượng khách dự kiến</p><div className="grid gap-2 sm:grid-cols-3">{GUEST_SCALES.map(scale => <button key={scale.id} type="button" onClick={() => props.onGuestScaleChange(scale.id)} className={`rounded-[12px] border p-3 text-left transition-all ${props.guestScale === scale.id ? 'border-[#E6002D] bg-[#FFF4F5] shadow-sm' : 'border-black/[0.08] bg-white hover:bg-black/[0.02]'}`}><p className="text-[12px] font-bold text-[#111]">{scale.label}</p><p className="text-[10px] text-[#8E8E93] mt-0.5">{scale.detail}</p></button>)}</div></div><div><label className="block text-[11px] font-semibold text-[#5F6368] mb-1.5">Tổng ngân sách dự kiến (VND) *</label><div className="relative"><Wallet size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E6002D]" /><input value={props.budgetInput} onChange={event => props.onBudgetChange(event.target.value)} inputMode="numeric" placeholder="Ví dụ: 300.000.000" className="w-full h-[48px] rounded-[12px] border border-black/[0.1] pl-10 pr-10 text-[15px] font-semibold outline-none focus:border-[#E6002D]" /><span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#8E8E93]">đ</span></div><p className="mt-1.5 text-[10.5px] text-[#8E8E93]">Gợi ý: hệ thống phân bổ 50% tiệc & sảnh, 15% ảnh/phim, 10% trang phục, 10% trang trí, 5% xe hoa và 10% dự phòng.</p></div></div>;
}

function WizardSummaryStep(props: WizardProps) {
  const selectedCeremonies = SUB_EVENTS.filter(item => props.subEvents.includes(item.id)).map(item => item.label).join(', ') || 'Tiệc cưới chính';
  return <div className="space-y-5"><div className="text-center"><div className="w-14 h-14 rounded-[18px] bg-[#E6002D]/10 text-[#E6002D] mx-auto flex items-center justify-center"><Sparkles size={25} /></div><h3 className="mt-3 text-[18px] font-bold text-[#111]">Sẵn sàng cho ngày trọng đại</h3><p className="mt-1 text-[12px] text-[#8E8E93]">Hãy kiểm tra lần cuối trước khi kích hoạt blueprint.</p></div><div className="rounded-[15px] border border-[#E6002D]/10 bg-[#FFF7F8] p-4 text-[12px] text-[#4A3439] space-y-2"><p><span className="font-semibold">Cặp đôi:</span> {props.groomName} & {props.brideName}</p><p><span className="font-semibold">Ngày cưới:</span> {formatDateInVietnamese(props.weddingDate)}</p><p><span className="font-semibold">Nghi lễ:</span> {selectedCeremonies}</p><p><span className="font-semibold">Quy mô:</span> {GUEST_SCALES.find(item => item.id === props.guestScale)?.label}</p><p><span className="font-semibold">Ngân sách:</span> {formatVND(parseVND(props.budgetInput))} đ</p></div><div className="grid gap-2 sm:grid-cols-2"><div className="rounded-[12px] bg-[#F4FBF6] p-3"><CheckCircle2 size={16} className="text-[#34C759]" /><p className="mt-1.5 text-[12px] font-bold text-[#172B1D]">24 công việc chuẩn</p><p className="mt-0.5 text-[10.5px] text-[#5B7D63]">Từ D-9 tháng đến tuần cưới.</p></div><div className="rounded-[12px] bg-[#F2F7FF] p-3"><Wallet size={16} className="text-[#007AFF]" /><p className="mt-1.5 text-[12px] font-bold text-[#172B3F]">6 nhóm ngân sách</p><p className="mt-0.5 text-[10.5px] text-[#5A7395]">Tự động phân bổ theo tỷ lệ hợp lý.</p></div></div></div>;
}
