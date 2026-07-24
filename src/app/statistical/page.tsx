'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { goalService } from '@/lib/services/goal-service';
import { organizationService } from '@/lib/services/organization-service';
import { exportExcel, exportWord, exportPDF } from '@/lib/export-utils';
import { Users, CalendarDays, BookHeart, MapPin, ArrowUpRight, Download, ChevronRight, TrendingUp, Activity, Target, Building2, TrendingDown, Heart, BrainCircuit } from 'lucide-react';
import Link from 'next/link';

// ─── Types ───
interface TrendInfo {
  direction: 'up' | 'down' | 'same';
  pct: number;
  label: string;
}

interface DashboardStats {
  contacts: number;
  events: number;
  memories: number;
  goals: number;
  organizations: number;
  recentContacts: number;
  recentEvents: number;
  byMonth: { month: string; contacts: number; events: number }[];
  byRelation: { type: string; count: number }[];
  recentItems: { type: 'contact' | 'event' | 'memory'; title: string; date: string; id: string }[];
  totalStorageMb: number;
  eventTrend: TrendInfo;
  lifeScore: number;
  lifeSubScores: { label: string; score: number; max: number; color: string }[];
}

const MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

// ─── Toast ───
let _toastTimer: any;
function showToast(msg: string) {
  const el = document.getElementById('stat-toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

function calcTrend(values: number[]): TrendInfo {
  if (values.length < 2) return { direction: 'same', pct: 0, label: '—' };
  const curr = values[values.length - 1];
  const prev = values[values.length - 2];
  if (prev === 0 && curr === 0) return { direction: 'same', pct: 0, label: 'Không đổi' };
  if (prev === 0) return { direction: 'up', pct: 100, label: '+100%' };
  const pct = Math.round(((curr - prev) / prev) * 100);
  const direction = pct > 0 ? 'up' : pct < 0 ? 'down' : 'same';
  const label = pct > 0 ? `+${pct}%` : pct < 0 ? `${pct}%` : 'Không đổi';
  return { direction, pct, label };
}

export default function StatisticalPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<'contacts' | 'events'>('events');
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const now = new Date();
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();

      const [
        { count: contactCount, error: ce },
        { count: eventCount, error: ee },
        { count: memoryCount, error: me },
        recentCRes,
        recentERes,
        recentMRes,
        allEventsRes,
        allContactsRes,
      ] = await Promise.all([
        supabase.from('contacts').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('memories').select('*', { count: 'exact', head: true }),
        supabase.from('contacts').select('"ContactID","Name","CreatedDate"').order('"CreatedDate"', { ascending: false }).limit(5),
        supabase.from('events').select('"EventID","Title","StartDate"').order('"StartDate"', { ascending: false }).limit(5),
        supabase.from('memories').select('"MemoryID","Title","CreatedDate"').order('"CreatedDate"', { ascending: false }).limit(5),
        supabase.from('events').select('"StartDate"').gte('"StartDate"', threeMonthsAgo),
        supabase.from('contacts').select('"Relationship","RelationshipScore"'),
      ]);

      const recentC = recentCRes.data as any[] || [];
      const recentE = recentERes.data as any[] || [];
      const recentM = recentMRes.data as any[] || [];
      const allEvents = allEventsRes.data as any[] || [];
      const allContacts = allContactsRes.data as any[] || [];

      // Goals & Organizations (localStorage services)
      const [allGoals, allOrgs] = await Promise.all([
        goalService.getAll().catch(() => []),
        organizationService.getAll().catch(() => []),
      ]);

      // Recent items
      const recentItems: DashboardStats['recentItems'] = [];
      (recentC || []).forEach((c: any) => recentItems.push({ type: 'contact', title: c.Name, date: c.CreatedDate, id: c.ContactID }));
      (recentE || []).forEach((e: any) => recentItems.push({ type: 'event', title: e.Title, date: e.StartDate, id: e.EventID }));
      (recentM || []).forEach((m: any) => recentItems.push({ type: 'memory', title: m.Title, date: m.CreatedDate, id: m.MemoryID }));
      recentItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      recentItems.splice(10);

      // By month (last 3 months)
      const byMonth: DashboardStats['byMonth'] = [];
      for (let i = 2; i >= 0; i--) {
        const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mStr = m.toISOString().slice(0, 7);
        const label = MONTHS[m.getMonth()] + (i === 2 ? `/${m.getFullYear()}` : '');
        byMonth.push({
          month: label,
          contacts: 0,
          events: (allEvents || []).filter((e: any) => e.StartDate?.startsWith(mStr)).length,
        });
      }

      // Event trend
      const eventTrend = calcTrend(byMonth.map(m => m.events));

      // By relation type
      const typeMap: Record<string, number> = {};
      (allContacts || []).forEach((c: any) => {
        const t = c.Relationship || 'Khác';
        typeMap[t] = (typeMap[t] || 0) + 1;
      });
      const byRelation = Object.entries(typeMap).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);

      const dbMb = Math.round(((contactCount || 0) * 8000 + (eventCount || 0) * 4000 + (memoryCount || 0) * 6000) / (1024 * 1024) * 10) / 10;

      // ─── Life Score ───
      const contactScores = (allContacts || []).map((c: any) => c.RelationshipScore ?? 0);
      const avgRelScore = contactScores.length > 0
        ? Math.round(contactScores.reduce((a: number, b: number) => a + b, 0) / contactScores.length * 10)
        : 0;
      const activityScore = Math.min((eventCount || 0) * 2, 100);
      const memoryScore = Math.min((memoryCount || 0) * 5, 100);
      const socialScore = Math.min((contactCount || 0) * 2, 100);
      const goalScore = Math.min((allGoals.length || 0) * 25, 100);
      const lifeScore = Math.round(
        avgRelScore * 0.30 + activityScore * 0.25 + memoryScore * 0.20 + socialScore * 0.15 + goalScore * 0.10
      );
      const lifeSubScores = [
        { label: 'Quan hệ', score: Math.round(avgRelScore), max: 100, color: '#E6002D' },
        { label: 'Hoạt động', score: activityScore, max: 100, color: '#0EA5E9' },
        { label: 'Ký ức', score: memoryScore, max: 100, color: '#8B5CF6' },
        { label: 'Kết nối', score: socialScore, max: 100, color: '#F59E0B' },
        { label: 'Mục tiêu', score: goalScore, max: 100, color: '#10B981' },
      ];

      setStats({
        contacts: contactCount || 0,
        events: eventCount || 0,
        memories: memoryCount || 0,
        goals: allGoals.length,
        organizations: allOrgs.length,
        recentContacts: recentC.length || 0,
        recentEvents: recentE.length || 0,
        byMonth,
        byRelation,
        recentItems,
        totalStorageMb: Math.max(dbMb, 0.1),
        eventTrend,
        lifeScore,
        lifeSubScores,
      });
    } catch (e) {
      console.error('Stats error:', e);
    } finally {
      setLoading(false);
    }
  }

  // ─── Export handlers ───
  const handleExportJson = useCallback(async () => {
    setExporting(true);
    try {
      const [contacts, events, memories] = await Promise.all([
        supabase.from('contacts').select('*'),
        supabase.from('events').select('*'),
        supabase.from('memories').select('*'),
      ]);
      const data = {
        exportedAt: new Date().toISOString(),
        summary: stats ? { contacts: stats.contacts, events: stats.events, memories: stats.memories, goals: stats.goals, organizations: stats.organizations } : null,
        contacts: contacts.data || [],
        events: events.data || [],
        memories: memories.data || [],
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `protlife_stats_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`✅ Đã xuất ${(contacts.data?.length || 0) + (events.data?.length || 0) + (memories.data?.length || 0)} mục`);
    } catch { showToast('❌ Lỗi khi xuất'); }
    finally { setExporting(false); }
  }, [stats]);

  const prepareTableData = useCallback(() => {
    if (!stats) return { headers: [], rows: [] };
    const headers = ['Loại', 'Mục', 'Số lượng'];
    const rows: Record<string, string>[] = [
      { 'Loại': 'Người thân', 'Mục': 'Tổng số', 'Số lượng': String(stats.contacts) },
      { 'Loại': 'Sự kiện', 'Mục': 'Tổng số', 'Số lượng': String(stats.events) },
      { 'Loại': 'Ký ức', 'Mục': 'Tổng số', 'Số lượng': String(stats.memories) },
      { 'Loại': 'Mục tiêu', 'Mục': 'Tổng số', 'Số lượng': String(stats.goals) },
      { 'Loại': 'Tổ chức', 'Mục': 'Tổng số', 'Số lượng': String(stats.organizations) },
      { 'Loại': 'Life Score', 'Mục': 'Điểm tổng hợp', 'Số lượng': String(stats.lifeScore) },
    ];
    stats.byRelation.slice(0, 8).forEach(r => {
      rows.push({ 'Loại': 'Quan hệ', 'Mục': r.type, 'Số lượng': String(r.count) });
    });
    return { headers, rows };
  }, [stats]);

  const handleExportDocx = useCallback(async () => {
    setExporting(true);
    try {
      const { headers, rows } = prepareTableData();
      await exportWord(headers, rows, `Thong_ke_${new Date().toISOString().split('T')[0]}`);
      showToast('✅ Đã xuất Word');
    } catch { showToast('❌ Lỗi xuất Word'); }
    finally { setExporting(false); }
  }, [prepareTableData]);

  const handleExportXlsx = useCallback(async () => {
    setExporting(true);
    try {
      const { headers, rows } = prepareTableData();
      await exportExcel(headers, rows, `Thong_ke_${new Date().toISOString().split('T')[0]}`);
      showToast('✅ Đã xuất Excel');
    } catch { showToast('❌ Lỗi xuất Excel'); }
    finally { setExporting(false); }
  }, [prepareTableData]);

  const handleExportPdf = useCallback(async () => {
    setExporting(true);
    try {
      const { headers, rows } = prepareTableData();
      await exportPDF(headers, rows, `Thong_ke_${new Date().toISOString().split('T')[0]}`);
      showToast('✅ Đã xuất PDF');
    } catch { showToast('❌ Lỗi xuất PDF'); }
    finally { setExporting(false); }
  }, [prepareTableData]);

  // ─── Chart data ───
  const chartData = useMemo(() => {
    if (!stats) return { labels: [], values: [], max: 1 };
    const data = activeChart === 'contacts' ? stats.byMonth.map(m => m.contacts) : stats.byMonth.map(m => m.events);
    const max = Math.max(...data, 1);
    return { labels: stats.byMonth.map(m => m.month), values: data, max };
  }, [stats, activeChart]);

  const chartTrend = useMemo(() => {
    if (!stats) return null;
    return stats.eventTrend;
  }, [stats]);

  return (
    <>
      {/* Toast */}
      <div id="stat-toast"
        className="fixed top-5 left-1/2 -translate-x-1/2 -translate-y-5 scale-90 bg-black/85 backdrop-blur-xl text-white px-[22px] py-3 rounded-[26px] text-[13px] font-semibold z-[100] opacity-0 pointer-events-none shadow-[0_16px_40px_rgba(0,0,0,.25)] transition-all duration-[400ms]"
        style={{ transitionTimingFunction: 'cubic-bezier(.34,1.4,.64,1)' }} />
      <style>{`#stat-toast.show{opacity:1;transform:translateX(-50%)translateY(0)scale(1)}`}</style>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-[-.3px]">Thống kê</h1>
            <p className="text-[13px] text-[#6B7280] mt-0.5">Báo cáo và phân tích dữ liệu</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadStats} disabled={loading}
              className="px-4 py-2.5 rounded-[12px] border border-[#EDEDF1] bg-white text-[13px] font-bold cursor-pointer hover:bg-[#FAFAFB] active:scale-[.97] transition-all disabled:opacity-50">
              {loading ? '⏳ Đang tải...' : '🔄 Làm mới'}
            </button>
            <div className="relative">
              <button onClick={() => setShowExportMenu(!showExportMenu)} disabled={!stats}
                className="px-4 py-2.5 rounded-[12px] text-[13px] font-bold text-white cursor-pointer active:scale-[.97] transition-all disabled:opacity-50 flex items-center gap-1.5"
                style={{ background: 'linear-gradient(135deg,#D60032 0%,#FF4B3A 55%,#FF6A3D 100%)', boxShadow: '0 8px 20px rgba(214,0,50,.2)' }}>
                <Download size={14} strokeWidth={2.5} />
                {exporting ? '⏳ Đang xuất...' : 'Xuất'}
              </button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 top-[48px] z-50 bg-white border border-[#EDEDF1] rounded-[14px] shadow-[0_12px_40px_rgba(0,0,0,.12)] p-[4px] min-w-[160px]">
                    <ExportMenuItem icon="📄" label="Word (.docx)" onClick={async () => { setShowExportMenu(false); await handleExportDocx(); }} />
                    <ExportMenuItem icon="📊" label="Excel (.xlsx)" onClick={async () => { setShowExportMenu(false); await handleExportXlsx(); }} />
                    <ExportMenuItem icon="📕" label="PDF" onClick={async () => { setShowExportMenu(false); await handleExportPdf(); }} />
                    <div className="h-[1px] bg-[#EDEDF1] mx-2" />
                    <ExportMenuItem icon="📋" label="JSON" onClick={async () => { setShowExportMenu(false); await handleExportJson(); }} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {loading && !stats ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-3 border-[rgba(var(--color-primary-rgb),.2)] border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-4" />
            <div className="text-[14px] text-[#6B7280]">Đang tải thống kê...</div>
          </div>
        ) : stats ? (
          <>
            {/* ─── Life Score ─── */}
            <div className="bg-white border border-[#EDEDF1] rounded-[18px] p-[22px] shadow-[0_8px_28px_rgba(0,0,0,.05)] mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#D60032 0%,#FF4B3A 55%,#FF6A3D 100%)' }}>
                    <Heart size={18} strokeWidth={2.2} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-[14.5px] font-extrabold">Life Score</h3>
                    <p className="text-[11px] text-[#6B7280]">Điểm số tổng hợp cuộc sống</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[32px] font-extrabold tracking-[-1px]" style={{ color: stats.lifeScore >= 70 ? '#10B981' : stats.lifeScore >= 40 ? '#F59E0B' : '#EF4444' }}>
                    {stats.lifeScore}
                  </span>
                  <span className="text-[12px] text-[#6B7280] font-semibold">/100</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {stats.lifeSubScores.map((s) => (
                  <div key={s.label} className="bg-[#FAFAFB] rounded-[10px] p-[10px]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10.5px] font-semibold text-[#6B7280]">{s.label}</span>
                      <span className="text-[12px] font-extrabold" style={{ color: s.color }}>{s.score}</span>
                    </div>
                    <div className="w-full h-[4px] rounded-[2px] bg-[#EDEDF1] overflow-hidden">
                      <div className="h-full rounded-[2px] transition-all duration-500" style={{
                        width: `${(s.score / s.max) * 100}%`,
                        background: s.color,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── 6 Stat Cards ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
              <StatCard icon={<Users size={18} strokeWidth={2.2} />} label="Người thân & bạn bè" value={stats.contacts} color="#E6002D" bg="rgba(230,0,45,.06)" />
              <StatCard icon={<CalendarDays size={18} strokeWidth={2.2} />} label="Sự kiện" value={stats.events} color="#0EA5E9" bg="rgba(14,165,233,.06)"
                trend={stats.eventTrend} />
              <StatCard icon={<BookHeart size={18} strokeWidth={2.2} />} label="Ký ức" value={stats.memories} color="#8B5CF6" bg="rgba(139,92,246,.06)" />
              <StatCard icon={<Target size={18} strokeWidth={2.2} />} label="Mục tiêu" value={stats.goals} color="#F59E0B" bg="rgba(245,158,11,.06)" />
              <StatCard icon={<Building2 size={18} strokeWidth={2.2} />} label="Tổ chức" value={stats.organizations} color="#6366F1" bg="rgba(99,102,241,.06)" />
              <StatCard icon={<MapPin size={18} strokeWidth={2.2} />} label="Dung lượng DB" value={`${stats.totalStorageMb.toFixed(1)}MB`} color="#10B981" bg="rgba(16,185,129,.06)" />
            </div>

            {/* ─── Grid: Chart + Recent ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 mb-5">
              {/* Chart card */}
              <div className="bg-white border border-[#EDEDF1] rounded-[18px] p-[22px] shadow-[0_8px_28px_rgba(0,0,0,.05)]">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-[14.5px] font-extrabold">Hoạt động 3 tháng gần</h3>
                    {chartTrend && chartTrend.direction !== 'same' && (
                      <span className={`text-[11px] font-bold mt-0.5 flex items-center gap-1 ${
                        chartTrend.direction === 'up' ? 'text-[#10B981]' : 'text-[#EF4444]'
                      }`}>
                        {chartTrend.direction === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        Sự kiện: {chartTrend.label} so với tháng trước
                      </span>
                    )}
                  </div>
                  <div className="flex bg-[#F4F4F6] rounded-[10px] p-[3px]">
                    <button onClick={() => setActiveChart('events')}
                      className={`px-3 py-1.5 rounded-[8px] text-[11.5px] font-bold transition-all ${
                        activeChart === 'events' ? 'text-[var(--color-primary)] bg-white shadow-sm' : 'text-[#6B7280]'
                      }`}
                      style={activeChart === 'events' ? { color: 'var(--color-primary)' } : undefined}>
                      Sự kiện
                    </button>
                    <button onClick={() => setActiveChart('contacts')}
                      className={`px-3 py-1.5 rounded-[8px] text-[11.5px] font-bold transition-all ${
                        activeChart === 'contacts' ? 'text-[var(--color-primary)] bg-white shadow-sm' : 'text-[#6B7280]'
                      }`}
                      style={activeChart === 'contacts' ? { color: 'var(--color-primary)' } : undefined}>
                      Quan hệ
                    </button>
                  </div>
                </div>
                {/* Simple SVG bar chart */}
                <div className="flex items-end gap-3 h-[140px] px-2">
                  {chartData.labels.map((label, i) => {
                    const pct = (chartData.values[i] / chartData.max) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[11px] font-bold" style={{ color: 'var(--color-primary)' }}>{chartData.values[i]}</span>
                        <div className="w-full rounded-[5px]" style={{
                          height: Math.max(pct, 4) + '%',
                          background: `linear-gradient(180deg, #D60032 0%, #FF4B3A 55%, #FF6A3D 100%)`,
                          opacity: chartData.values[i] === 0 ? 0.25 : 0.85,
                          transition: 'height .4s ease',
                        }} />
                        <span className="text-[10px] text-[#9CA3AF] font-semibold">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent activity */}
              <div className="bg-white border border-[#EDEDF1] rounded-[18px] p-[22px] shadow-[0_8px_28px_rgba(0,0,0,.05)]">
                <h3 className="text-[14.5px] font-extrabold mb-4">Gần đây</h3>
                {stats.recentItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity size={28} className="text-[#D1D5DB] mx-auto mb-2" />
                    <p className="text-[12px] text-[#9CA3AF]">Chưa có dữ liệu</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {stats.recentItems.map((item, i) => (
                      <Link key={`${item.type}-${item.id}`} href={`/${item.type === 'contact' ? 'contacts' : item.type === 'event' ? 'events' : 'memories'}/${item.id}`}
                        className="flex items-center gap-3 py-[10px] border-b border-[#EDEDF1] last:border-b-0 no-underline group">
                        <div className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-[13px] shrink-0"
                          style={{
                            background: item.type === 'contact' ? 'rgba(230,0,45,.08)' : item.type === 'event' ? 'rgba(14,165,233,.08)' : 'rgba(139,92,246,.08)',
                          }}>
                          {item.type === 'contact' ? '👤' : item.type === 'event' ? '📅' : '📸'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12.5px] font-bold truncate group-hover:text-[var(--color-primary)] transition-colors">{item.title}</div>
                          <div className="text-[10.5px] text-[#9CA3AF] mt-0.5">
                            {new Date(item.date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                        <ChevronRight size={13} className="text-[#D1D5DB] shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ─── Bottom grid: Relation types + Goals/Orgs overview + Export ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
              {/* Relation distribution */}
              <div className="bg-white border border-[#EDEDF1] rounded-[18px] p-[22px] shadow-[0_8px_28px_rgba(0,0,0,.05)]">
                <h3 className="text-[14.5px] font-extrabold mb-4">Phân bố quan hệ</h3>
                {stats.byRelation.length === 0 ? (
                  <div className="text-[12px] text-[#9CA3AF] py-4 text-center">Chưa có dữ liệu quan hệ</div>
                ) : (
                  <div className="space-y-2.5">
                    {stats.byRelation.slice(0, 8).map((r, i) => {
                      const pct = Math.round((r.count / stats.contacts) * 100);
                      const colors = ['#E6002D','#0EA5E9','#8B5CF6','#10B981','#F59E0B','#EC4899','#6366F1','#84CC16'];
                      return (
                        <div key={r.type} className="flex items-center gap-3">
                          <span className="w-[8px] h-[8px] rounded-full shrink-0" style={{ background: colors[i % colors.length] }} />
                          <div className="flex-1">
                            <div className="flex justify-between text-[12px] mb-1">
                              <span className="font-semibold">{r.type}</span>
                              <span className="font-bold" style={{ color: 'var(--color-primary)' }}>{r.count}</span>
                            </div>
                            <div className="w-full h-[6px] rounded-[3px] bg-[#F1F1F4] overflow-hidden">
                              <div className="h-full rounded-[3px]" style={{
                                width: pct + '%',
                                background: `linear-gradient(90deg, #D60032 0%, #FF4B3A 55%, #FF6A3D 100%)`,
                              }} />
                            </div>
                          </div>
                          <span className="text-[10.5px] text-[#9CA3AF] font-semibold w-[34px] text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right column: Goals/Orgs overview + Quick stats */}
              <div className="space-y-4">
                {/* Goals & Organizations quick stats */}
                <div className="bg-white border border-[#EDEDF1] rounded-[18px] p-[22px] shadow-[0_8px_28px_rgba(0,0,0,.05)]">
                  <h3 className="text-[14.5px] font-extrabold mb-3">Mục tiêu & Tổ chức</h3>
                  <div className="grid grid-cols-2 gap-3 text-[13px]">
                    <div className="bg-[#FAFAFB] rounded-[12px] p-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-[60px] h-[60px] rounded-full bg-[#F59E0B]/5 -translate-y-1/2 translate-x-1/3" />
                      <div className="text-[11px] text-[#6B7280] font-semibold relative z-[1]">🎯 Mục tiêu</div>
                      <div className="text-[18px] font-extrabold mt-0.5 relative z-[1]">{stats.goals}</div>
                    </div>
                    <div className="bg-[#FAFAFB] rounded-[12px] p-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-[60px] h-[60px] rounded-full bg-[#6366F1]/5 -translate-y-1/2 translate-x-1/3" />
                      <div className="text-[11px] text-[#6B7280] font-semibold relative z-[1]">🏢 Tổ chức</div>
                      <div className="text-[18px] font-extrabold mt-0.5 relative z-[1]">{stats.organizations}</div>
                    </div>
                  </div>
                </div>

                {/* Quick report link */}
                <Link href="/statistical/report/bao-cao-tong-hop"
                  className="block bg-white border border-[#EDEDF1] rounded-[18px] p-[22px] shadow-[0_8px_28px_rgba(0,0,0,.05)] no-underline hover:border-[var(--color-primary)]/30 transition-colors group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center text-white text-[17px] shrink-0"
                      style={{ background: 'linear-gradient(135deg,#D60032 0%,#FF4B3A 55%,#FF6A3D 100%)' }}>
                      <TrendingUp size={18} strokeWidth={2.2} />
                    </div>
                    <div>
                      <div className="text-[14px] font-extrabold">Báo cáo tổng quan</div>
                      <div className="text-[11.5px] text-[#6B7280]">Toàn bộ dữ liệu Prot Life</div>
                    </div>
                  </div>
                  <p className="text-[12px] text-[#6B7280] leading-relaxed mb-3">
                    Báo cáo chi tiết tất cả quan hệ, sự kiện, ký ức — kèm biểu đồ tương tác và xu hướng theo thời gian.
                  </p>
                  <div className="flex items-center text-[12px] font-bold gap-1" style={{ color: 'var(--color-primary)' }}>
                    Xem báo cáo <ArrowUpRight size={12} strokeWidth={2.5} />
                  </div>
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-[14px] text-[#E6002D]">Không thể tải dữ liệu. Vui lòng thử lại.</p>
            <button onClick={loadStats} className="mt-3 px-5 py-2.5 rounded-[12px] text-[13px] font-bold text-white cursor-pointer"
              style={{ background: 'var(--color-primary)' }}>Thử lại</button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Stat Card ───
function StatCard({ icon, label, value, color, bg, trend }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  bg: string;
  trend?: TrendInfo;
}) {
  return (
    <div className="bg-white border border-[#EDEDF1] rounded-[16px] p-[16px] shadow-[0_4px_12px_rgba(0,0,0,.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,.06)] transition-shadow relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-[32px] h-[32px] rounded-[9px] flex items-center justify-center" style={{ background: bg, color }}>
            {icon}
          </div>
          <span className="text-[11px] text-[#6B7280] font-semibold leading-tight">{label}</span>
        </div>
        {trend && trend.direction !== 'same' && (
          <div className={`flex items-center gap-0.5 text-[10.5px] font-bold ${
            trend.direction === 'up' ? 'text-[#10B981]' : 'text-[#EF4444]'
          }`}>
            {trend.direction === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend.label}
          </div>
        )}
      </div>
      <div className="text-[26px] font-extrabold tracking-[-.5px]" style={{ color: '#101010' }}>{value}</div>
    </div>
  );
}

// ─── Export Menu Item ───
function ExportMenuItem({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-semibold text-[#111] hover:bg-[rgba(0,0,0,0.04)] transition-all text-left cursor-pointer"
    >
      <span className="text-[16px]">{icon}</span>
      {label}
    </button>
  );
}
