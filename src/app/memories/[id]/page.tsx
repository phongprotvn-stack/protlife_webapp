'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { memoryService } from '@/lib/services/memory-service';
import { formatDate, getMoodEmoji } from '@/lib/utils';
import type { Memory } from '@/types/database';
import { ArrowLeft, Calendar, Smile, Link, AlertTriangle } from 'lucide-react';

export default function MemoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params?.id) {
      loadMemory(params.id as string);
    }
  }, [params?.id]);

  async function loadMemory(id: string) {
    setLoading(true);
    setError('');
    try {
      const data = await memoryService.getById(id);
      setMemory(data);
    } catch (e: any) {
      setError(e?.message || 'Không thể tải ký ức');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center py-20">
          <div className="w-12 h-12 border-3 border-[rgba(var(--color-primary-rgb),.2)] border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-4" />
          <div className="text-[14px] text-[#6B7280]">Đang tải ký ức...</div>
        </div>
      </div>
    );
  }

  if (error || !memory) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] mb-6 hover:text-[var(--color-primary)] transition-colors cursor-pointer">
          <ArrowLeft size={16} /> Quay lại
        </button>
        <div className="text-center py-20">
          <AlertTriangle size={36} className="text-[#E6002D] mx-auto mb-3" />
          <p className="text-[14px] text-[#6B7280]">Không tìm thấy ký ức</p>
        </div>
      </div>
    );
  }

  const displayDate = memory.MemoryDate || memory.CreatedDate;

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Back button */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] mb-5 hover:text-[var(--color-primary)] transition-colors cursor-pointer">
        <ArrowLeft size={16} /> Quay lại
      </button>

      {/* Image */}
      {memory.Image && (
        <div className="mb-4 rounded-[18px] overflow-hidden shadow-[0_8px_28px_rgba(0,0,0,.08)]">
          <img src={memory.Image} alt={memory.Title} className="w-full h-auto max-h-[400px] object-cover" />
        </div>
      )}

      {/* Content card */}
      <div className="bg-white border border-[#EDEDF1] rounded-[18px] p-6 shadow-[0_8px_28px_rgba(0,0,0,.05)] mb-4">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-[22px] font-extrabold tracking-[-.3px] flex-1 min-w-0">{memory.Title}</h1>
          {memory.Mood && (
            <span className="text-[28px] shrink-0 ml-3">{getMoodEmoji(memory.Mood)}</span>
          )}
        </div>

        {/* Content text */}
        {memory.Content && (
          <p className="text-[13.5px] text-[#374151] leading-relaxed whitespace-pre-wrap mb-4">{memory.Content}</p>
        )}

        {/* Mood emoji (standalone) */}
        {memory.MoodEmoji && !memory.Mood && (
          <div className="flex items-center gap-2 text-[14px] mb-3">
            <span className="text-[24px]">{memory.MoodEmoji}</span>
          </div>
        )}

        <div className="space-y-3 text-[13px]">
          {/* Date */}
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-[#6B7280] shrink-0" />
            <span className="font-semibold">{formatDate(displayDate, 'long')}</span>
          </div>

          {/* Linked Event */}
          {memory.EventID && (
            <div className="flex items-center gap-3">
              <Link size={16} className="text-[#6B7280] shrink-0" />
              <span className="text-[#6B7280]">Liên kết sự kiện: </span>
              <span className="font-semibold">{memory.EventID}</span>
            </div>
          )}
        </div>
      </div>

      {/* Meta info */}
      <div className="bg-white border border-[#EDEDF1] rounded-[18px] p-6 shadow-[0_8px_28px_rgba(0,0,0,.05)]">
        <h3 className="text-[14.5px] font-extrabold mb-3">Thông tin thêm</h3>
        <div className="grid grid-cols-2 gap-y-2 text-[12px]">
          <span className="text-[#6B7280]">ID</span>
          <span className="font-semibold text-right">{memory.MemoryID}</span>
          <span className="text-[#6B7280]">Ngày tạo</span>
          <span className="font-semibold text-right">{formatDate(memory.CreatedDate, 'ddmmyyyy')}</span>
          <span className="text-[#6B7280]">Cập nhật</span>
          <span className="font-semibold text-right">{formatDate(memory.UpdatedDate, 'ddmmyyyy')}</span>
        </div>
      </div>
    </div>
  );
}
