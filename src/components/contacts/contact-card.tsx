'use client';

import { motion } from 'framer-motion';
import { cn, getAvatarColor, getInitials } from '@/lib/utils';
import type { Contact } from '@/types/database';
import { Heart, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { ContactDetail } from '@/components/contacts/contact-detail';

interface ContactCardProps {
  contact: Contact;
  variant?: 'default' | 'compact';
}

export function ContactCard({ contact, variant = 'default' }: ContactCardProps) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const avatarColor = getAvatarColor(contact.Name);

  return (
    <>
      <div
        onClick={() => setDetailId(contact.ContactID)}
        className="card-ios flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all duration-200"
      >
        {/* Avatar */}
        <div
          className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-white font-semibold text-[18px] flex-shrink-0"
          style={{ backgroundColor: avatarColor }}
        >
          {contact.Avatar ? (
            <img src={contact.Avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            getInitials(contact.Name)
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-semibold text-[#111] truncate">
              {contact.Name}
            </h3>
            {contact.IsFavorite && (
              <Heart size={14} className="text-[#E6002D] fill-[#E6002D] flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[12px] text-[#8E8E93]">{contact.Relationship}</span>
            <span className="text-[#D1D5DB]">·</span>
            <div className="flex items-center gap-1">
              <div
                className="w-[6px] h-[6px] rounded-full"
                style={{
                  backgroundColor:
                    contact.RelationshipScore >= 80 ? '#34C759' : contact.RelationshipScore >= 50 ? '#FF9500' : '#FF3B30',
                }}
              />
              <span className="text-[12px] text-[#8E8E93]">{contact.RelationshipScore} điểm</span>
            </div>
          </div>
        </div>

        {/* Status indicator & chevron */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-[8px] h-[8px] rounded-full',
              contact.Status === 'Active' && 'bg-[#34C759]',
              contact.Status === 'Lost Contact' && 'bg-[#FF9500]',
              contact.Status === 'Deceased' && 'bg-[#8E8E93]',
              contact.Status === 'Blocked' && 'bg-[#FF3B30]'
            )}
          />
          <ChevronRight size={16} className="text-[#D1D5DB]" />
        </div>
      </div>

      <ContactDetail contactId={detailId} onClose={() => setDetailId(null)} />
    </>
  );
}
