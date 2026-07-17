'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Sparkles, TrendingUp, Users, Calendar, Heart, Lightbulb, BarChart3, Zap } from 'lucide-react';
import type { Contact, EventItem } from '@/types/database';
import { contactService } from '@/lib/services/contact-service';
import { eventService } from '@/lib/services/event-service';
import { getRelationshipLabel, getMoodEmoji } from '@/lib/utils';

// Relationship breakdown
const RELATIONSHIP_TYPES = ['Family', 'Relative', 'Friend', 'Colleague', 'Neighbor', 'Teacher', 'Partner', 'Other'];

interface Insight {
  id: string;
  icon: typeof Sparkles;
  title: string;
  description: string;
  color: string;
}

export default function AIInsightPage() {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    Promise.all([
      contactService.getAll(),
      eventService.getAll(),
    ]).then(([c, e]) => {
      setContacts(c);
      setEvents(e);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Compute insights
  const insights: Insight[] = [];

  if (contacts.length > 0) {
    const totalScore = contacts.reduce((s, c) => s + (c.RelationshipScore || 0), 0);
    const avgScore = Math.round(totalScore / contacts.length);
    const topRelation = contacts.filter(c => (c.RelationshipScore || 0) >= 80).length;
    const favoriteCount = contacts.filter(c => c.IsFavorite).length;

    insights.push({
      id: 'avg-connection',
      icon: Heart,
      title: 'Điểm kết nối trung bình',
      description: `Mức độ thân thiết trung bình đạt ${avgScore}/100. Bạn có ${topRelation} mối quan hệ "Ruột thịt" và ${favoriteCount} người yêu thích.`,
      color: '#E6002D',
    });

    // Relationship distribution
    const relCounts = RELATIONSHIP_TYPES.map(r => {
      const count = contacts.filter(c => c.Relationship === r).length;
      return { type: r, count, pct: Math.round((count / contacts.length) * 100) };
    }).sort((a, b) => b.count - a.count);
    const topRel = relCounts[0];

    insights.push({
      id: 'rel-distribution',
      icon: Users,
      title: 'Phân bổ mối quan hệ',
      description: `Nhóm "${topRel.type}" chiếm ${topRel.pct}% (${topRel.count} người). ${relCounts[1] ? `Tiếp theo là "${relCounts[1].type}" (${relCounts[1].count} người).` : ''}`,
      color: '#007AFF',
    });

    // Gender distribution
    const male = contacts.filter(c => c.Gender === 'Male').length;
    const female = contacts.filter(c => c.Gender === 'Female').length;

    if (male + female > 0) {
      insights.push({
        id: 'gender',
        icon: Users,
        title: 'Giới tính',
        description: `Nam: ${male} (${Math.round(male/(male+female)*100)}%) · Nữ: ${female} (${Math.round(female/(male+female)*100)}%)`,
        color: '#5856D6',
      });
    }

    // Birthdays
    const hasBirthday = contacts.filter(c => c.Birthday).length;
    insights.push({
      id: 'birthdays',
      icon: Calendar,
      title: 'Sinh nhật sắp tới',
      description: `${hasBirthday} người có ngày sinh nhật trong danh sách. Theo dõi để gửi lời chúc kịp thời.`,
      color: '#FF9500',
    });
  }

  if (events.length > 0) {
    // Event type breakdown
    const typeCounts: Record<string, number> = {};
    events.forEach(e => {
      const t = e.EventType || 'Other';
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
    const topEventType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
    const moodEvents = events.filter(e => e.Mood);

    insights.push({
      id: 'top-activity',
      icon: TrendingUp,
      title: 'Hoạt động nhiều nhất',
      description: `"${topEventType[0]}" xuất hiện ${topEventType[1]} lần. ${moodEvents.length}/${events.length} sự kiện có ghi nhận cảm xúc.`,
      color: '#34C759',
    });

    // Cost tracking
    const hasCost = events.filter(e => (e.Cost || 0) > 0);
    if (hasCost.length > 0) {
      const totalCost = hasCost.reduce((s, e) => s + (e.Cost || 0), 0);
      insights.push({
        id: 'spending',
        icon: BarChart3,
        title: 'Chi tiêu',
        description: `${hasCost.length} sự kiện có ghi nhận chi phí, tổng ${totalCost.toLocaleString('vi-VN')}₫. Trung bình ${Math.round(totalCost / hasCost.length).toLocaleString('vi-VN')}₫/sự kiện.`,
        color: '#FF4D6A',
      });
    }

    // Mood analysis
    const happyMoods = events.filter(e => e.Mood === 'Happy' || e.Mood === 'Excited' || e.Mood === 'Loved');
    if (happyMoods.length > 0) {
      insights.push({
        id: 'mood',
        icon: Heart,
        title: 'Cảm xúc tích cực',
        description: `${happyMoods.length}/${events.length} sự kiện mang cảm xúc tích cực. ${getMoodEmoji('Happy')} Hạnh phúc là cảm xúc phổ biến nhất.`,
        color: '#FF2D55',
      });
    }
  }

  // Default insight
  if (insights.length === 0) {
    insights.push({
      id: 'welcome',
      icon: Lightbulb,
      title: 'Chào mừng đến với AI Insight',
      description: 'Thêm dữ liệu quan hệ và sự kiện để nhận phân tích thông minh về cuộc sống của bạn.',
      color: '#AF52DE',
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-3">
            <BrainCircuit size={28} className="text-[#AF52DE]" />
            AI Insight
          </h1>
          <p className="text-[13px] text-[#8E8E93] mt-1">
            Phân tích thông minh về mối quan hệ và sự kiện
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#AF52DE]/20 border-t-[#AF52DE] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4 space-y-4 pb-8">
          {/* Stats summary */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-value text-[#007AFF]">{contacts.length}</div>
              <div className="stat-label">Quan hệ</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-[#FF9500]">{events.length}</div>
              <div className="stat-label">Sự kiện</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-[#AF52DE]">{insights.length}</div>
              <div className="stat-label">Insights</div>
            </div>
          </div>

          {/* Insights */}
          {insights.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card p-5"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-[40px] h-[40px] rounded-[14px] flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${insight.color}15` }}
                  >
                    <Icon size={20} style={{ color: insight.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-[#111] mb-1">{insight.title}</h3>
                    <p className="text-[13px] text-[#6B7280] leading-relaxed">{insight.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Feedback */}
          <div className="glass-card-compact p-4 text-center">
            <p className="text-[12px] text-[#8E8E93]">
              <Zap size={14} className="inline mr-1" />
              Càng nhiều dữ liệu, phân tích càng chính xác
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
