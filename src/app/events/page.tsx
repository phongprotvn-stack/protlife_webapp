'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Calendar, Filter, RefreshCw } from 'lucide-react';
import { EventCard } from '@/components/events/event-card';
import { cn } from '@/lib/utils';
import { eventService } from '@/lib/services/event-service';
import type { EventItem } from '@/types/database';

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

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await eventService.getAll();
      setEvents(data);
    } catch (e: any) {
      setError(e.message || 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = events.filter((e) => {
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
          <p className="text-[13px] text-[#8E8E93] mt-0.5">{events.length} sự kiện</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadEvents}
            className="w-[44px] h-[44px] rounded-[14px] bg-[rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-[rgba(0,0,0,0.08)] transition-all"
          >
            <RefreshCw size={18} className="text-[#8E8E93]" />
          </button>
          <button className="w-[44px] h-[44px] rounded-[14px] bg-[#E6002D] text-white flex items-center justify-center shadow-lg active:scale-90 transition-all duration-200"
            style={{ boxShadow: '0 4px 12px rgba(230,0,45,0.3)' }}
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>
        </div>
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

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center py-20">
          <div className="w-10 h-10 border-3 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin mb-4" />
          <p className="text-[14px] text-[#8E8E93]">Đang tải dữ liệu...</p>
        </div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-ios py-12 text-center"
        >
          <p className="text-[15px] font-medium text-[#E6002D]">{error}</p>
          <button onClick={loadEvents} className="mt-4 btn-ios-primary px-6 py-2 text-[13px]">
            Thử lại
          </button>
        </motion.div>
      ) : filteredEvents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-ios py-12 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-[#007AFF]/5 mx-auto mb-4 flex items-center justify-center">
            <Calendar size={28} className="text-[#007AFF]/30" />
          </div>
          <p className="text-[15px] font-medium text-[#6B7280]">
            {searchQuery || activeFilter ? 'Không tìm thấy kết quả' : 'Chưa có sự kiện nào'}
          </p>
          <p className="text-[13px] text-[#9CA3AF] mt-1">
            {searchQuery || activeFilter ? 'Thử tìm kiếm khác' : 'Bắt đầu ghi lại những sự kiện trong cuộc sống'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event, i) => (
            <motion.div
              key={event.EventID}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <EventCard event={event} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
