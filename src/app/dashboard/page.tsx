'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  Heart,
  TrendingUp,
  Clock,
  MapPin,
  Sparkles,
  Target,
  PieChart,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { contactService } from '@/lib/services/contact-service';
import { eventService } from '@/lib/services/event-service';
import { useAuthStore } from '@/stores/auth-store';
import type { Contact, EventItem } from '@/types/database';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [c, e] = await Promise.all([
        contactService.getAll(),
        eventService.getAll(),
      ]);
      setContacts(c);
      setEvents(e);
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  // Stats
  const statsCards = [
    { id: 'contacts', label: 'Quan hệ', value: String(contacts.length), icon: Users, color: '#E6002D' },
    { id: 'events', label: 'Sự kiện', value: String(events.length), icon: Calendar, color: '#007AFF' },
    { id: 'memories', label: 'Ký ức', value: '0', icon: Heart, color: '#FF4D6A' },
    { id: 'places', label: 'Địa điểm', value: String(new Set(events.filter(e => e.Place).map(e => e.Place)).size), icon: MapPin, color: '#34C759' },
  ];

  // Relationship stats
  const relationshipMap: Record<string, { label: string; color: string; count: number }> = {
    Family: { label: 'Gia đình', color: '#E6002D', count: 0 },
    Relative: { label: 'Họ hàng', color: '#FF4D6A', count: 0 },
    Friend: { label: 'Bạn bè', color: '#007AFF', count: 0 },
    Colleague: { label: 'Đồng nghiệp', color: '#FF9500', count: 0 },
    Other: { label: 'Khác', color: '#8E8E93', count: 0 },
  };
  contacts.forEach((c) => {
    const key = relationshipMap[c.Relationship] ? c.Relationship : 'Other';
    relationshipMap[key].count++;
  });
  const totalRel = contacts.length || 1;
  const relationshipStats = Object.values(relationshipMap).map((r) => ({
    ...r,
    pct: Math.round((r.count / totalRel) * 100),
  }));

  // Life stages from events
  const stageMap: Record<string, { label: string; emoji: string; color: string; count: number }> = {
    Infancy: { label: 'Infancy', emoji: '👶', color: '#34C759', count: 0 },
    Childhood: { label: 'Childhood', emoji: '🧒', color: '#30B0C7', count: 0 },
    'Secondary School': { label: 'Secondary School', emoji: '📚', color: '#007AFF', count: 0 },
    'High School': { label: 'High School', emoji: '🎓', color: '#5856D6', count: 0 },
    University: { label: 'University', emoji: '🏛️', color: '#AF52DE', count: 0 },
    'Early Career': { label: 'Early Career', emoji: '💼', color: '#FF9500', count: 0 },
    'Mid Career': { label: 'Mid Career', emoji: '📈', color: '#E6002D', count: 0 },
  };
  events.forEach((e) => {
    if (e.LifeStage && stageMap[e.LifeStage]) {
      stageMap[e.LifeStage].count++;
    }
  });
  const totalEvents = events.length || 1;
  const lifeStages = Object.values(stageMap);

  // Upcoming birthdays
  const today = new Date();
  const upcomingBirthdays = contacts
    .filter((c) => c.Birthday && c.Status === 'Active')
    .map((c) => {
      const bd = new Date(c.Birthday!);
      const next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
      if (next < today) next.setFullYear(today.getFullYear() + 1);
      const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { contact: c, days: diff, nextDate: next };
    })
    .filter((b) => b.days >= 0 && b.days <= 90)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  // Recent events
  const recentEvents = [...events]
    .sort((a, b) => new Date(b.StartDate).getTime() - new Date(a.StartDate).getTime())
    .slice(0, 5);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[28px] font-bold text-[#111] tracking-tight"
          >
            Xin chào, {user?.name || 'FREE'} 👋
          </motion.h1>
          <p className="text-[14px] text-[#6B7280] mt-1">Hôm nay là một ngày tuyệt vời để ghi lại những khoảnh khắc.</p>
        </div>
        <button
          onClick={loadData}
          className="w-[40px] h-[40px] rounded-[12px] bg-[rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-[rgba(0,0,0,0.08)] transition-all"
        >
          <RefreshCw size={18} className="text-[#8E8E93]" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-[14px] bg-[#E6002D]/5 text-[13px] text-[#E6002D] font-medium text-center">
          {error}
          <button onClick={loadData} className="ml-2 underline">Thử lại</button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statsCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, ease: [0.32, 0.72, 0, 1] }}
              className="card-ios"
            >
              {isLoading ? (
                <div className="py-4">
                  <div className="w-8 h-8 rounded-[10px] bg-[rgba(0,0,0,0.04)] mb-3 animate-pulse" />
                  <div className="w-12 h-7 rounded bg-[rgba(0,0,0,0.04)] mb-1 animate-pulse" />
                  <div className="w-16 h-4 rounded bg-[rgba(0,0,0,0.03)] animate-pulse" />
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-9 h-9 rounded-[12px] flex items-center justify-center"
                      style={{ backgroundColor: `${stat.color}12` }}
                    >
                      <Icon size={18} style={{ color: stat.color }} />
                    </div>
                  </div>
                  <p className="text-[22px] font-bold text-[#111]">{stat.value}</p>
                  <p className="text-[12px] text-[#8E8E93] font-medium mt-0.5">{stat.label}</p>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Row 1: Birthdays + Recent Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Upcoming Birthdays */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-ios"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-[#111] flex items-center gap-2">
              <Sparkles size={18} className="text-[#FF9500]" />
              Sinh nhật sắp tới
            </h2>
          </div>
          {upcomingBirthdays.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-[#FF9500]/10 mx-auto mb-3 flex items-center justify-center">
                <Sparkles size={20} className="text-[#FF9500]" />
              </div>
              <p className="text-[14px] text-[#8E8E93]">Chưa có sinh nhật nào sắp tới</p>
              <p className="text-[12px] text-[#B0B0B8] mt-1">Thêm quan hệ để theo dõi sinh nhật</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingBirthdays.map((b) => {
                const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
                return (
                  <div key={b.contact.ContactID} className="flex items-center gap-3 p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                    <div className="w-[40px] h-[40px] rounded-full bg-gradient-to-br from-[#FF9500] to-[#FFCC00] flex items-center justify-center text-white font-bold text-[14px] flex-shrink-0">
                      {b.contact.Name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-[#111] truncate">{b.contact.Name}</p>
                      <p className="text-[11px] text-[#8E8E93]">
                        {b.days === 0 ? 'Hôm nay! 🎉' : b.days === 1 ? 'Ngày mai 🎂' : `${b.days} ngày nữa`}
                      </p>
                    </div>
                    <span className="text-[12px] font-semibold text-[#FF9500] flex-shrink-0">
                      {months[b.nextDate.getMonth()]}/{b.nextDate.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Recent Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card-ios"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-[#111] flex items-center gap-2">
              <Clock size={18} className="text-[#007AFF]" />
              Hoạt động gần đây
            </h2>
          </div>
          {recentEvents.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-[#007AFF]/10 mx-auto mb-3 flex items-center justify-center">
                <Calendar size={20} className="text-[#007AFF]" />
              </div>
              <p className="text-[14px] text-[#8E8E93]">Chưa có sự kiện nào</p>
              <p className="text-[12px] text-[#B0B0B8] mt-1">Bắt đầu ghi lại những sự kiện đầu tiên</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentEvents.map((e) => (
                <div key={e.EventID} className="flex items-center gap-3 p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                  <div className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(0,122,255,0.1)] flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} className="text-[#007AFF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-[#111] truncate">{e.Title}</p>
                    <p className="text-[11px] text-[#8E8E93]">{e.EventType}{e.Place ? ` · ${e.Place}` : ''}</p>
                  </div>
                  <span className="text-[11px] text-[#8E8E93] flex-shrink-0">
                    {e.StartDate?.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Row 2: Relationship Stats + Life Stage Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Relationship Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-ios"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-[#111] flex items-center gap-2">
              <PieChart size={18} className="text-[#E6002D]" />
              Thống kê mối quan hệ
            </h2>
          </div>
          {contacts.length === 0 ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#E6002D]/5 mx-auto mb-3 flex items-center justify-center">
                <Users size={20} className="text-[#E6002D]/30" />
              </div>
              <p className="text-[13px] text-[#8E8E93]">Chưa có dữ liệu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {relationshipStats
                .filter((r) => r.count > 0)
                .sort((a, b) => b.count - a.count)
                .map((r) => (
                <div key={r.label}>
                  <div className="flex items-center justify-between text-[13px] mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                      <span className="text-[#111] font-medium">{r.label}</span>
                    </div>
                    <span className="text-[#8E8E93]">{r.count}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[rgba(0,0,0,0.04)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${r.pct}%`, backgroundColor: r.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Life Stage Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card-ios"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-[#111] flex items-center gap-2">
              <Layers size={18} className="text-[#5856D6]" />
              Phân bổ theo giai đoạn cuộc sống
            </h2>
          </div>
          {events.length === 0 ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#5856D6]/5 mx-auto mb-3 flex items-center justify-center">
                <Layers size={20} className="text-[#5856D6]/30" />
              </div>
              <p className="text-[13px] text-[#8E8E93]">Chưa có dữ liệu</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {lifeStages
                .filter((s) => s.count > 0)
                .sort((a, b) => b.count - a.count)
                .map((stage) => (
                <div key={stage.label} className="flex items-center gap-3">
                  <span className="text-[16px] w-[24px] text-center">{stage.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[13px] mb-0.5">
                      <span className="text-[#111] font-medium">{stage.label}</span>
                      <span className="text-[#8E8E93]">{stage.count} sự kiện</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[rgba(0,0,0,0.04)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((stage.count / totalEvents) * 100)}%`, backgroundColor: stage.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Row 3: Goals + Life Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Goals (mock for now) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card-ios"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-[#111] flex items-center gap-2">
              <Target size={18} className="text-[#AF52DE]" />
              Mục tiêu
            </h2>
            <button className="text-[12px] font-medium text-[#E6002D] hover:underline">Xem tất cả</button>
          </div>
          <p className="text-[13px] text-[#8E8E93] text-center py-6">Tính năng đang phát triển</p>
        </motion.div>

        {/* Life Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="card-ios"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-[#111] flex items-center gap-2">
              <TrendingUp size={18} className="text-[#E6002D]" />
              Life Score
            </h2>
          </div>
          <div className="py-8 text-center">
            <div className="text-[48px] font-bold text-[#111]">
              {contacts.length + events.length}
            </div>
            <p className="text-[13px] text-[#8E8E93] mt-1">
              {contacts.length} quan hệ · {events.length} sự kiện
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
