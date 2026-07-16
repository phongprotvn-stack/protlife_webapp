'use client';

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
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for initial display
const statsCards = [
  { id: 'contacts', label: 'Quan hệ', value: '0', icon: Users, color: '#E6002D' },
  { id: 'events', label: 'Sự kiện', value: '0', icon: Calendar, color: '#007AFF' },
  { id: 'memories', label: 'Ký ức', value: '0', icon: Heart, color: '#FF4D6A' },
  { id: 'places', label: 'Địa điểm', value: '0', icon: MapPin, color: '#34C759' },
];

const upcomingBirthdays = [
  // Will be populated from database
];

const recentEvents = [
  // Will be populated from database
];

// Mock relationship stats
const relationshipStats = [
  { label: 'Gia đình', value: 0, color: '#E6002D', pct: 0 },
  { label: 'Họ hàng', value: 0, color: '#FF4D6A', pct: 0 },
  { label: 'Bạn bè', value: 0, color: '#007AFF', pct: 0 },
  { label: 'Đồng nghiệp', value: 0, color: '#FF9500', pct: 0 },
  { label: 'Khác', value: 0, color: '#8E8E93', pct: 0 },
];

// Mock life stages
const lifeStages = [
  { label: 'Infancy', emoji: '👶', value: 0, color: '#34C759' },
  { label: 'Secondary School', emoji: '📚', value: 0, color: '#007AFF' },
  { label: 'High School', emoji: '🎓', value: 0, color: '#5856D6' },
  { label: 'University', emoji: '🏛️', value: 0, color: '#AF52DE' },
  { label: 'Early Career', emoji: '💼', value: 0, color: '#FF9500' },
  { label: 'Mid Career', emoji: '📈', value: 0, color: '#E6002D' },
];

const goals = [
  { icon: '✈️', title: 'Du lịch Nhật Bản', deadline: '2026', progress: 0 },
  { icon: '🏠', title: 'Mua nhà', deadline: '2028', progress: 0 },
  { icon: '📚', title: 'Học tiếng Anh', deadline: '2025', progress: 0 },
];

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[28px] font-bold text-[#111] tracking-tight"
        >
          Xin chào, Prot 👋
        </motion.h1>
        <p className="text-[14px] text-[#6B7280] mt-1">Hôm nay là một ngày tuyệt vời để ghi lại những khoảnh khắc.</p>
      </div>

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
            </motion.div>
          );
        })}
      </div>

      {/* Row 1: Sinh nhật + Hoạt động gần đây */}
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
            <div className="space-y-3">
              {/* Birthday items */}
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
            <div className="space-y-3">
              {/* Event items */}
            </div>
          )}
        </motion.div>
      </div>

      {/* Row 2: Thống kê mối quan hệ + Phân bổ giai đoạn cuộc sống */}
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
          {relationshipStats.every(r => r.value === 0) ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#E6002D]/5 mx-auto mb-3 flex items-center justify-center">
                <Users size={20} className="text-[#E6002D]/30" />
              </div>
              <p className="text-[13px] text-[#8E8E93]">Chưa có dữ liệu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {relationshipStats.map((r) => (
                <div key={r.label}>
                  <div className="flex items-center justify-between text-[13px] mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                      <span className="text-[#111] font-medium">{r.label}</span>
                    </div>
                    <span className="text-[#8E8E93]">{r.value}</span>
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
          {lifeStages.every(l => l.value === 0) ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#5856D6]/5 mx-auto mb-3 flex items-center justify-center">
                <Layers size={20} className="text-[#5856D6]/30" />
              </div>
              <p className="text-[13px] text-[#8E8E93]">Chưa có dữ liệu</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {lifeStages.map((stage) => (
                <div key={stage.label} className="flex items-center gap-3">
                  <span className="text-[16px] w-[24px] text-center">{stage.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[13px] mb-0.5">
                      <span className="text-[#111] font-medium">{stage.label}</span>
                      <span className="text-[#8E8E93]">{stage.value} sự kiện</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[rgba(0,0,0,0.04)] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: '0%', backgroundColor: stage.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Row 3: Mục tiêu + Life Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Goals */}
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
          {goals.length === 0 ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#AF52DE]/5 mx-auto mb-3 flex items-center justify-center">
                <Target size={20} className="text-[#AF52DE]/30" />
              </div>
              <p className="text-[13px] text-[#8E8E93]">Chưa có mục tiêu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                  <span className="text-[20px]">{goal.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-[#111] truncate">{goal.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-[rgba(0,0,0,0.04)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#AF52DE]"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-[#8E8E93] whitespace-nowrap">{goal.deadline}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Life Score Radar (placeholder) */}
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
            <div className="w-16 h-16 rounded-full bg-[#E6002D]/5 mx-auto mb-3 flex items-center justify-center">
              <TrendingUp size={28} className="text-[#E6002D]/40" />
            </div>
            <p className="text-[14px] text-[#8E8E93]">
              Biểu đồ Life Score sẽ hiển thị sau khi có dữ liệu
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
