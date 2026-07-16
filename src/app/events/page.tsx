'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Calendar, Filter } from 'lucide-react';
import { EventCard } from '@/components/events/event-card';
import { cn } from '@/lib/utils';

const eventTypes = [
  { id: '', label: 'Tất cả', icon: '📋' },
  { id: 'Meeting', label: 'Gặp gỡ', icon: '🤝' },
  { id: 'Birthday', label: 'Sinh nhật', icon: '🎂' },
  { id: 'Travel', label: 'Du lịch', icon: '✈️' },
  { id: 'Work', label: 'Công việc', icon: '💼' },
  { id: 'Sport', label: 'Thể thao', icon: '⚽' },
  { id: 'Hospital', label: 'Bệnh viện', icon: '🏥' },
  { id: 'Meal', label: 'Ăn uống', icon: '🍽️' },
  { id: 'Call', label: 'Gọi điện', icon: '📞' },
  { id: 'Shopping', label: 'Mua sắm', icon: '🛍️' },
  { id: 'Study', label: 'Học tập', icon: '📚' },
  { id: 'Party', label: 'Tiệc tùng', icon: '🎉' },
  { id: 'Date', label: 'Hẹn hò', icon: '💕' },
  { id: 'Entertainment', label: 'Giải trí', icon: '🎮' },
  { id: 'Other', label: 'Khác', icon: '📌' },
];

import type { Event, EventType, Mood, Importance, LifeStage, Source } from '@/types/database';

const mockEvents: Event[] = [
  {
    EventID: 'EV20250615001',
    No: 1,
    EventType: 'Meeting' as EventType,
    LifeStage: 'Early Career' as LifeStage,
    Source: 'Manual' as Source,
    Title: 'Họp nhóm dự án',
    StartDate: '2025-06-15',
    EndDate: null,
    Place: 'Văn phòng ABC',
    Maplink: null,
    Mood: 'Happy' as Mood,
    Importance: 'High' as Importance,
    ParticipantCount: 0,
    Cost: 0,
    Notes: '',
    CreatedDate: '2025-06-15',
    UpdatedDate: '2025-06-15',
  },
];

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const filteredEvents = mockEvents.filter((e) => {
    if (activeFilter && e.EventType !== activeFilter) return false;
    if (searchQuery && !e.Title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[26px] font-bold text-[#111] tracking-tight">Sự kiện</h1>
          <p className="text-[13px] text-[#8E8E93] mt-0.5">{mockEvents.length} sự kiện</p>
        </div>
        <button className="w-[44px] h-[44px] rounded-[14px] bg-[#E6002D] text-white flex items-center justify-center shadow-lg active:scale-90 transition-all duration-200"
          style={{ boxShadow: '0 4px 12px rgba(230,0,45,0.3)' }}
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={17} className="absolute left-[16px] top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none z-10" />
        <input
          type="text"
          placeholder="Tìm kiếm sự kiện..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-[48px] pl-[44px] pr-[16px] rounded-[14px] bg-[rgba(0,0,0,0.04)] text-[15px] text-[#111] placeholder:text-[#9CA3AF] outline-none border border-transparent focus:border-[rgba(230,0,45,0.25)] focus:bg-white focus:ring-2 focus:ring-[rgba(230,0,45,0.1)] transition-all duration-200"
        />
      </div>

      {/* Event Type Filter */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 mb-4 -mx-4 px-4">
        {eventTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setActiveFilter(type.id)}
            className={cn(
              'flex items-center gap-1.5 px-[14px] py-[7px] rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-200',
              activeFilter === type.id
                ? 'bg-[#E6002D] text-white'
                : 'bg-[rgba(0,0,0,0.04)] text-[#6B7280] hover:bg-[rgba(0,0,0,0.08)]'
            )}
          >
            <span>{type.icon}</span>
            {type.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-ios py-12 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-[#007AFF]/5 mx-auto mb-4 flex items-center justify-center">
              <Calendar size={28} className="text-[#007AFF]/30" />
            </div>
            <p className="text-[15px] font-medium text-[#6B7280]">Chưa có sự kiện nào</p>
            <p className="text-[13px] text-[#9CA3AF] mt-1">Bắt đầu ghi lại những sự kiện trong cuộc sống</p>
            <button className="mt-4 btn-ios-primary px-6 py-3 text-[14px]">
              <Plus size={16} className="mr-2" />
              Thêm sự kiện
            </button>
          </motion.div>
        ) : (
          filteredEvents.map((event, i) => (
            <motion.div
              key={event.EventID}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <EventCard event={event} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
