'use client';

import { FileText, Plus, Search } from 'lucide-react';

export default function DocumentsPage() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[26px] font-bold text-[#111] tracking-tight flex items-center gap-3">
            <FileText size={24} className="text-[#34C759]" />
            Tài liệu
          </h1>
          <p className="text-[13px] text-[#8E8E93] mt-0.5">0 tài liệu</p>
        </div>
        <button className="w-[44px] h-[44px] rounded-[14px] bg-[#E6002D] text-white flex items-center justify-center shadow-lg">
          <Plus size={22} strokeWidth={2.5} />
        </button>
      </div>

      <div className="card-ios py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#34C759]/5 mx-auto mb-4 flex items-center justify-center">
          <FileText size={28} className="text-[#34C759]/30" />
        </div>
        <p className="text-[15px] font-medium text-[#6B7280]">Chưa có tài liệu nào</p>
        <p className="text-[13px] text-[#9CA3AF] mt-1">Lưu trữ giấy tờ, hoá đơn, PDF gắn với người và sự kiện</p>
      </div>
    </div>
  );
}
