'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '@/components/shared/modal';
import { contactService } from '@/lib/services/contact-service';
import type { Contact } from '@/types/database';
import { formatDate, getAvatarColor, getInitials, calculateAge, getRelationshipLabel, getRelationshipColor } from '@/lib/utils';
import { Heart, Phone, Mail, Building2, Cake, Users, ChevronRight, MapPin, Calendar, Award } from 'lucide-react';

interface Props {
  contactId: string | null;
  onClose: () => void;
}

export function ContactDetail({ contactId, onClose }: Props) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contactId) return;
    setLoading(true);
    contactService.getById(contactId).then((data) => {
      setContact(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [contactId]);

  if (!contactId) return null;

  return (
    <Modal open={!!contactId} onClose={onClose} title="" maxWidth="420px">
      {loading ? (
        <div className="flex flex-col items-center py-12">
          <div className="w-8 h-8 border-2 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin mb-3" />
          <p className="text-[13px] text-[#8E8E93]">Đang tải...</p>
        </div>
      ) : contact ? (
        <div>
          {/* Avatar + Name */}
          <div className="text-center mb-6">
            <div
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white font-bold text-[28px] mx-auto mb-3"
              style={{ backgroundColor: getAvatarColor(contact.Name) }}
            >
              {getInitials(contact.Name)}
            </div>
            <h2 className="text-[20px] font-bold text-[#111]">{contact.Name}</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-[13px] text-[#6B7280]">{contact.Relationship}</span>
              <span className="w-[4px] h-[4px] rounded-full bg-[#D1D5DB]" />
              <span className="text-[12px] font-medium" style={{ color: getRelationshipColor(contact.RelationshipScore) }}>
                {getRelationshipLabel(contact.RelationshipScore)}
              </span>
              {contact.IsFavorite && <Heart size={14} className="text-[#E6002D] fill-[#E6002D]" />}
            </div>
          </div>

          {/* Info rows */}
          <div className="space-y-3">
            {contact.Birthday && (
              <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                <Cake size={16} className="text-[#FF9500]" />
                <span className="text-[14px] text-[#111]">{formatDate(contact.Birthday, 'ddmmyyyy')}</span>
                <span className="text-[12px] text-[#8E8E93]">({calculateAge(contact.Birthday)} tuổi)</span>
              </div>
            )}
            {contact.Phone && (
              <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                <Phone size={16} className="text-[#34C759]" />
                <span className="text-[14px] text-[#111]">{contact.Phone}</span>
              </div>
            )}
            {contact.Email && (
              <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                <Mail size={16} className="text-[#007AFF]" />
                <span className="text-[14px] text-[#111]">{contact.Email}</span>
              </div>
            )}
            {contact.Organization1 && (
              <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                <Building2 size={16} className="text-[#5856D6]" />
                <span className="text-[14px] text-[#111]">{contact.Organization1}{contact.Organization2 ? ` · ${contact.Organization2}` : ''}</span>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
              <Award size={16} className="text-[#E6002D]" />
              <span className="text-[14px] text-[#111]">Mức độ thân thiết: <strong>{contact.RelationshipScore}/100</strong></span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
              <Calendar size={16} className="text-[#8E8E93]" />
              <span className="text-[14px] text-[#111]">Thêm ngày {formatDate(contact.CreatedDate, 'ddmmyyyy')}</span>
            </div>
          </div>

          {/* Notes */}
          {contact.Notes && (
            <div className="mt-4 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
              <p className="text-[12px] font-medium text-[#8E8E93] mb-1">Ghi chú</p>
              <p className="text-[14px] text-[#111] whitespace-pre-wrap">{contact.Notes}</p>
            </div>
          )}

          {/* Status badge */}
          <div className="mt-5 flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${contact.Status === 'Active' ? 'bg-[#34C759]' : contact.Status === 'Lost Contact' ? 'bg-[#FF9500]' : 'bg-[#8E8E93]'}`} />
            <span className="text-[12px] text-[#8E8E93] font-medium">{contact.Status}</span>
          </div>
        </div>
      ) : (
        <p className="text-center text-[#8E8E93] py-8">Không tìm thấy</p>
      )}
    </Modal>
  );
}
