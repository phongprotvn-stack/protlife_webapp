'use client';

import { X, Calendar, MapPin, Phone, Star } from 'lucide-react';
import { getAvatarColor, getInitials, formatDate } from '@/lib/utils';
import type { DashboardPanelContact } from '@/stores/app-store';

// Map relationship types to colors
const RELATION_COLORS: Record<string, string> = {
  'Family': '#E6002D',
  'Relatives': '#FF4D6A',
  'Friend': '#FF9500',
  'Colleague': '#007AFF',
  'Neighbor': '#34C759',
  'Teacher': '#AF52DE',
  'Lover': '#FF2D55',
  'Other': '#8E8E93',
};
const RELATION_LABELS: Record<string, string> = {
  'Family': 'Gia đình',
  'Relatives': 'Họ hàng',
  'Friend': 'Bạn bè',
  'Colleague': 'Đồng nghiệp',
  'Neighbor': 'Hàng xóm',
  'Teacher': 'Giáo viên',
  'Lover': 'Người yêu',
  'Other': 'Khác',
};

interface Props {
  data: DashboardPanelContact;
  onClose: () => void;
}

export function DashboardContactPanel({ data, onClose }: Props) {
  const { contact, lastEventName, lastEventDate, lastEventLocation, phone } = data;

  return (
    <div className="p-5">
      {/* Header with close button */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]">
          <X size={15} />
        </button>
        <div className="flex-1" />
      </div>

      {/* Avatar + Name + Relationship */}
      <div className="text-center mb-6">
        <div
          className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white font-bold text-[26px] mx-auto mb-3 overflow-hidden"
          style={{ backgroundColor: contact.Avatar ? 'transparent' : getAvatarColor(contact.Name) }}
        >
          {contact.Avatar ? (
            <img src={contact.Avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            getInitials(contact.Name)
          )}
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <h2 className="text-[17px] font-bold text-[#111]">{contact.Name}</h2>
          {contact.IsFavorite && <Star size={14} className="text-[#FF9500] fill-[#FF9500]" />}
        </div>
        {contact.Relationship && (
          <span
            className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium"
            style={{
              backgroundColor: (RELATION_COLORS[contact.Relationship] || '#8E8E93') + '18',
              color: RELATION_COLORS[contact.Relationship] || '#8E8E93',
            }}
          >
            {RELATION_LABELS[contact.Relationship] || contact.Relationship}
          </span>
        )}

        {/* Relationship Score Bar */}
        <div className="mt-3 max-w-[200px] mx-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[#8E8E93]">Mức độ quan hệ</span>
            <span className="text-[10px] font-semibold" style={{
              color: (contact.RelationshipScore || 0) >= 70 ? '#34C759' : (contact.RelationshipScore || 0) >= 40 ? '#FF9500' : '#FF3B30'
            }}>
              {contact.RelationshipScore || 0}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[rgba(0,0,0,0.06)] overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{
              width: `${contact.RelationshipScore || 0}%`,
              backgroundColor: (contact.RelationshipScore || 0) >= 70 ? '#34C759' : (contact.RelationshipScore || 0) >= 40 ? '#FF9500' : '#FF3B30'
            }} />
          </div>
        </div>
      </div>

      {/* Info rows */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
          <div className="w-[32px] h-[32px] rounded-[8px] bg-[rgba(0,122,255,0.08)] flex items-center justify-center shrink-0">
            <Calendar size={14} className="text-[#007AFF]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-[#8E8E93] uppercase tracking-wider">Sự kiện gần nhất</p>
            <p className="text-[13px] font-medium text-[#111] truncate">
              {lastEventName ? `${lastEventName} • ${formatDate(lastEventDate, 'ddmmyyyy')}` : 'Chưa có sự kiện'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
          <div className="w-[32px] h-[32px] rounded-[8px] bg-[rgba(255,149,0,0.08)] flex items-center justify-center shrink-0">
            <MapPin size={14} className="text-[#FF9500]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-[#8E8E93] uppercase tracking-wider">Địa điểm</p>
            <p className="text-[13px] font-medium text-[#111] truncate">
              {lastEventLocation || 'Chưa có thông tin'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
          <div className="w-[32px] h-[32px] rounded-[8px] bg-[rgba(52,199,89,0.08)] flex items-center justify-center shrink-0">
            <Phone size={14} className="text-[#34C759]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-[#8E8E93] uppercase tracking-wider">Số điện thoại</p>
            <p className="text-[13px] font-medium text-[#111] truncate">
              {phone || 'Chưa có thông tin'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
