'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Disc3, Sparkles, Droplets } from 'lucide-react';
import { memoryService } from '@/lib/services/memory-service';
import type { MemoryWithEvent } from '@/types/database';

export default function MemoryDropsPage() {
  const router = useRouter();
  const [memories, setMemories] = useState<MemoryWithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadMemories(); }, []);

  const loadMemories = async () => {
    const tryLoad = async (retries = 3): Promise<void> => {
      try {
        const data = await memoryService.getAllWithEvent();
        data.sort((a, b) => {
          const aDate = a.EventDate || a.MemoryDate || a.CreatedDate;
          const bDate = b.EventDate || b.MemoryDate || b.CreatedDate;
          return new Date(aDate).getTime() - new Date(bDate).getTime();
        });
        setMemories(data);
      } catch (e: any) {
        const msg = e.message || '';
        if (msg.includes('connection pool') && retries > 0) {
          await new Promise(r => setTimeout(r, 1500));
          return tryLoad(retries - 1);
        }
        throw e;
      }
    };
    setIsLoading(true); setError('');
    try { await tryLoad(); }
    catch (e: any) { setError(e.message || 'Không thể tải dữ liệu'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="page-content min-h-dvh flex flex-col bg-black select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 bg-black">
        <div className="flex items-center gap-2.5">
          <button onClick={() => router.back()}
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center hover:bg-white/5 text-white/50 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-[17px] font-semibold text-white/80 tracking-tight">Giọt Ký ức</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => router.push('/memories/shards')}
            className="h-[30px] px-2.5 rounded-[8px] text-[11px] font-medium text-[#5856D6] bg-white/5 flex items-center gap-1">
            <Sparkles size={12} /> Mảnh
          </button>
          <button onClick={() => router.push('/memories/wheel')}
            className="h-[30px] px-2.5 rounded-[8px] text-[11px] font-medium text-[#FF2D55] bg-white/5 flex items-center gap-1">
            <Disc3 size={12} /> Bánh xe
          </button>
        </div>
      </div>

      {/* Placeholder — chờ thiết kế UI/UX */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {isLoading ? (
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[13px] text-white/40 font-medium">Đang tải ký ức...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-[13px] font-medium text-[#E6002D] mb-3">{error}</p>
            <button onClick={loadMemories}
              className="px-4 py-1.5 rounded-[8px] text-[11px] font-medium text-white bg-[#E6002D]">Thử lại</button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
              <Droplets size={36} className="text-white/20" />
            </div>
            <h2 className="text-[18px] font-semibold text-white/60 mb-1">Giọt Ký ức</h2>
            <p className="text-[13px] text-white/30 leading-relaxed max-w-[240px]">
              {memories.length > 0
                ? `${memories.length} ký ức đã sẵn sàng. Đang chờ thiết kế giao diện...`
                : 'Chưa có ký ức nào. Thêm ký ức để bắt đầu.'}
            </p>
          </div>
        )}
      </div>

      {/* Status bar */}
      {!isLoading && !error && (
        <div className="px-4 py-3 text-center">
          <p className="text-[11px] text-white/20 font-medium">{memories.length} ký ức</p>
        </div>
      )}
    </div>
  );
}
