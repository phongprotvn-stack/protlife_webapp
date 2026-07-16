'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, SlidersHorizontal, Users, Filter } from 'lucide-react';
import { ContactCard } from '@/components/contacts/contact-card';
import { cn } from '@/lib/utils';

// Mock contacts
import type { Contact, Relationship, ContactStatus } from '@/types/database';

const mockContacts: Contact[] = [
  {
    ContactID: 'C0001',
    Name: 'Nguyễn Văn A',
    Relationship: 'Family' as Relationship,
    Gender: 'Male',
    Birthday: '15/03/1985',
    Phone: '0901234567',
    Email: 'vana@gmail.com',
    Organization1: 'Công ty ABC',
    Organization2: '',
    RelationshipScore: 95,
    Status: 'Active' as ContactStatus,
    IsFavorite: true,
    CreatedDate: '2025-01-01',
    UpdatedDate: '2025-06-15',
    Avatar: null,
    Notes: '',
  },
];

const relationships = [
  { id: '', label: 'Tất cả', color: '#8E8E93' },
  { id: 'Family', label: 'Gia đình', color: '#E6002D' },
  { id: 'Relative', label: 'Họ hàng', color: '#FF4D6A' },
  { id: 'Friend', label: 'Bạn bè', color: '#007AFF' },
  { id: 'Colleague', label: 'Đồng nghiệp', color: '#FF9500' },
  { id: 'Neighbor', label: 'Hàng xóm', color: '#34C759' },
  { id: 'Teacher', label: 'Giáo viên', color: '#5856D6' },
  { id: 'Partner', label: 'Người yêu', color: '#AF52DE' },
  { id: 'Other', label: 'Khác', color: '#8E8E93' },
];

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const contacts = mockContacts;

  const filteredContacts = contacts.filter((c) => {
    if (activeFilter && c.Relationship !== activeFilter) return false;
    if (searchQuery && !c.Name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[26px] font-bold text-[#111] tracking-tight">Quan hệ</h1>
          <p className="text-[13px] text-[#8E8E93] mt-0.5">{contacts.length} người</p>
        </div>
        <button className="w-[44px] h-[44px] rounded-[14px] bg-[#E6002D] text-white flex items-center justify-center shadow-lg active:scale-90 transition-all duration-200"
          style={{ boxShadow: '0 4px 12px rgba(230,0,45,0.3)' }}
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={17} className="absolute left-[16px] top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none z-10" />
        <input
          type="text"
          placeholder="Tìm kiếm quan hệ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-[48px] pl-[44px] pr-[44px] rounded-[14px] bg-[rgba(0,0,0,0.04)] text-[15px] text-[#111] placeholder:text-[#9CA3AF] outline-none border border-transparent focus:border-[rgba(230,0,45,0.25)] focus:bg-white focus:ring-2 focus:ring-[rgba(230,0,45,0.1)] transition-all duration-200"
        />
        <button className="absolute right-[12px] top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)]">
          <SlidersHorizontal size={16} className="text-[#8E8E93]" />
        </button>
      </div>

      {/* Relationship Filter Chips */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 mb-4 -mx-4 px-4">
        {relationships.map((rel) => (
          <button
            key={rel.id}
            onClick={() => setActiveFilter(rel.id)}
            className={cn(
              'flex items-center gap-1.5 px-[14px] py-[7px] rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-200',
              activeFilter === rel.id
                ? 'bg-[#E6002D] text-white'
                : 'bg-[rgba(0,0,0,0.04)] text-[#6B7280] hover:bg-[rgba(0,0,0,0.08)]'
            )}
          >
            {!rel.id && <Filter size={14} />}
            <div className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: rel.color }} />
            {rel.label}
          </button>
        ))}
      </div>

      {/* Contacts List */}
      <div className="space-y-3">
        {filteredContacts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-ios py-12 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-[#E6002D]/5 mx-auto mb-4 flex items-center justify-center">
              <Users size={28} className="text-[#E6002D]/30" />
            </div>
            <p className="text-[15px] font-medium text-[#6B7280]">Chưa có quan hệ nào</p>
            <p className="text-[13px] text-[#9CA3AF] mt-1">Bắt đầu thêm những người quan trọng</p>
            <button className="mt-4 btn-ios-primary px-6 py-3 text-[14px]">
              <Plus size={16} className="mr-2" />
              Thêm quan hệ
            </button>
          </motion.div>
        ) : (
          filteredContacts.map((contact, i) => (
            <motion.div
              key={contact.ContactID}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <ContactCard contact={contact} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
