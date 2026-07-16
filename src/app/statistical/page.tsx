'use client';

import { BarChart3, Download, FileDown } from 'lucide-react';

export default function StatisticalPage() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[26px] font-bold text-[#111] tracking-tight flex items-center gap-3">
            <BarChart3 size={24} className="text-[#007AFF]" />
            Thống kê
          </h1>
          <p className="text-[13px] text-[#8E8E93] mt-0.5">Báo cáo và phân tích dữ liệu</p>
        </div>
        <button className="h-[40px] px-[16px] rounded-[12px] bg-[#007AFF]/10 text-[#007AFF] text-[13px] font-semibold flex items-center gap-2 hover:bg-[#007AFF]/20 transition-all">
          <Download size={16} />
          Xuất báo cáo
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card-ios">
          <p className="text-[12px] text-[#8E8E93] font-medium">Tổng quan hệ</p>
          <p className="text-[28px] font-bold text-[#111] mt-1">0</p>
        </div>
        <div className="card-ios">
          <p className="text-[12px] text-[#8E8E93] font-medium">Tổng sự kiện</p>
          <p className="text-[28px] font-bold text-[#111] mt-1">0</p>
        </div>
        <div className="card-ios">
          <p className="text-[12px] text-[#8E8E93] font-medium">Tổng ký ức</p>
          <p className="text-[28px] font-bold text-[#111] mt-1">0</p>
        </div>
        <div className="card-ios">
          <p className="text-[12px] text-[#8E8E93] font-medium">Địa điểm</p>
          <p className="text-[28px] font-bold text-[#111] mt-1">0</p>
        </div>
      </div>

      {/* Charts placeholder */}
      <div className="card-ios py-12 text-center mb-4">
        <div className="w-16 h-16 rounded-full bg-[#007AFF]/5 mx-auto mb-4 flex items-center justify-center">
          <BarChart3 size={28} className="text-[#007AFF]/30" />
        </div>
        <p className="text-[15px] font-medium text-[#6B7280]">Biểu đồ sẽ hiển thị sau khi có dữ liệu</p>
        <p className="text-[13px] text-[#9CA3AF] mt-1">Thêm quan hệ và sự kiện để xem thống kê</p>
      </div>

      {/* Export options */}
      <div className="card-ios">
        <h3 className="text-[15px] font-semibold text-[#111] mb-3">Xuất báo cáo</h3>
        <div className="space-y-2">
          {['Xuất danh sách quan hệ (Excel)', 'Xuất danh sách sự kiện (Excel)', 'Xuất báo cáo tổng quan (PDF)'].map((item) => (
            <button
              key={item}
              className="w-full flex items-center justify-between px-4 py-[12px] rounded-[12px] bg-[rgba(0,0,0,0.02)] hover:bg-[rgba(0,0,0,0.04)] transition-all"
            >
              <span className="text-[14px] text-[#111]">{item}</span>
              <FileDown size={16} className="text-[#8E8E93]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
