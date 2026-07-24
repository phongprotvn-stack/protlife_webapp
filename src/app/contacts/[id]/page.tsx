'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { contactService } from '@/lib/services/contact-service';
import { formatDate } from '@/lib/utils';
import type { Contact } from '@/types/database';
import { ArrowLeft, Calendar, Phone, Mail, Building2, Star, Heart, AlertTriangle, User, Flag } from 'lucide-react';

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params?.id) {
      loadContact(params.id as string);
    }
  }, [params?.id]);

  async function loadContact(id: string) {
    setLoading(true);
    setError('');
    try {
      const data = await contactService.getById(id);
      setContact(data);
    } catch (e: any) {
      setError(e?.message || 'Không thể tải thông tin liên hệ');
    } finally {
      setLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    Active: '#10B981',
    'Lost Contact': '#F59E0B',
    Deceased: '#6B7280',
    Blocked: '#EF4444',
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center py-20">
          <div className="w-12 h-12 border-3 border-[rgba(var(--color-primary-rgb),.2)] border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-4" />
          <div className="text-[14px] text-[#6B7280]">Đang tải thông tin...</div>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] mb-6 hover:text-[var(--color-primary)] transition-colors cursor-pointer">
          <ArrowLeft size={16} /> Quay lại
        </button>
        <div className="text-center py-20">
          <AlertTriangle size={36} className="text-[#E6002D] mx-auto mb-3" />
          <p className="text-[14px] text-[#6B7280]">Không tìm thấy liên hệ</p>
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

      {/* Profile header */}
      <div className="bg-white border border-[#EDEDF1] rounded-[18px] p-6 shadow-[0_8px_28px_rgba(0,0,0,.05)] mb-4">
        <div className="flex items-center gap-4 mb-5">
          {/* Avatar */}
          <div className="w-[64px] h-[64px] rounded-full bg-[#E6002D]/10 flex items-center justify-center text-[26px] font-extrabold text-[#E6002D] shrink-0 overflow-hidden">
            {contact.Avatar ? (
              <img src={contact.Avatar} alt={contact.Name} className="w-full h-full object-cover" />
            ) : (
              contact.Name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[22px] font-extrabold tracking-[-.3px] mb-1">{contact.Name}</h1>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-[#6B7280]">{contact.Relationship}</span>
              {contact.IsFavorite && <Heart size={14} className="text-[#E6002D] fill-[#E6002D]" />}
            </div>
          </div>
          {/* Status badge */}
          <span className="px-3 py-1 rounded-[8px] text-[11px] font-bold text-white" style={{
            background: statusColors[contact.Status] || '#6B7280',
          }}>{contact.Status === 'Active' ? 'Đang liên lạc' :
             contact.Status === 'Lost Contact' ? 'Mất liên lạc' :
             contact.Status === 'Deceased' ? 'Đã mất' : 'Đã chặn'}</span>
        </div>

        <div className="space-y-3 text-[13px]">
          {/* Gender */}
          {contact.Gender && (
            <div className="flex items-center gap-3">
              <User size={16} className="text-[#6B7280] shrink-0" />
              <span>{contact.Gender === 'Male' ? 'Nam' : contact.Gender === 'Female' ? 'Nữ' : 'Khác'}</span>
            </div>
          )}

          {/* Birthday */}
          {contact.Birthday && (
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-[#6B7280] shrink-0" />
              <span>{formatDate(contact.Birthday, 'ddmmyyyy')}</span>
            </div>
          )}

          {/* Phone */}
          {contact.Phone && (
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-[#6B7280] shrink-0" />
              <a href={`tel:${contact.Phone}`} className="text-[var(--color-primary)] hover:underline font-semibold">{contact.Phone}</a>
            </div>
          )}

          {/* Email */}
          {contact.Email && (
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-[#6B7280] shrink-0" />
              <a href={`mailto:${contact.Email}`} className="text-[var(--color-primary)] hover:underline font-semibold break-all">{contact.Email}</a>
            </div>
          )}

          {/* Organization 1 */}
          {contact.Organization1 && (
            <div className="flex items-center gap-3">
              <Building2 size={16} className="text-[#6B7280] shrink-0" />
              <span>{contact.Organization1}</span>
            </div>
          )}

          {/* Organization 2 */}
          {contact.Organization2 && (
            <div className="flex items-center gap-3">
              <Building2 size={16} className="text-[#6B7280] shrink-0" />
              <span className="text-[#6B7280]">{contact.Organization2}</span>
            </div>
          )}

          {/* Relationship Score */}
          <div className="flex items-center gap-3">
            <Star size={16} className="text-[#6B7280] shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="font-semibold">Mức độ thân thiết</span>
                <span className="font-bold" style={{ color: 'var(--color-primary)' }}>{contact.RelationshipScore}/10</span>
              </div>
              <div className="w-full h-[6px] rounded-[3px] bg-[#F1F1F4] overflow-hidden">
                <div className="h-full rounded-[3px]" style={{
                  width: `${(contact.RelationshipScore / 10) * 100}%`,
                  background: 'linear-gradient(90deg, #D60032 0%, #FF4B3A 55%, #FF6A3D 100%)',
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {contact.Notes && (
        <div className="bg-white border border-[#EDEDF1] rounded-[18px] p-6 shadow-[0_8px_28px_rgba(0,0,0,.05)] mb-4">
          <h3 className="text-[14.5px] font-extrabold mb-3">Ghi chú</h3>
          <p className="text-[13px] text-[#374151] leading-relaxed whitespace-pre-wrap">{contact.Notes}</p>
        </div>
      )}

      {/* Meta info */}
      <div className="bg-white border border-[#EDEDF1] rounded-[18px] p-6 shadow-[0_8px_28px_rgba(0,0,0,.05)]">
        <h3 className="text-[14.5px] font-extrabold mb-3">Thông tin thêm</h3>
        <div className="grid grid-cols-2 gap-y-2 text-[12px]">
          <span className="text-[#6B7280]">ID</span>
          <span className="font-semibold text-right">{contact.ContactID}</span>
          <span className="text-[#6B7280]">Ngày tạo</span>
          <span className="font-semibold text-right">{formatDate(contact.CreatedDate, 'ddmmyyyy')}</span>
          <span className="text-[#6B7280]">Cập nhật</span>
          <span className="font-semibold text-right">{formatDate(contact.UpdatedDate, 'ddmmyyyy')}</span>
        </div>
      </div>
    </div>
  );
}
