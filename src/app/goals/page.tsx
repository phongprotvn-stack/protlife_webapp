'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Target, RefreshCw, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

export default function GoalsPage() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => { setIsDesktop(window.innerWidth >= 768); }, []);

  if (!isDesktop) {
    return (
      <div className="page-content">
        <div className="flex items-center justify-between mb-4">
          <div><h1 className="text-[22px] font-bold text-[#111] tracking-tight">Mục tiêu</h1><p className="text-[12px] text-[#8E8E93] mt-0.5">0 mục tiêu</p></div>
        </div>
        <div className="glass-card p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-[#34C759]/5 mx-auto mb-3 flex items-center justify-center">
            <Target size={24} className="text-[#34C759]/30" />
          </div>
          <p className="text-[14px] font-medium text-[#6B7280]">Chưa có mục tiêu nào</p>
          <p className="text-[12px] text-[#9CA3AF] mt-1">Đặt mục tiêu và theo dõi tiến độ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input type="text" placeholder="Tìm kiếm mục tiêu..."
            className="w-full h-[38px] pl-[34px] pr-[12px] rounded-[8px] bg-white border border-[rgba(0,0,0,0.06)] text-[13px] outline-none focus:border-[#E6002D]" />
        </div>
        <button className="h-[38px] px-4 rounded-[8px] bg-[#E6002D] text-white text-[12px] font-semibold flex items-center gap-1.5 hover:bg-[#D40028] transition-all shadow-sm">
          <Plus size={16} strokeWidth={2.5} /> Thêm mục tiêu
        </button>
      </div>

      <div className="glass-card-compact overflow-hidden" style={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.04)' }}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[rgba(0,0,0,0.02)]">
              <th className="py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase text-left">Mục tiêu</th>
              <th className="py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase text-center w-[100px]">Trạng thái</th>
              <th className="py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase text-center w-[100px]">Hạn chót</th>
              <th className="py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase text-center w-[80px]">Ưu tiên</th>
              <th className="py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase text-center w-[100px]">Tiến độ</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={5} className="text-center py-12 text-[13px] text-[#8E8E93]">Chưa có dữ liệu</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
