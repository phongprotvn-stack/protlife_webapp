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

      {/* Two column layout for desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Life Score Radar (placeholder) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card-ios mt-4"
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
  );
}
