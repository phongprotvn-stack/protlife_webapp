'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, SlidersHorizontal, Users, Filter, RefreshCw } from 'lucide-react';
import { ContactCard } from '@/components/contacts/contact-card';
import { cn } from '@/lib/utils';
import { contactService } from '@/lib/services/contact-service';
import type { Contact } from '@/types/database';

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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await contactService.getAll();
      setContacts(data);
    } catch (e: any) {
      setError(e.message || 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="flex items-center gap-2">
          <button
            onClick={loadContacts}
            className="w-[44px] h-[44px] rounded-[14px] bg-[rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-[rgba(0,0,0,0.08)] transition-all"
          >
            <RefreshCw size={18} className="text-[#8E8E93]" />
          </button>
          <button className="w-[44px] h-[44px] rounded-[14px] bg-[#E6002D] text-white flex items-center justify-center shadow-lg active:scale-90 transition-all duration-200"
            style={{ boxShadow: '0 4px 12px rgba(230,0,45,0.3)' }}
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>
        </div>
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

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center py-20">
          <div className="w-10 h-10 border-3 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin mb-4" />
          <p className="text-[14px] text-[#8E8E93]">Đang tải dữ liệu...</p>
        </div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-ios py-12 text-center"
        >
          <p className="text-[15px] font-medium text-[#E6002D]">{error}</p>
          <button onClick={loadContacts} className="mt-4 btn-ios-primary px-6 py-2 text-[13px]">
            Thử lại
          </button>
        </motion.div>
      ) : filteredContacts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-ios py-12 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-[#E6002D]/5 mx-auto mb-4 flex items-center justify-center">
            <Users size={28} className="text-[#E6002D]/30" />
          </div>
          <p className="text-[15px] font-medium text-[#6B7280]">
            {searchQuery || activeFilter ? 'Không tìm thấy kết quả' : 'Chưa có quan hệ nào'}
          </p>
          <p className="text-[13px] text-[#9CA3AF] mt-1">
            {searchQuery || activeFilter ? 'Thử tìm kiếm khác' : 'Bắt đầu thêm những người quan trọng'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredContacts.map((contact, i) => (
            <motion.div
              key={contact.ContactID}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <ContactCard contact={contact} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
