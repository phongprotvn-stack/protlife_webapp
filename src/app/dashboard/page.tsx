'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Calendar, Heart, TrendingUp, Clock, MapPin,
  Target, PieChart, RefreshCw, Gift, Coffee,
  BookHeart, FileText, Building2, AlertTriangle, Bell
} from 'lucide-react';
import { contactService } from '@/lib/services/contact-service';
import { eventService } from '@/lib/services/event-service';
import { memoryService } from '@/lib/services/memory-service';
import { goalService } from '@/lib/services/goal-service';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import type { Contact, EventItem } from '@/types/database';
import { formatDate, getAvatarColor, getInitials } from '@/lib/utils';

interface ReconnectSuggestion {
  contact: Contact;
  daysSinceLastEvent: number;
  lastEventDate: string;
  type: 'yellow' | 'red';
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [memoryCount, setMemoryCount] = useState(0);
  const [goalCount, setGoalCount] = useState(0);
  const [reconnectSuggestions, setReconnectSuggestions] = useState<ReconnectSuggestion[]>([]);
  const [sortAsc, setSortAsc] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true); setError('');
    try {
      const [c, e, mc, gc] = await Promise.all([
        contactService.getAll(),
        eventService.getAll(),
        memoryService.count(),
        goalService.getAll(),
      ]);
      setContacts(c); setEvents(e); setMemoryCount(mc); setGoalCount(gc.length);
      await computeReconnectSuggestions(c, e);
    } catch (err: any) { setError(err.message || 'Không thể tải dữ liệu'); }
    finally { setIsLoading(false); }
  };

  const computeReconnectSuggestions = async (contacts: Contact[], events: EventItem[]) => {
    try {
      // Get all participants to find last event date per contact
      const { data: participants } = await supabase
        .from('participants')
        .select('ContactID, EventID')
        .in('ContactID', contacts.map(c => c.ContactID));

      if (!participants || participants.length === 0) {
        setReconnectSuggestions([]);
        return;
      }

      // Build map of ContactID → list of EventIDs
      const contactEventMap: Record<string, string[]> = {};
      participants.forEach(p => {
        if (!contactEventMap[p.ContactID]) contactEventMap[p.ContactID] = [];
        contactEventMap[p.ContactID].push(p.EventID);
      });

      // Build map of EventID → StartDate
      const eventsMap: Record<string, string> = {};
      events.forEach(e => { eventsMap[e.EventID] = e.StartDate; });

      // For each contact with events, find the most recent event date
      const now = new Date();
      const suggestionMap = new Map<string, ReconnectSuggestion>();

      contacts.forEach(c => {
        const eventIds = contactEventMap[c.ContactID];
        if (!eventIds || eventIds.length === 0) return;

        let lastDate = '';
        eventIds.forEach(eid => {
          const d = eventsMap[eid];
          if (d && (!lastDate || d > lastDate)) lastDate = d;
        });

        if (!lastDate) return;

        const lastEventDate = new Date(lastDate);
        const daysSince = Math.floor((now.getTime() - lastEventDate.getTime()) / (1000 * 60 * 60 * 24));

        const isFavorite = c.IsFavorite && daysSince >= 21;
        const isHighScore = (c.RelationshipScore || 0) >= 80 && daysSince >= 180;

        // Red alert takes priority over yellow
        if (isHighScore) {
          suggestionMap.set(c.ContactID, { contact: c, daysSinceLastEvent: daysSince, lastEventDate: lastDate, type: 'red' });
        } else if (isFavorite && !suggestionMap.has(c.ContactID)) {
          suggestionMap.set(c.ContactID, { contact: c, daysSinceLastEvent: daysSince, lastEventDate: lastDate, type: 'yellow' });
        }
      });

      const sorted = Array.from(suggestionMap.values());
      setReconnectSuggestions(sorted);
    } catch (err) {
      console.error('Failed to compute reconnect suggestions:', err);
      setReconnectSuggestions([]);
    }
  };

  const statsCards = [
    { id: 'contacts', label: 'Quan hệ', value: contacts.length, icon: Users, color: '#E6002D', href: '/contacts' },
    { id: 'events', label: 'Sự kiện', value: events.length, icon: Calendar, color: '#007AFF', href: '/events' },
    { id: 'memories', label: 'Ký ức', value: memoryCount, icon: BookHeart, color: '#FF4D6A', href: '/memories' },
    { id: 'places', label: 'Địa điểm', value: new Set(events.filter(e => e.Place).map(e => e.Place)).size, icon: MapPin, color: '#34C759', href: '/map' },
  ];

  // ─── Life Score (same formula as Statistics page) ───
  const lifeScore = useMemo(() => {
    const contactScores = contacts.map(c => c.RelationshipScore || 0);
    const avgRelScore = contactScores.length > 0
      ? Math.round(contactScores.reduce((a, b) => a + b, 0) / contactScores.length * 10)
      : 0;
    const activityScore = Math.min(events.length * 2, 100);
    const memScore = Math.min(memoryCount * 5, 100);
    const socialScore = Math.min(contacts.length * 2, 100);
    const goalSc = Math.min(goalCount * 25, 100);
    return Math.round(avgRelScore * 0.30 + activityScore * 0.25 + memScore * 0.20 + socialScore * 0.15 + goalSc * 0.10);
  }, [contacts, events, memoryCount, goalCount]);

  const lifeSubScores = useMemo(() => [
    { label: 'Quan hệ', score: contacts.length > 0 ? Math.round(contacts.reduce((s, c) => s + (c.RelationshipScore || 0), 0) / contacts.length * 10) : 0, max: 100, color: '#E6002D' },
    { label: 'Hoạt động', score: Math.min(events.length * 2, 100), max: 100, color: '#0EA5E9' },
    { label: 'Ký ức', score: Math.min(memoryCount * 5, 100), max: 100, color: '#8B5CF6' },
    { label: 'Kết nối', score: Math.min(contacts.length * 2, 100), max: 100, color: '#F59E0B' },
    { label: 'Mục tiêu', score: Math.min(goalCount * 25, 100), max: 100, color: '#10B981' },
  ], [contacts, events.length, memoryCount, goalCount]);

  const favoriteContacts = contacts.filter(c => c.IsFavorite).slice(0, 6);

  const upcomingBirthdays = contacts
    .filter(c => c.Birthday && c.Status === 'Active')
    .map(c => {
      const bd = new Date(c.Birthday!);
      const next = new Date(new Date().getFullYear(), bd.getMonth(), bd.getDate());
      if (next < new Date()) next.setFullYear(new Date().getFullYear() + 1);
      const diff = Math.ceil((next.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return { contact: c, days: diff, nextDate: next };
    })
    .filter(b => b.days >= 0 && b.days <= 90)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  const recentEvents = [...events]
    .sort((a, b) => new Date(b.StartDate).getTime() - new Date(a.StartDate).getTime())
    .slice(0, 5);

  // ─── Relationship stats (dynamic, same as Statistics page) ───
  const relationshipMap: Record<string, { label: string; color: string; count: number }> = {
    Family: { label: 'Gia đình', color: '#E6002D', count: 0 },
    Relative: { label: 'Họ hàng', color: '#FF4D6A', count: 0 },
    Friend: { label: 'Bạn bè', color: '#007AFF', count: 0 },
    Colleague: { label: 'Đồng nghiệp', color: '#FF9500', count: 0 },
    Neighbor: { label: 'Hàng xóm', color: '#34C759', count: 0 },
    Teacher: { label: 'Thầy cô', color: '#5856D6', count: 0 },
    Partner: { label: 'Đối tác', color: '#AF52DE', count: 0 },
    Other: { label: 'Khác', color: '#8E8E93', count: 0 },
  };
  contacts.forEach((c) => {
    const key = c.Relationship && relationshipMap[c.Relationship] ? c.Relationship : 'Other';
    relationshipMap[key].count++;
  });
  const relStatsAll = Object.values(relationshipMap).filter(r => r.count > 0).sort((a, b) => b.count - a.count);
  const totalRel = contacts.length || 1;
  const relationshipStats = relStatsAll.map(r => ({ ...r, pct: Math.round((r.count / totalRel) * 100) }));

  const monthNames = ['Thg 1','Thg 2','Thg 3','Thg 4','Thg 5','Thg 6','Thg 7','Thg 8','Thg 9','Thg 10','Thg 11','Thg 12'];
  const totalBirthdays = contacts.filter(c => c.Birthday).length;

  // Sorted suggestions based on sortAsc toggle
  const sortedSuggestions = [...reconnectSuggestions]
    .sort((a, b) => sortAsc
      ? a.daysSinceLastEvent - b.daysSinceLastEvent  // ít→nhiều
      : b.daysSinceLastEvent - a.daysSinceLastEvent   // nhiều→ít
    )
    .slice(0, 10);
  const yellowAlerts = sortedSuggestions.filter(s => s.type === 'yellow');
  const redAlerts = sortedSuggestions.filter(s => s.type === 'red');

  return (
    <>
      {/* ===== MOBILE VIEW ===== */}
      <div className="md:hidden p-3 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#111] tracking-tight">
              Xin chào, {user?.name || 'FREE'} 👋
            </h1>
            <p className="text-[12px] text-[#6B7280] mt-0.5">Quản lý cuộc sống của bạn</p>
          </div>
          <button onClick={loadData} className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(0,0,0,0.04)] flex items-center justify-center">
            <RefreshCw size={15} className="text-[#8E8E93]" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-[12px] bg-[rgba(230,0,45,0.06)] text-[12px] text-[#E6002D] text-center">
            {error}
            <button onClick={loadData} className="ml-2 underline font-medium">Thử lại</button>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {statsCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.button key={stat.id} onClick={() => router.push(stat.href)}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`bg-white rounded-[14px] p-3 text-center shadow-sm border border-[rgba(0,0,0,0.04)] ${isLoading ? 'animate-pulse' : ''}`}>
                {isLoading ? (
                  <><div className="w-7 h-7 rounded-[8px] bg-[rgba(0,0,0,0.04)] mx-auto mb-2"/><div className="w-8 h-5 rounded bg-[rgba(0,0,0,0.04)] mx-auto"/></>
                ) : (
                  <><Icon size={18} className="mx-auto mb-1.5" style={{ color: stat.color }} />
                  <p className="text-[17px] font-bold text-[#111]">{stat.value}</p>
                  <p className="text-[9px] text-[#8E8E93] font-medium truncate">{stat.label}</p></>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Reconnection Suggestions */}
        {sortedSuggestions.length > 0 && (
          <div className="bg-white rounded-[16px] p-4 shadow-sm border border-[rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[14px] font-semibold text-[#111] flex items-center gap-1.5">
                <Coffee size={14} className="text-[#FF9500]"/> Gợi ý gặp gỡ
              </h2>
              <button onClick={() => setSortAsc(!sortAsc)}
                className="flex items-center gap-1 px-2 py-1 rounded-[6px] text-[9px] font-medium bg-[rgba(0,0,0,0.04)] text-[#8E8E93] hover:bg-[rgba(0,0,0,0.08)]">
                {sortAsc ? <>↑ Ít nhất</> : <>↓ Nhiều nhất</>}
              </button>
            </div>
            <div className="space-y-2.5">
              {redAlerts.map(s => (
                <div key={s.contact.ContactID} className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[rgba(230,0,45,0.04)] border border-[rgba(230,0,45,0.08)]">
                  <AvatarCircle contact={s.contact} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#111] truncate">{s.contact.Name}</p>
                    <p className="text-[10px] text-[#E6002D]">{s.daysSinceLastEvent} ngày chưa gặp</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button className="px-2 py-1 text-[9px] font-semibold rounded-[6px] bg-[#E6002D] text-white" title="Rủ Cafe">☕</button>
                    <button className="px-2 py-1 text-[9px] font-semibold rounded-[6px] bg-[#E6002D] text-white" title="Rủ Ăn">🍽️</button>
                  </div>
                </div>
              ))}
              {yellowAlerts.map(s => (
                <div key={s.contact.ContactID} className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[rgba(255,204,0,0.06)] border border-[rgba(255,204,0,0.12)]">
                  <AvatarCircle contact={s.contact} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#111] truncate">{s.contact.Name}</p>
                    <p className="text-[10px] text-[#B8860B]">{s.daysSinceLastEvent} ngày chưa gặp</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button className="px-2 py-1 text-[9px] font-semibold rounded-[6px] bg-[#FFCC00] text-[#111]" title="Rủ Cafe">☕</button>
                    <button className="px-2 py-1 text-[9px] font-semibold rounded-[6px] bg-[#FFCC00] text-[#111]" title="Rủ Ăn">🍽️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Events */}
        <div className="bg-white rounded-[16px] p-4 shadow-sm border border-[rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold text-[#111] flex items-center gap-1.5">
              <Clock size={14} className="text-[#007AFF]"/> Gần đây
            </h2>
            <button onClick={() => router.push('/events')} className="text-[11px] font-medium text-[#007AFF]">Xem tất cả</button>
          </div>
          {recentEvents.length === 0 ? (
            <div className="text-center py-6">
              <Calendar size={24} className="mx-auto text-[#007AFF]/20 mb-2"/>
              <p className="text-[12px] text-[#8E8E93]">Chưa có sự kiện</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentEvents.map(e => (
                <div key={e.EventID} className="flex items-center gap-2.5 p-2 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                  <div className="w-[32px] h-[36px] rounded-[8px] bg-[rgba(0,122,255,0.08)] flex flex-col items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-[#007AFF] leading-none">{new Date(e.StartDate).getDate()}</span>
                    <span className="text-[7px] text-[#007AFF]/60">{monthNames[new Date(e.StartDate).getMonth()]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#111] truncate">{e.Title}</p>
                    <p className="text-[10px] text-[#8E8E93]">{e.EventType}{e.Place ? ` · ${e.Place}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Birthdays */}
        {upcomingBirthdays.length > 0 && (
          <div className="bg-white rounded-[16px] p-4 shadow-sm border border-[rgba(0,0,0,0.04)]">
            <h2 className="text-[14px] font-semibold text-[#111] flex items-center gap-1.5 mb-3">
              <Gift size={14} className="text-[#FF9500]"/> Sinh nhật sắp tới
            </h2>
            <div className="space-y-2">
              {upcomingBirthdays.map(b => (
                <div key={b.contact.ContactID} className="flex items-center gap-2.5 p-2 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                  <AvatarCircle contact={b.contact} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#111] truncate">{b.contact.Name}</p>
                    <p className="text-[10px] text-[#FF9500]">{b.days === 0 ? 'Hôm nay! 🎉' : `${b.days} ngày nữa`}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-[#FF9500]">{formatDate(b.nextDate, 'ddmm')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Relationship Stats */}  
        <div className="bg-white rounded-[16px] p-4 shadow-sm border border-[rgba(0,0,0,0.04)]">
          <h2 className="text-[14px] font-semibold text-[#111] flex items-center gap-1.5 mb-3">
            <PieChart size={14} className="text-[#E6002D]"/> Quan hệ
          </h2>
          {relationshipStats.length === 0 ? (
            <p className="text-[12px] text-[#8E8E93] text-center py-4">Chưa có dữ liệu</p>
          ) : (
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                <DonutChart data={relationshipStats} size={110} innerRadius={30} />
              </div>
              <div className="flex-1 space-y-1.5 min-w-0">
                {relationshipStats.map(r => (
                  <div key={r.label} className="flex items-center gap-2 text-[10.5px]">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                    <span className="text-[#5F6368] flex-1 truncate">{r.label}</span>
                    <span className="font-semibold text-[#111]">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== DESKTOP VIEW ===== */}
      <div className="hidden md:block p-5 lg:p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[26px] font-bold text-[#111] tracking-tight">
              Xin chào, {user?.name || 'FREE'} 👋
            </h1>
            <p className="text-[13px] text-[#6B7280] mt-1">Hôm nay là một ngày tuyệt vời để ghi lại những khoảnh khắc.</p>
          </div>
          <button onClick={loadData} className="w-[38px] h-[38px] rounded-[10px] bg-[rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-[rgba(0,0,0,0.08)]">
            <RefreshCw size={16} className="text-[#8E8E93]" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-[12px] bg-[rgba(230,0,45,0.06)] text-[13px] text-[#E6002D] text-center">
            {error} <button onClick={loadData} className="ml-2 underline font-medium">Thử lại</button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {statsCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.button key={stat.id} onClick={() => router.push(stat.href)}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-white rounded-[14px] p-4 border border-[rgba(0,0,0,0.04)] shadow-sm text-left hover:shadow-md hover:border-[rgba(230,0,45,0.1)] transition-all">
                {isLoading ? (
                  <><div className="w-9 h-9 rounded-[10px] bg-[rgba(0,0,0,0.04)] mb-3"/><div className="w-14 h-8 bg-[rgba(0,0,0,0.04)] mb-1"/><div className="w-20 h-4 bg-[rgba(0,0,0,0.03)]"/></>
                ) : (
                  <><div className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-3" style={{ backgroundColor: `${stat.color}12` }}>
                    <Icon size={18} style={{ color: stat.color }} />
                  </div>
                  <p className="text-[26px] font-bold text-[#111]">{stat.value}</p>
                  <p className="text-[12px] text-[#8E8E93] font-medium mt-0.5">{stat.label}</p></>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Reconnection Suggestions */}
        {sortedSuggestions.length > 0 && (
          <div className="bg-white rounded-[14px] p-4 border border-[rgba(0,0,0,0.04)] shadow-sm mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[14px] font-semibold text-[#111] flex items-center gap-1.5">
                <Coffee size={15} className="text-[#FF9500]"/> Gợi ý gặp gỡ
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#8E8E93] font-medium">{sortedSuggestions.length} gợi ý</span>
                <button onClick={() => setSortAsc(!sortAsc)}
                  className="flex items-center gap-1 px-2 py-1 rounded-[6px] text-[10px] font-medium bg-[rgba(0,0,0,0.04)] text-[#8E8E93] hover:bg-[rgba(0,0,0,0.08)]">
                  {sortAsc ? '↑ Ít nhất' : '↓ Nhiều nhất'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {redAlerts.map(s => (
                <div key={s.contact.ContactID} className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[rgba(230,0,45,0.04)] border border-[rgba(230,0,45,0.1)]">
                  <AvatarCircle contact={s.contact} size={34} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#111] truncate">{s.contact.Name}</p>
                    <p className="text-[9px] text-[#E6002D] font-medium">⚠️ {s.daysSinceLastEvent} ngày chưa gặp</p>
                    <div className="flex gap-1 mt-1">
                      <button className="px-1.5 py-0.5 text-[8px] font-semibold rounded-[4px] bg-[#E6002D] text-white">☕ Cafe</button>
                      <button className="px-1.5 py-0.5 text-[8px] font-semibold rounded-[4px] bg-[#E6002D] text-white">🍽️ Ăn</button>
                    </div>
                  </div>
                </div>
              ))}
              {yellowAlerts.map(s => (
                <div key={s.contact.ContactID} className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[rgba(255,204,0,0.06)] border border-[rgba(255,204,0,0.12)]">
                  <AvatarCircle contact={s.contact} size={34} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#111] truncate">{s.contact.Name}</p>
                    <p className="text-[9px] text-[#B8860B] font-medium">⚠️ {s.daysSinceLastEvent} ngày chưa gặp</p>
                    <div className="flex gap-1 mt-1">
                      <button className="px-1.5 py-0.5 text-[8px] font-semibold rounded-[4px] bg-[#FFCC00] text-[#111]">☕ Cafe</button>
                      <button className="px-1.5 py-0.5 text-[8px] font-semibold rounded-[4px] bg-[#FFCC00] text-[#111]">🍽️ Ăn</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Row 1: Favorites + Birthdays */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {/* Favorite Contacts */}
          <div className="bg-white rounded-[14px] p-4 border border-[rgba(0,0,0,0.04)] shadow-sm">
            <h2 className="text-[14px] font-semibold text-[#111] flex items-center gap-1.5 mb-3">
              <Heart size={14} className="text-[#E6002D] fill-[#E6002D]"/> Yêu thích
            </h2>
            {favoriteContacts.length === 0 ? (
              <p className="text-[12px] text-[#8E8E93] text-center py-6">Chưa có</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {favoriteContacts.map(c => (
                  <div key={c.ContactID} className="flex items-center gap-2 p-1.5 rounded-[8px] hover:bg-[rgba(0,0,0,0.02)] transition-colors cursor-pointer" onClick={() => router.push('/contacts')}>
                    <AvatarCircle contact={c} size={32} />
                    <span className="text-[11px] font-medium text-[#5F6368] truncate max-w-[80px]">{c.Name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Birthdays */}
          <div className="bg-white rounded-[14px] p-4 border border-[rgba(0,0,0,0.04)] shadow-sm">
            <h2 className="text-[14px] font-semibold text-[#111] flex items-center gap-1.5 mb-3">
              <Gift size={14} className="text-[#FF9500]"/> Sinh nhật sắp tới
            </h2>
            {upcomingBirthdays.length === 0 ? (
              <p className="text-[12px] text-[#8E8E93] text-center py-6">Chưa có</p>
            ) : (
              <div className="space-y-1.5">
                {upcomingBirthdays.map(b => (
                  <div key={b.contact.ContactID} className="flex items-center gap-2 p-1.5 rounded-[8px] hover:bg-[rgba(0,0,0,0.02)]">
                    <AvatarCircle contact={b.contact} size={28} />
                    <span className="flex-1 text-[12px] font-medium text-[#111] truncate">{b.contact.Name}</span>
                    <span className="text-[10px] font-medium text-[#FF9500]">{b.days === 0 ? '🎉 Hôm nay' : `${b.days} ngày`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Life Score */}
          <div className="bg-white rounded-[14px] p-4 border border-[rgba(0,0,0,0.04)] shadow-sm text-center">
            <h2 className="text-[14px] font-semibold text-[#111] flex items-center justify-center gap-1.5 mb-2">
              <Heart size={14} className="text-[#E6002D]" fill="#E6002D"/> Life Score
            </h2>
            <div className="text-[42px] font-bold tracking-[-1.5px] transition-colors"
              style={{ color: lifeScore >= 70 ? '#10B981' : lifeScore >= 40 ? '#F59E0B' : '#EF4444' }}>
              {lifeScore}
            </div>
            <p className="text-[11px] text-[#8E8E93] mb-2">{contacts.length} quan hệ · {events.length} sự kiện</p>
            <div className="space-y-1.5">
              {lifeSubScores.map(s => (
                <div key={s.label} className="text-left">
                  <div className="flex items-center justify-between text-[10px] mb-0.5">
                    <span className="text-[#5F6368]">{s.label}</span>
                    <span className="font-semibold" style={{ color: s.color }}>{s.score}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(s.score, 100)}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Recent Events + Quick Access */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Recent Events */}
          <div className="bg-white rounded-[14px] p-4 border border-[rgba(0,0,0,0.04)] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[14px] font-semibold text-[#111] flex items-center gap-1.5">
                <Clock size={14} className="text-[#007AFF]"/> Hoạt động gần đây
              </h2>
              <button onClick={() => router.push('/events')} className="text-[11px] font-medium text-[#007AFF] hover:underline">Xem tất cả</button>
            </div>
            {recentEvents.length === 0 ? (
              <p className="text-[12px] text-[#8E8E93] text-center py-6">Chưa có sự kiện</p>
            ) : (
              <div className="space-y-1.5">
                {recentEvents.map(e => (
                  <div key={e.EventID} className="flex items-center gap-2.5 p-2 rounded-[8px] bg-[rgba(0,0,0,0.02)]">
                    <div className="w-[34px] h-[38px] rounded-[8px] bg-[rgba(0,122,255,0.08)] flex flex-col items-center justify-center shrink-0">
                      <span className="text-[12px] font-bold text-[#007AFF] leading-none">{new Date(e.StartDate).getDate()}</span>
                      <span className="text-[7px] text-[#007AFF]/60">{monthNames[new Date(e.StartDate).getMonth()]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#111] truncate">{e.Title}</p>
                      <p className="text-[10px] text-[#8E8E93]">{e.EventType}{e.Place ? ` · ${e.Place}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Relationship Stats with Donut Chart */}
          <div className="bg-white rounded-[14px] p-4 border border-[rgba(0,0,0,0.04)] shadow-sm">
            <h2 className="text-[14px] font-semibold text-[#111] flex items-center gap-1.5 mb-3">
              <PieChart size={14} className="text-[#E6002D]"/> Thống kê mối quan hệ
            </h2>
            {relationshipStats.length === 0 ? (
              <p className="text-[12px] text-[#8E8E93] text-center py-6">Chưa có dữ liệu</p>
            ) : (
              <div className="flex items-start gap-3">
                {/* Donut Chart */}
                <div className="shrink-0">
                  <DonutChart data={relationshipStats} size={130} innerRadius={36} />
                </div>
                {/* Legend */}
                <div className="flex-1 space-y-1.5 min-w-0">
                  {relationshipStats.map(r => (
                    <div key={r.label} className="flex items-center gap-2 text-[11px]">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                      <span className="text-[#5F6368] flex-1 truncate">{r.label}</span>
                      <span className="font-semibold text-[#111]">{r.count}</span>
                      <span className="text-[#8E8E93] w-[3ch] text-right">{r.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Quick Actions */}
        <div className="grid grid-cols-6 gap-3">
          <QuickAction icon={Heart} label="Thêm quan hệ" color="#E6002D" onClick={() => router.push('/contacts/add')} />
          <QuickAction icon={Calendar} label="Thêm sự kiện" color="#007AFF" onClick={() => router.push('/events/add')} />
          <QuickAction icon={BookHeart} label="Thêm ký ức" color="#FF4D6A" onClick={() => router.push('/memories/add')} />
          <QuickAction icon={Building2} label="Thêm tổ chức" color="#5856D6" onClick={() => router.push('/organizations/add')} />
          <QuickAction icon={FileText} label="Thêm tài liệu" color="#FF9500" onClick={() => router.push('/documents/add')} />
          <QuickAction icon={Target} label="Thêm mục tiêu" color="#AF52DE" onClick={() => router.push('/goals/add')} />
        </div>
      </div>
    </>
  );
}

function AvatarCircle({ contact, size }: { contact: { Avatar?: string | null; Name: string }; size: number }) {
  if (contact.Avatar) {
    return (
      <div className="rounded-full overflow-hidden shrink-0" style={{ width: size, height: size }}>
        <img src={contact.Avatar} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4, backgroundColor: getAvatarColor(contact.Name) }}>
      {getInitials(contact.Name)}
    </div>
  );
}

function QuickAction({ icon: Icon, label, color, onClick }: { icon: any; label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-[10px] bg-white border border-[rgba(0,0,0,0.04)] shadow-sm hover:shadow-md hover:border-[rgba(0,0,0,0.08)] transition-all">
      <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ backgroundColor: `${color}12` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <span className="text-[10px] font-medium text-[#5F6368] text-center">{label}</span>
    </button>
  );
}

// ─── SVG Donut Chart ───
function DonutChart({ data, size, innerRadius }: { data: { count: number; color: string }[]; size: number; innerRadius: number }) {
  const total = data.reduce((s, r) => s + r.count, 0);
  if (total === 0) return null;
  const cx = size / 2, cy = size / 2;
  const outerRadius = size / 2 - 4;
  const strokeWidth = outerRadius - innerRadius;
  const centerR = innerRadius + strokeWidth / 2;
  const circumference = 2 * Math.PI * centerR;

  let cumulative = 0;
  const segments = data.map(r => {
    const pct = r.count / total;
    const offset = cumulative * circumference;
    const length = pct * circumference;
    cumulative += pct;
    return { ...r, offset, length };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={centerR} fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth={strokeWidth} />
      {segments.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={centerR} fill="none"
          stroke={s.color} strokeWidth={strokeWidth} strokeLinecap="butt"
          strokeDasharray={`${s.length} ${circumference - s.length}`}
          strokeDashoffset={-s.offset}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      ))}
      {/* Center text */}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        className="fill-[#111] font-bold" fontSize={size * 0.16}>
        {total}
      </text>
      <text x={cx} y={cy + size * 0.12} textAnchor="middle" dominantBaseline="central"
        className="fill-[#8E8E93]" fontSize={size * 0.07}>
        tổng
      </text>
    </svg>
  );
}
