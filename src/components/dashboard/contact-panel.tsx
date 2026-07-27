'use client';

import { X, Calendar, MapPin, Phone, Heart } from 'lucide-react';
import { getAvatarColor, getInitials, formatDate } from '@/lib/utils';
import type { DashboardPanelContact } from '@/stores/app-store';

// Map relationship types to colors
const RELATION_COLORS: Record<string, string> = {
  'Family': '#E6002D',
  'Relative': '#FF4D6A',
  'Friend': '#FF9500',
  'Colleague': '#007AFF',
  'Neighbor': '#34C759',
  'Teacher': '#AF52DE',
  'Lover': '#FF2D55',
  'Other': '#8E8E93',
};
const RELATION_LABELS: Record<string, string> = {
  'Family': 'Gia đình',
  'Relative': 'Họ hàng',
  'Friend': 'Bạn bè',
  'Colleague': 'Đồng nghiệp',
  'Neighbor': 'Hàng xóm',
  'Teacher': 'Giáo viên',
  'Lover': 'Người yêu',
  'Other': 'Khác',
};

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Ruột thịt';
  if (score >= 70) return 'Thâm tình';
  if (score >= 50) return 'Thân';
  if (score >= 30) return 'Bạn bè';
  if (score >= 1) return 'Quen biết';
  return 'Chưa xác định';
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#E6002D';
  if (score >= 70) return '#FF4D6A';
  if (score >= 50) return '#FF9500';
  if (score >= 30) return '#007AFF';
  return '#8E8E93';
}

interface Props {
  data: DashboardPanelContact;
  onClose: () => void;
}

export function DashboardContactPanel({ data, onClose }: Props) {
  const { contact, lastEventDate, lastEventLocation, phone } = data;

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
          {contact.IsFavorite && <Heart size={14} className="text-[#FF2D55] fill-[#FF2D55]" />}
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

        {/* Score Label */}
        <div className="mt-3">
          <span className="text-[13px] font-semibold" style={{
            color: getScoreColor(contact.RelationshipScore || 0),
          }}>
            {getScoreLabel(contact.RelationshipScore || 0)}
          </span>
        </div>
      </div>

      {/* Info rows */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
          <div className="w-[32px] h-[32px] rounded-[8px] bg-[rgba(0,122,255,0.08)] flex items-center justify-center shrink-0 mt-0.5">
            <Calendar size={14} className="text-[#007AFF]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-[#8E8E93] uppercase tracking-wider">Sự kiện gần nhất</p>
            <p className="text-[13px] font-medium text-[#111]">
              {lastEventDate ? formatDate(lastEventDate, 'ddmmyyyy') : 'Chưa có sự kiện'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
          <div className="w-[32px] h-[32px] rounded-[8px] bg-[rgba(255,149,0,0.08)] flex items-center justify-center shrink-0 mt-0.5">
            <MapPin size={14} className="text-[#FF9500]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-[#8E8E93] uppercase tracking-wider">Địa điểm</p>
            <p className="text-[13px] font-medium text-[#111] whitespace-pre-wrap break-words">
              {lastEventLocation || 'Chưa có thông tin'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
          <div className="w-[32px] h-[32px] rounded-[8px] bg-[rgba(52,199,89,0.08)] flex items-center justify-center shrink-0 mt-0.5">
            <Phone size={14} className="text-[#34C759]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-[#8E8E93] uppercase tracking-wider">Số điện thoại</p>
            <p className="text-[13px] font-medium text-[#111] break-words">
              {phone || 'Chưa có thông tin'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
