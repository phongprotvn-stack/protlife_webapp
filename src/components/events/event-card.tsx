'use client';

import { motion } from 'framer-motion';
import { cn, formatDate, getMoodEmoji, getImportanceColor } from '@/lib/utils';
import type { EventItem } from '@/types/database';
import { Calendar, MapPin, Users, DollarSign, ChevronRight } from 'lucide-react';

interface EventCardProps {
  event: EventItem;
  variant?: 'default' | 'compact';
}

export function EventCard({ event, variant = 'default' }: EventCardProps) {
  const eventDate = new Date(event.StartDate);
  const day = eventDate.getDate();
  const month = eventDate.toLocaleDateString('vi-VN', { month: 'short' });

  return (
    <div className="card-ios flex items-start gap-4 cursor-pointer active:scale-[0.98] transition-all duration-200">
      {/* Date Badge */}
      <div className="w-[52px] h-[60px] rounded-[14px] bg-[#E6002D]/5 flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-[20px] font-bold text-[#E6002D] leading-none">{day}</span>
        <span className="text-[10px] font-medium text-[#E6002D]/70 mt-1">{month}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-semibold text-[#111] truncate">
            {event.Title}
          </h3>
          {event.Mood && (
            <span className="text-[16px] flex-shrink-0">{getMoodEmoji(event.Mood)}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <span className="text-[11px] px-[8px] py-[2px] rounded-full bg-[rgba(0,0,0,0.04)] text-[#6B7280] font-medium">
            {event.EventType}
          </span>
          {event.Importance && (
            <span
              className="text-[11px] font-medium"
              style={{ color: getImportanceColor(event.Importance) }}
            >
              {event.Importance}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-[12px] text-[#8E8E93]">
          {event.Place && (
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {event.Place}
            </span>
          )}
          {event.Cost > 0 && (
            <span className="flex items-center gap-1">
              <DollarSign size={12} />
              {event.Cost.toLocaleString('vi-VN')}₫
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={16} className="text-[#D1D5DB] mt-3" />
    </div>
  );
}
