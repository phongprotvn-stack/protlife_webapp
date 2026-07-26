'use client';

import { Component, useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Users, RefreshCw, ChevronLeft, ChevronRight, Heart, ArrowUpDown, ArrowRight } from 'lucide-react';
import { ContactCard } from '@/components/contacts/contact-card';
import { contactService } from '@/lib/services/contact-service';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import type { Contact } from '@/types/database';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 10;

const RELATIONSHIPS = [
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

type SortField = 'Name' | 'Relationship' | 'RelationshipScore' | 'Birthday' | 'Status';
type SortDir = 'asc' | 'desc';

// Error boundary to catch rendering crashes gracefully
class ContactsErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; errorMsg: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error.message || 'Lỗi không xác định' };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ContactsPage] Rendering error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="page-content min-h-[80vh] flex flex-col items-center justify-center">
          <div className="glass-card p-8 text-center max-w-sm">
            <div className="w-12 h-12 rounded-full bg-[rgba(230,0,45,0.1)] mx-auto mb-3 flex items-center justify-center">
              <Users size={22} className="text-[#E6002D]" />
            </div>
            <p className="text-[14px] font-semibold text-[#111] mb-1">Không thể tải trang</p>
            <p className="text-[12px] text-[#8E8E93] mb-4">Đã xảy ra lỗi khi hiển thị dữ liệu. Hãy thử làm mới trang.</p>
            <p className="text-[11px] text-[rgba(230,0,45,0.6)] mb-4 bg-[rgba(230,0,45,0.04)] p-2 rounded-[6px]">{this.state.errorMsg}</p>
            <button onClick={() => window.location.reload()}
              className="px-5 py-2 rounded-[10px] text-[12px] font-medium text-white bg-[#E6002D] hover:bg-[#D40028] transition-all">
              Làm mới trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ContactsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [isDesktop, setIsDesktop] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('Name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const setAddModal = useAppStore((s) => s.setAddModal);
  const selectContact = useAppStore((s) => s.selectContact);
  const refreshKey = useAppStore((s) => s.refreshKey);
  const user = useAuthStore((s) => s.user);

  const { data: contacts = [], isLoading, error, refetch } = useQuery({
    queryKey: ['contacts', refreshKey],
    queryFn: async () => {
      const data = await contactService.getAll();
      return data;
    },
    staleTime: 60_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1500 * attempt, 5000),
    refetchOnWindowFocus: true,
  });

  const loadError = error ? (error as Error).message || 'Không thể tải dữ liệu' : '';

  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768);
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Filtered + sorted contacts
  const processedContacts = useMemo(() => {
    let filtered = contacts.filter((c) => {
      if (activeFilter && c.Relationship !== activeFilter) return false;
      if (searchQuery && (!c.Name || !c.Name.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
      return true;
    });

    // Sort with null-safe fields
    filtered.sort((a, b) => {
      let cmp = 0;
      const nameA = a.Name || '';
      const nameB = b.Name || '';
      const relA = a.Relationship || '';
      const relB = b.Relationship || '';
      const scoreA = a.RelationshipScore || 0;
      const scoreB = b.RelationshipScore || 0;
      const bdayA = a.Birthday || '';
      const bdayB = b.Birthday || '';
      const statusA = a.Status || '';
      const statusB = b.Status || '';
      if (sortField === 'Name') cmp = nameA.localeCompare(nameB);
      else if (sortField === 'Relationship') cmp = relA.localeCompare(relB);
      else if (sortField === 'RelationshipScore') cmp = scoreA - scoreB;
      else if (sortField === 'Birthday') cmp = bdayA.localeCompare(bdayB);
      else if (sortField === 'Status') cmp = statusA.localeCompare(statusB);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [contacts, activeFilter, searchQuery, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processedContacts.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedContacts = processedContacts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const getStatusDot = (status?: string) => {
    if (!status || status === 'Active') return '#34C759';
    if (status === 'Lost Contact') return '#FF9500';
    if (status === 'Deceased') return '#8E8E93';
    return '#FF3B30';
  };
  const getStatusLabel = (status?: string) => {
    if (!status || status === 'Active') return 'Đang liên lạc';
    if (status === 'Lost Contact') return 'Mất liên lạc';
    if (status === 'Deceased') return 'Đã mất';
    if (status === 'Blocked') return 'Chặn';
    return status;
  };

  const pageContent = (
    <>
      {/* ── Mobile ── */}
      {!isDesktop && (
        <div className="page-content">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-[22px] font-bold text-[#111] tracking-tight">Quan hệ</h1>
              <p className="text-[12px] text-[#8E8E93] mt-0.5">{contacts.length} người</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => refetch()} className="w-[38px] h-[38px] rounded-[10px] bg-[rgba(0,0,0,0.04)] flex items-center justify-center">
                <RefreshCw size={15} className="text-[#8E8E93]" />
              </button>
              <button onClick={() => router.push('/contacts/add')}
                className="w-[38px] h-[38px] rounded-[10px] bg-[#E6002D] text-white flex items-center justify-center shadow-md active:scale-90 transition-all">
                <Plus size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="relative mb-3">
            <Search size={15} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
            <input type="text" placeholder="Tìm kiếm quan hệ..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[40px] pl-[36px] pr-[12px] rounded-[10px] bg-[rgba(0,0,0,0.04)] text-[16px] text-[#111] placeholder:text-[#9CA3AF] outline-none border border-transparent focus:border-[rgba(230,0,45,0.25)] transition-all" />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
            {RELATIONSHIPS.map((rel) => (
              <button key={rel.id} onClick={() => { setActiveFilter(rel.id); setCurrentPage(1); }}
                className={`flex items-center gap-1 px-[10px] py-[5px] rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  activeFilter === rel.id ? 'bg-[#E6002D] text-white' : 'bg-[rgba(0,0,0,0.04)] text-[#6B7280]'
                }`}>
                <div className="w-[4px] h-[4px] rounded-full" style={{ backgroundColor: rel.color }} />
                {rel.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center py-12">
              <div className="w-7 h-7 border-2 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin mb-2" />
              <p className="text-[12px] text-[#8E8E93]">Đang tải...</p>
            </div>
          ) : loadError ? (
            <div className="glass-card p-6 text-center">
              <p className="text-[13px] font-medium text-[#E6002D]">{loadError}</p>
              <button onClick={() => refetch()} className="mt-3 px-4 py-1.5 rounded-[8px] text-[11px] font-medium text-white bg-[#E6002D]">Thử lại</button>
            </div>
          ) : processedContacts.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-[#E6002D]/5 mx-auto mb-3 flex items-center justify-center">
                <Users size={22} className="text-[#E6002D]/30" />
              </div>
              <p className="text-[13px] font-medium text-[#6B7280]">
                {searchQuery || activeFilter ? 'Không tìm thấy kết quả' : 'Chưa có quan hệ nào'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedContacts.map((contact) => (
                <ContactCard key={contact.ContactID} contact={contact} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Desktop ── */}
      {isDesktop && (
        <div className="page-content">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && loadError && (
            <div className="glass-card p-8 text-center">
              <p className="text-[14px] font-medium text-[#E6002D]">{loadError}</p>
              <button onClick={() => refetch()} className="btn-glass-primary mt-4 px-5 py-2 text-[12px]">Thử lại</button>
            </div>
          )}

          {!isLoading && !loadError && (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 relative">
                  <Search size={15} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm tên người..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full h-[38px] pl-[34px] pr-[12px] rounded-[8px] bg-white border border-[rgba(0,0,0,0.06)] text-[13px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[#E6002D] transition-all"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-[55%]">
                  {RELATIONSHIPS.map((rel) => (
                    <button key={rel.id} onClick={() => { setActiveFilter(rel.id); setCurrentPage(1); }}
                      className={`px-[10px] py-[6px] rounded-[6px] text-[11px] font-medium border transition-all whitespace-nowrap ${
                        activeFilter === rel.id
                          ? 'bg-[#E6002D] text-white border-[#E6002D]'
                          : 'bg-white text-[#5F6368] border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)]'
                      }`}>
                      {rel.label}
                    </button>
                  ))}
                </div>

                <button onClick={() => router.push('/contacts/add')}
                  className="h-[38px] px-4 rounded-[8px] bg-[#E6002D] text-white text-[12px] font-semibold flex items-center gap-1.5 hover:bg-[#D40028] transition-all shadow-sm">
                  <Plus size={16} strokeWidth={2.5} />
                  Thêm người
                </button>
              </div>

              <div className="glass-card-compact overflow-hidden" style={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.04)' }}>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[rgba(0,0,0,0.02)]">
                      <TH label="Tên" field="Name" current={sortField} dir={sortDir} onSort={handleSort} width="auto" />
                      <TH label="Mối quan hệ" field="Relationship" current={sortField} dir={sortDir} onSort={handleSort} width="140px" />
                      <TH label="Điểm" field="RelationshipScore" current={sortField} dir={sortDir} onSort={handleSort} width="80px" center />
                      <TH label="Sinh nhật" field="Birthday" current={sortField} dir={sortDir} onSort={handleSort} width="120px" center />
                      <TH label="Trạng thái" field="Status" current={sortField} dir={sortDir} onSort={handleSort} width="120px" center />
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedContacts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-[13px] text-[#8E8E93]">
                          Không tìm thấy kết quả
                        </td>
                      </tr>
                    ) : (
                      paginatedContacts.map((contact) => (
                        <tr
                          key={contact.ContactID}
                          onClick={() => selectContact(contact.ContactID)}
                          className="border-b border-[rgba(0,0,0,0.03)] cursor-pointer hover:bg-[rgba(230,0,45,0.02)] transition-colors last:border-b-0"
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              {contact.Avatar ? (
                                <div className="w-[30px] h-[30px] rounded-full overflow-hidden flex-shrink-0">
                                  <img src={contact.Avatar} alt="" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-white font-semibold text-[11px] flex-shrink-0"
                                  style={{ backgroundColor: getColor(contact.Name) }}>
                                  {(contact.Name || '?').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="text-[13px] font-medium text-[#111] truncate">{contact.Name || '—'}</span>
                                  {contact.IsFavorite && <Heart size={10} className="text-[#E6002D] fill-[#E6002D] flex-shrink-0" />}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[12px] text-[#5F6368]">{contact.Relationship || '—'}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex items-center justify-center w-[32px] h-[22px] rounded-[4px] text-[11px] font-bold text-white ${
                              (contact.RelationshipScore || 0) >= 80 ? 'bg-[#34C759]' :
                              (contact.RelationshipScore || 0) >= 50 ? 'bg-[#FF9500]' : 'bg-[#FF3B30]'
                            }`}>
                              {contact.RelationshipScore || 0}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-[12px] text-[#5F6368]">
                              {contact.Birthday ? formatDate(contact.Birthday, 'ddmm') : '—'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: getStatusDot(contact.Status) }} />
                              <span className="text-[11px] text-[#8E8E93]">{getStatusLabel(contact.Status)}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-4 text-[12px]">
                <span className="text-[#8E8E93] font-medium">
                  {processedContacts.length} người — Trang {safePage}/{totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="w-[30px] h-[30px] rounded-[6px] flex items-center justify-center border border-[rgba(0,0,0,0.06)] bg-white text-[#5F6368] disabled:opacity-30 hover:bg-[rgba(0,0,0,0.03)] transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .map((p, idx, arr) => (
                      <span key={p} className="flex items-center">
                        {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-[#B0B0B8]">...</span>}
                        <button onClick={() => setCurrentPage(p)}
                          className={`w-[30px] h-[30px] rounded-[6px] text-[12px] font-medium transition-all ${
                            p === safePage
                              ? 'bg-[#E6002D] text-white'
                              : 'text-[#5F6368] hover:bg-[rgba(0,0,0,0.04)]'
                          }`}>
                          {p}
                        </button>
                      </span>
                    ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="w-[30px] h-[30px] rounded-[6px] flex items-center justify-center border border-[rgba(0,0,0,0.06)] bg-white text-[#5F6368] disabled:opacity-30 hover:bg-[rgba(0,0,0,0.03)] transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );

  return (
    <ContactsErrorBoundary>
      {pageContent}
    </ContactsErrorBoundary>
  );
}

/* ─── Table Header ─── */
function TH({
  label, field, current, dir, onSort, width, center
}: {
  label: string; field: SortField; current: SortField; dir: SortDir;
  onSort: (f: SortField) => void; width?: string; center?: boolean;
}) {
  const active = current === field;
  return (
    <th
      onClick={() => onSort(field)}
      className={`py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase tracking-[0.3px] cursor-pointer select-none hover:text-[#5F6368] transition-colors ${center ? 'text-center' : 'text-left'}`}
      style={{ width }}
    >
      <div className={`flex items-center gap-1 ${center ? 'justify-center' : ''}`}>
        {label}
        <ArrowUpDown size={11} className={`transition-all ${active ? 'text-[#E6002D] opacity-100' : 'opacity-30'}`} />
      </div>
    </th>
  );
}

/* ─── Color helper ─── */
const COLORS = ['#E6002D', '#007AFF', '#FF9500', '#34C759', '#5856D6', '#AF52DE', '#FF4D6A', '#FF2D55', '#0A84FF', '#30B0C7'];
function getColor(name: string): string {
  if (!name) return '#8E8E93';
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}
