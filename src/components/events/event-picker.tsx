'use client';

import { useEffect } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';

interface PickerEvent {
  EventID: string;
  Title: string;
  StartDate: string;
}

interface EventPickerProps {
  /** EventID đang chọn */
  value: string | null;
  /** Callback khi user chọn event khác */
  onChange: (eventId: string) => void;
  /** Các event có sẵn để chọn (cha đã sort — event mặc định nằm đầu) */
  events: PickerEvent[];
  /** Đang tải danh sách event */
  loading?: boolean;
}

/**
 * Dropdown chọn sự kiện (Party/đám cưới) ở header.
 * Cha truyền danh sách đã ưu tiên; component tự chọn event đầu tiên khi chưa có value.
 */
export default function EventPicker({ value, onChange, events, loading }: EventPickerProps) {
  useEffect(() => {
    if (!value && events.length > 0) {
      onChange(events[0].EventID);
    }
  }, [value, events, onChange]);

  const current = events.find(e => e.EventID === value);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-white border border-[rgba(0,0,0,0.06)] rounded-[10px] pl-3 pr-2.5 h-[38px] shadow-sm">
        <CalendarDays size={15} className="text-[#E6002D] shrink-0" />
        {loading ? (
          <span className="text-[12.5px] text-[#8E8E93] pr-1">Đang tải...</span>
        ) : (
          <select
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className="appearance-none bg-transparent text-[12.5px] font-semibold text-[#111] outline-none cursor-pointer max-w-[180px] sm:max-w-[260px] truncate"
          >
            {!value && <option value="">Chọn sự kiện...</option>}
            {events.map(ev => (
              <option key={ev.EventID} value={ev.EventID}>{ev.Title}</option>
            ))}
          </select>
        )}
        <ChevronDown size={14} className="text-[#9CA3AF] shrink-0" />
      </div>
      {current && (
        <div className="text-[10.5px] text-[#8E8E93] mt-1 px-1">
          {current.StartDate ? new Date(current.StartDate + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
        </div>
      )}
    </div>
  );
}
