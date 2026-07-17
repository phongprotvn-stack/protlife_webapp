'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Heart, RefreshCw, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

export default function MemoriesPage() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => { setIsDesktop(window.innerWidth >= 768); }, []);

  if (!isDesktop) {
    return (
      <div className="page-content">
        <div className="flex items-center justify-between mb-4">
          <div><h1 className="text-[22px] font-bold text-[#111] tracking-tight">Ký ức</h1><p className="text-[12px] text-[#8E8E93] mt-0.5">0 ký ức</p></div>
        </div>
        <div className="glass-card p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-[#FF4D6A]/5 mx-auto mb-3 flex items-center justify-center">
            <Heart size={24} className="text-[#FF4D6A]/30" />
          </div>
          <p className="text-[14px] font-medium text-[#6B7280]">Chưa có ký ức nào</p>
          <p className="text-[12px] text-[#9CA3AF] mt-1">Ghi lại những khoảnh khắc đáng nhớ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input type="text" placeholder="Tìm kiếm ký ức..."
            className="w-full h-[38px] pl-[34px] pr-[12px] rounded-[8px] bg-white border border-[rgba(0,0,0,0.06)] text-[13px] outline-none focus:border-[#E6002D]" />
        </div>
        <button className="h-[38px] px-4 rounded-[8px] bg-[#E6002D] text-white text-[12px] font-semibold flex items-center gap-1.5 hover:bg-[#D40028] transition-all shadow-sm">
          <Plus size={16} strokeWidth={2.5} /> Thêm ký ức
        </button>
      </div>

      <div className="glass-card-compact overflow-hidden" style={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.04)' }}>
        <table className="w-full border-collapse">
          <thead><tr className="bg-[rgba(0,0,0,0.02)]">
            <th className="py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase tracking-[0.3px] text-left">Tiêu đề</th>
            <th className="py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase tracking-[0.3px] text-center" style={{width:'100px'}}>Ngày</th>
            <th className="py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase tracking-[0.3px] text-center" style={{width:'100px'}}>Loại</th>
          </tr></thead>
          <tbody>
            <tr><td colSpan={3} className="text-center py-12 text-[13px] text-[#8E8E93]">Chưa có dữ liệu</td></tr>
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-[12px]">
        <span className="text-[#8E8E93] font-medium">0 ký ức</span>
      </div>
    </div>
  );
}
