'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '@/components/shared/modal';
import { eventService } from '@/lib/services/event-service';
import type { EventItem } from '@/types/database';
import { formatDate, getMoodEmoji, getImportanceColor } from '@/lib/utils';
import { Calendar, MapPin, DollarSign, Users, FileText, Clock, Tag, Heart } from 'lucide-react';

interface Props {
  eventId: string | null;
  onClose: () => void;
}

export function EventDetail({ eventId, onClose }: Props) {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    eventService.getById(eventId).then((data) => {
      setEvent(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [eventId]);

  if (!eventId) return null;

  return (
    <Modal open={!!eventId} onClose={onClose} title="" maxWidth="420px">
      {loading ? (
        <div className="flex flex-col items-center py-12">
          <div className="w-8 h-8 border-2 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin mb-3" />
          <p className="text-[13px] text-[#8E8E93]">Đang tải...</p>
        </div>
      ) : event ? (
        <div>
          {/* Header */}
          <div className="text-center mb-6">
            {/* Date badge */}
            <div className="w-[60px] h-[68px] rounded-[16px] bg-[#E6002D]/10 mx-auto mb-3 flex flex-col items-center justify-center">
              <span className="text-[24px] font-bold text-[#E6002D] leading-none">
                {new Date(event.StartDate).getDate()}
              </span>
              <span className="text-[10px] font-medium text-[#E6002D]/70 mt-0.5">
                {new Date(event.StartDate).toLocaleDateString('vi-VN', { month: 'short' })}
              </span>
            </div>
            <h2 className="text-[20px] font-bold text-[#111]">{event.Title}</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-[12px] px-[10px] py-[3px] rounded-full bg-[rgba(0,0,0,0.04)] text-[#6B7280] font-medium">
                {event.EventType}
              </span>
              {event.Mood && (
                <span className="text-[18px]">{getMoodEmoji(event.Mood)}</span>
              )}
              {event.Importance && (
                <span className="text-[11px] font-semibold" style={{ color: getImportanceColor(event.Importance) }}>
                  ● {event.Importance}
                </span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            {/* Full date */}
            <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
              <Calendar size={16} className="text-[#007AFF]" />
              <div className="flex-1">
                <span className="text-[14px] text-[#111]">{formatDate(event.StartDate, 'ddmmyyyy')}</span>
                {event.EndDate && (
                  <span className="text-[13px] text-[#8E8E93] ml-1">→ {formatDate(event.EndDate, 'ddmmyyyy')}</span>
                )}
              </div>
            </div>

            {/* Place */}
            {event.Place && (
              <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                <MapPin size={16} className="text-[#FF9500]" />
                <span className="text-[14px] text-[#111]">{event.Place}</span>
              </div>
            )}

            {/* Life Stage */}
            {event.LifeStage && (
              <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                <Tag size={16} className="text-[#5856D6]" />
                <span className="text-[14px] text-[#111]">{event.LifeStage}</span>
              </div>
            )}

            {/* Participants */}
            {event.ParticipantCount > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                <Users size={16} className="text-[#34C759]" />
                <span className="text-[14px] text-[#111]">{event.ParticipantCount} người tham gia</span>
              </div>
            )}

            {/* Cost */}
            {event.Cost > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                <DollarSign size={16} className="text-[#FF4D6A]" />
                <span className="text-[14px] text-[#111]">{event.Cost.toLocaleString('vi-VN')}₫</span>
              </div>
            )}

            {/* Created */}
            <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
              <Clock size={16} className="text-[#8E8E93]" />
              <span className="text-[14px] text-[#111]">Tạo ngày {formatDate(event.CreatedDate, 'ddmmyyyy')}</span>
            </div>
          </div>

          {/* Notes */}
          {event.Notes && (
            <div className="mt-4 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
              <p className="text-[12px] font-medium text-[#8E8E93] mb-1 flex items-center gap-1">
                <FileText size={13} /> Ghi chú
              </p>
              <p className="text-[14px] text-[#111] whitespace-pre-wrap">{event.Notes}</p>
            </div>
          )}

          {/* Source */}
          {event.Source && (
            <div className="mt-5 text-center">
              <span className="text-[11px] text-[#B0B0B8] font-medium">Nguồn: {event.Source}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-[#8E8E93] py-8">Không tìm thấy</p>
      )}
    </Modal>
  );
}
