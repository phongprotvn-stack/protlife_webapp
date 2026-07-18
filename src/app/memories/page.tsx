'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Search, BookHeart, RefreshCw, Calendar, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { memoryService } from '@/lib/services/memory-service';
import { useAppStore } from '@/stores/app-store';
import type { MemoryWithEvent, MoodEmoji } from '@/types/database';
import { PanelsTopLeft, Disc3 } from 'lucide-react';

const MOOD_FILTERS: { emoji: MoodEmoji | 'ALL'; label: string }[] = [
  { emoji: 'ALL', label: 'Tất cả' },
  { emoji: '😊', label: 'Vui vẻ' },
  { emoji: '🤩', label: 'Phấn khích' },
  { emoji: '😌', label: 'Bình yên' },
  { emoji: '😢', label: 'Buồn' },
  { emoji: '😤', label: 'Tức giận' },
  { emoji: '😴', label: 'Mệt mỏi' },
];

export default function MemoriesPage() {
  const router = useRouter();
  const selectMemory = useAppStore((s) => s.selectMemory);
  const [memories, setMemories] = useState<MemoryWithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDesktop, setIsDesktop] = useState(false);
  const [moodFilter, setMoodFilter] = useState<MoodEmoji | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { setIsDesktop(window.innerWidth >= 768); }, []);
  useEffect(() => { loadMemories(); }, []);

  const loadMemories = async () => {
    setIsLoading(true); setError('');
    try { setMemories(await memoryService.getAllWithEvent()); }
    catch (e: any) { setError(e.message || 'Không thể tải dữ liệu'); }
    finally { setIsLoading(false); }
  };

  const filtered = useMemo(() => {
    let f = memories;
    if (moodFilter !== 'ALL') f = f.filter(m => m.MoodEmoji === moodFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      f = f.filter(m =>
        m.Title.toLowerCase().includes(q) ||
        (m.Content && m.Content.toLowerCase().includes(q))
      );
    }
    return f;
  }, [memories, moodFilter, searchQuery]);

  // ─── Mobile View ───
  if (!isDesktop) {
    return (
      <div className="page-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[22px] font-bold text-[#111] tracking-tight">Ký ức</h1>
            <p className="text-[12px] text-[#8E8E93] mt-0.5">{memories.length} ký ức</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadMemories} className="w-[38px] h-[38px] rounded-[10px] bg-[rgba(0,0,0,0.04)] flex items-center justify-center">
              <RefreshCw size={15} className="text-[#8E8E93]" />
            </button>
            <button onClick={() => router.push('/memories/add')}
              className="w-[38px] h-[38px] rounded-[10px] bg-[#FF2D55] text-white flex items-center justify-center shadow-md active:scale-90">
              <Plus size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Mobile wheel entry */}
        <button onClick={() => router.push('/memories/wheel')}
          className="w-full mb-3 py-2 rounded-[10px] text-[12px] font-medium text-[#FF2D55] bg-[rgba(255,45,85,0.06)] border border-[rgba(255,45,85,0.1)] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all">
          <Disc3 size={14} /> Bánh xe ký ức
        </button>

        {/* Filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
          {MOOD_FILTERS.map((f) => (
            <button key={f.emoji} onClick={() => setMoodFilter(f.emoji)}
              className={`flex items-center gap-1 px-[10px] py-[5px] rounded-full text-[11px] font-medium whitespace-nowrap ${
                moodFilter === f.emoji ? 'bg-[#FF2D55] text-white' : 'bg-[rgba(0,0,0,0.04)] text-[#6B7280]'
              }`}>
              {f.emoji !== 'ALL' && <span>{f.emoji}</span>}{f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center py-12">
            <div className="w-7 h-7 border-2 border-[#FF2D55]/20 border-t-[#FF2D55] rounded-full animate-spin mb-2" />
            <p className="text-[12px] text-[#8E8E93]">Đang tải...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center bg-white rounded-[16px] shadow-sm">
            <p className="text-[13px] font-medium text-[#E6002D]">{error}</p>
            <button onClick={loadMemories} className="mt-3 px-4 py-1.5 rounded-[8px] text-[11px] font-medium text-white bg-[#FF2D55]">Thử lại</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-[16px] shadow-sm">
            <div className="w-14 h-14 rounded-full bg-[#FF4D6A]/5 mx-auto mb-3 flex items-center justify-center">
              <BookHeart size={24} className="text-[#FF4D6A]/30" />
            </div>
            <p className="text-[14px] font-medium text-[#6B7280]">
              {searchQuery || moodFilter !== 'ALL' ? 'Không tìm thấy ký ức nào' : 'Chưa có ký ức nào'}
            </p>
            <p className="text-[12px] text-[#9CA3AF] mt-1">
              {searchQuery || moodFilter !== 'ALL' ? 'Thử bộ lọc khác' : 'Lưu ký ức từ sự kiện hoặc thêm mới'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((m) => (
              <MemoryCardMobile key={m.MemoryID} memory={m} onClick={() => selectMemory(m.MemoryID)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Desktop View ───
  return (
    <div className="page-content">
      {/* Top row */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[20px] font-bold text-[#111]">🧠 Ký ức</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/memories/wheel')}
            className="h-[36px] px-3 rounded-[8px] text-[12px] font-medium text-[#FF2D55] bg-[rgba(255,45,85,0.06)] border border-[rgba(255,45,85,0.1)] flex items-center gap-1.5 hover:bg-[rgba(255,45,85,0.1)] transition-all">
            <Disc3 size={15} /> Bánh xe
          </button>
          <button onClick={() => router.push('/memories/add')}
            className="h-[36px] px-4 rounded-[8px] bg-[#FF2D55] text-white text-[12px] font-semibold flex items-center gap-1.5 hover:bg-[#D40028] transition-all shadow-sm">
            <Plus size={16} strokeWidth={2.5} /> Thêm ký ức
          </button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-[260px]">
          <Search size={14} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input type="text" placeholder="Tìm ký ức..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[34px] pl-[30px] pr-[10px] rounded-[8px] bg-white border border-[rgba(0,0,0,0.06)] text-[12px] outline-none focus:border-[#FF2D55]" />
        </div>
        <div className="flex gap-1">
          {MOOD_FILTERS.map((f) => (
            <button key={f.emoji} onClick={() => setMoodFilter(f.emoji)}
              className={`px-[10px] py-[5px] rounded-[6px] text-[11px] font-medium whitespace-nowrap border transition-all ${
                moodFilter === f.emoji ? 'bg-[#FF2D55] text-white border-[#FF2D55]' : 'bg-white text-[#5F6368] border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)]'
              }`}>
              {f.emoji !== 'ALL' && <span className="mr-0.5">{f.emoji}</span>}{f.label}
            </button>
          ))}
        </div>
        <button onClick={loadMemories} className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center border border-[rgba(0,0,0,0.06)] bg-white hover:bg-[rgba(0,0,0,0.03)]">
          <RefreshCw size={13} className="text-[#8E8E93]" />
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#FF2D55]/20 border-t-[#FF2D55] rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-[12px] shadow-sm border border-[rgba(0,0,0,0.04)]">
          <p className="text-[14px] font-medium text-[#E6002D]">{error}</p>
          <button onClick={loadMemories} className="mt-3 px-5 py-2 rounded-[8px] text-[12px] font-medium text-white bg-[#FF2D55]">Thử lại</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-[12px] shadow-sm border border-[rgba(0,0,0,0.04)]">
          <div className="w-14 h-14 rounded-full bg-[#FF4D6A]/5 mx-auto mb-3 flex items-center justify-center">
            <BookHeart size={24} className="text-[#FF4D6A]/30" />
          </div>
          <p className="text-[14px] font-medium text-[#6B7280]">Không tìm thấy ký ức</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((m, i) => (
            <MemoryCardDesktop key={m.MemoryID} memory={m} index={i} onClick={() => selectMemory(m.MemoryID)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Memory Card Components ───

function MemoryCardMobile({ memory, onClick }: { memory: MemoryWithEvent; onClick: () => void }) {
  const moodColor = (emoji?: string | null): string => {
    const colors: Record<string, string> = { '😊': '#FF9500', '😢': '#5856D6', '🤩': '#FF2D55', '😌': '#34C759', '😤': '#E6002D', '😴': '#8E8E93' };
    return colors[emoji || ''] || '#8E8E93';
  };

  return (
    <div onClick={onClick}
      className="bg-white rounded-[14px] p-3.5 shadow-sm border border-[rgba(0,0,0,0.04)] active:scale-[0.98] transition-all cursor-pointer">
      <div className="flex items-start gap-3">
        <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-[20px] shrink-0"
          style={{ background: `${moodColor(memory.MoodEmoji)}12` }}>
          {memory.MoodEmoji || '🧠'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[#111] line-clamp-1">{memory.Title}</p>
          {memory.Content && <p className="text-[11px] text-[#6B7280] mt-0.5 line-clamp-2 leading-relaxed">{memory.Content}</p>}
          <div className="flex items-center gap-2 mt-1.5">
            <Calendar size={10} className="text-[#8E8E93]" />
            <span className="text-[10px] text-[#8E8E93] font-medium">{new Date(memory.CreatedDate).toLocaleDateString('vi-VN')}</span>
            {memory.EventTitle && (
              <span className="text-[10px] text-[#5856D6] font-medium truncate">🔗 {memory.EventTitle}</span>
            )}
          </div>
        </div>
      </div>
      {memory.Image && (
        <div className="mt-2 rounded-[10px] overflow-hidden">
          <img src={memory.Image} alt="" className="w-full h-[120px] object-cover" />
        </div>
      )}
    </div>
  );
}

function MemoryCardDesktop({ memory, index, onClick }: { memory: MemoryWithEvent; index: number; onClick: () => void }) {
  const moodColor = (emoji?: string | null): string => {
    const colors: Record<string, string> = { '😊': '#FF9500', '😢': '#5856D6', '🤩': '#FF2D55', '😌': '#34C759', '😤': '#E6002D', '😴': '#8E8E93' };
    return colors[emoji || ''] || '#8E8E93';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      onClick={onClick}
      className="bg-white rounded-[12px] p-3.5 shadow-sm border border-[rgba(0,0,0,0.04)] cursor-pointer hover:shadow-md hover:border-[rgba(255,45,85,0.12)] transition-all group">
      {/* Mood + thumbnail row */}
      <div className="flex items-start gap-2.5 mb-2.5">
        <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[18px] shrink-0"
          style={{ background: `${moodColor(memory.MoodEmoji)}12` }}>
          {memory.MoodEmoji || '🧠'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[#111] line-clamp-1 group-hover:text-[#FF2D55] transition-colors">{memory.Title}</p>
          {memory.EventTitle && <p className="text-[10px] text-[#5856D6] font-medium truncate">🔗 {memory.EventTitle}</p>}
        </div>
      </div>

      {/* Content preview */}
      {memory.Content && (
        <p className="text-[11px] text-[#6B7280] leading-relaxed line-clamp-2 mb-2">{memory.Content}</p>
      )}

      {/* Image thumbnail */}
      {memory.Image && (
        <div className="mb-2 rounded-[8px] overflow-hidden">
          <img src={memory.Image} alt="" className="w-full h-[80px] object-cover" />
        </div>
      )}

      {/* Date */}
      <div className="flex items-center gap-1">
        <Calendar size={10} className="text-[#8E8E93]" />
        <span className="text-[10px] text-[#8E8E93] font-medium">{new Date(memory.CreatedDate).toLocaleDateString('vi-VN')}</span>
      </div>
    </motion.div>
  );
}
