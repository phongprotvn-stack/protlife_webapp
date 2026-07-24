'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { eventService } from '@/lib/services/event-service';
import { formatDate, getMoodEmoji, getImportanceColor, formatVND } from '@/lib/utils';
import type { EventItem } from '@/types/database';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Clock, Tag, Smile, AlertTriangle } from 'lucide-react';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params?.id) {
      loadEvent(params.id as string);
    }
  }, [params?.id]);

  async function loadEvent(id: string) {
    setLoading(true);
    setError('');
    try {
      const data = await eventService.getById(id);
      setEvent(data);
    } catch (e: any) {
      setError(e?.message || 'Không thể tải sự kiện');
    } finally {
      setLoading(false);
    }
  }

  const eventTypes: Record<string, string> = {
    Meeting: '🤝 Gặp gỡ', Birthday: '🎂 Sinh nhật', Travel: '✈️ Du lịch',
    Work: '💼 Công việc', Sport: '⚽ Thể thao', Hospital: '🏥 Bệnh viện',
    Meal: '🍽️ Ăn uống', Call: '📞 Gọi điện', Shopping: '🛒 Mua sắm',
    Study: '📚 Học tập', Party: '🎉 Tiệc', Date: '💑 Hẹn hò',
    Entertainment: '🎮 Giải trí', Other: '📌 Khác',
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center py-20">
          <div className="w-12 h-12 border-3 border-[rgba(var(--color-primary-rgb),.2)] border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-4" />
          <div className="text-[14px] text-[#6B7280]">Đang tải sự kiện...</div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] mb-6 hover:text-[var(--color-primary)] transition-colors cursor-pointer">
          <ArrowLeft size={16} /> Quay lại
        </button>
        <div className="text-center py-20">
          <AlertTriangle size={36} className="text-[#E6002D] mx-auto mb-3" />
          <p className="text-[14px] text-[#6B7280]">Không tìm thấy sự kiện</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Back button */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] mb-5 hover:text-[var(--color-primary)] transition-colors cursor-pointer">
        <ArrowLeft size={16} /> Quay lại
      </button>

      {/* Header */}
      <div className="bg-white border border-[#EDEDF1] rounded-[18px] p-6 shadow-[0_8px_28px_rgba(0,0,0,.05)] mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-[22px] font-extrabold tracking-[-.3px] mb-1">{event.Title}</h1>
            <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
              <Tag size={13} />
              <span>{eventTypes[event.EventType] || event.EventType}</span>
            </div>
          </div>
          {/* Importance badge */}
          <span className="px-3 py-1 rounded-[8px] text-[11px] font-bold" style={{
            background: getImportanceColor(event.Importance) + '18',
            color: getImportanceColor(event.Importance),
          }}>{event.Importance}</span>
        </div>

        <div className="space-y-3 text-[13px]">
          {/* Date */}
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-[#6B7280] shrink-0" />
            <div>
              <span className="font-semibold">{formatDate(event.StartDate, 'long')}</span>
              {event.EndDate && <span className="text-[#6B7280]"> → {formatDate(event.EndDate, 'long')}</span>}
            </div>
          </div>

          {/* Place */}
          {event.Place && (
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-[#6B7280] shrink-0" />
              <span>{event.Place}</span>
            </div>
          )}

          {/* Mood */}
          {event.Mood && (
            <div className="flex items-center gap-3">
              <Smile size={16} className="text-[#6B7280] shrink-0" />
              <span>{getMoodEmoji(event.Mood)} {event.Mood}</span>
            </div>
          )}

          {/* Participants */}
          {event.ParticipantCount > 0 && (
            <div className="flex items-center gap-3">
              <Users size={16} className="text-[#6B7280] shrink-0" />
              <span>{event.ParticipantCount} người tham gia</span>
            </div>
          )}

          {/* Cost */}
          {event.Cost > 0 && (
            <div className="flex items-center gap-3">
              <DollarSign size={16} className="text-[#6B7280] shrink-0" />
              <span>{formatVND(event.Cost)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {event.Notes && (
        <div className="bg-white border border-[#EDEDF1] rounded-[18px] p-6 shadow-[0_8px_28px_rgba(0,0,0,.05)] mb-4">
          <h3 className="text-[14.5px] font-extrabold mb-3">Ghi chú</h3>
          <p className="text-[13px] text-[#374151] leading-relaxed whitespace-pre-wrap">{event.Notes}</p>
        </div>
      )}

      {/* Meta info */}
      <div className="bg-white border border-[#EDEDF1] rounded-[18px] p-6 shadow-[0_8px_28px_rgba(0,0,0,.05)]">
        <h3 className="text-[14.5px] font-extrabold mb-3">Thông tin thêm</h3>
        <div className="grid grid-cols-2 gap-y-2 text-[12px]">
          <span className="text-[#6B7280]">ID</span>
          <span className="font-semibold text-right">{event.EventID}</span>
          <span className="text-[#6B7280]">Ngày tạo</span>
          <span className="font-semibold text-right">{formatDate(event.CreatedDate, 'ddmmyyyy')}</span>
          <span className="text-[#6B7280]">Cập nhật</span>
          <span className="font-semibold text-right">{formatDate(event.UpdatedDate, 'ddmmyyyy')}</span>
        </div>
      </div>
    </div>
  );
}
