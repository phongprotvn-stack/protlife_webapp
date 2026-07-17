'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, SlidersHorizontal, Users, Filter, RefreshCw } from 'lucide-react';
import { ContactCard } from '@/components/contacts/contact-card';
import { cn } from '@/lib/utils';
import { contactService } from '@/lib/services/contact-service';
import { useAppStore } from '@/stores/app-store';
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
  const [isDesktop, setIsDesktop] = useState(false);
  const setAddModal = useAppStore((s) => s.setAddModal);
  const selectContact = useAppStore((s) => s.selectContact);
  const refreshKey = useAppStore((s) => s.refreshKey);

  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768);
    loadContacts();
  }, [refreshKey]);

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
    <div className="page-content">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[24px] font-bold text-[#111] tracking-tight">Quan hệ</h1>
          <p className="text-[13px] text-[#8E8E93] mt-0.5">{contacts.length} người</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadContacts}
            className="w-[40px] h-[40px] rounded-[12px] bg-[rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-[rgba(0,0,0,0.08)] transition-all"
          >
            <RefreshCw size={16} className="text-[#8E8E93]" />
          </button>
          <button onClick={() => setAddModal('contact')}
            className="w-[40px] h-[40px] rounded-[12px] bg-[#E6002D] text-white flex items-center justify-center shadow-lg active:scale-90 transition-all duration-200">
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none z-10" />
        <input
          type="text"
          placeholder="Tìm kiếm quan hệ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-[44px] pl-[40px] pr-[40px] rounded-[12px] bg-[rgba(0,0,0,0.04)] text-[14px] text-[#111] placeholder:text-[#9CA3AF] outline-none border border-transparent focus:border-[rgba(230,0,45,0.25)] focus:bg-white focus:ring-2 focus:ring-[rgba(230,0,45,0.1)] transition-all duration-200"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 mb-4">
        {relationships.map((rel) => (
          <button
            key={rel.id}
            onClick={() => setActiveFilter(rel.id)}
            className={cn(
              'flex items-center gap-1.5 px-[12px] py-[6px] rounded-full text-[12px] font-medium whitespace-nowrap transition-all duration-200',
              activeFilter === rel.id
                ? 'bg-[#E6002D] text-white'
                : 'bg-[rgba(0,0,0,0.04)] text-[#6B7280] hover:bg-[rgba(0,0,0,0.08)]'
            )}
          >
            {!rel.id && <Filter size={12} />}
            <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: rel.color }} />
            {rel.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center py-16">
          <div className="w-8 h-8 border-2 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin mb-3" />
          <p className="text-[13px] text-[#8E8E93]">Đang tải...</p>
        </div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 text-center"
        >
          <p className="text-[14px] font-medium text-[#E6002D]">{error}</p>
          <button onClick={loadContacts} className="btn-glass-primary mt-4 px-5 py-2 text-[12px]">
            Thử lại
          </button>
        </motion.div>
      ) : filteredContacts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 text-center"
        >
          <div className="w-14 h-14 rounded-full bg-[#E6002D]/5 mx-auto mb-3 flex items-center justify-center">
            <Users size={24} className="text-[#E6002D]/30" />
          </div>
          <p className="text-[14px] font-medium text-[#6B7280]">
            {searchQuery || activeFilter ? 'Không tìm thấy kết quả' : 'Chưa có quan hệ nào'}
          </p>
          <p className="text-[12px] text-[#9CA3AF] mt-1">
            {searchQuery || activeFilter ? 'Thử tìm kiếm khác' : 'Bắt đầu thêm những người quan trọng'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          {filteredContacts.map((contact, i) => (
            <motion.div
              key={contact.ContactID}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
            >
              <ContactCard
                contact={contact}
                onSelect={isDesktop ? selectContact : undefined}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
