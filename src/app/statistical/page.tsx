'use client';

import { BarChart3, Download, FileText, FileSpreadsheet, File } from 'lucide-react';

export default function StatisticalPage() {
  const exportFormats = [
    {
      format: 'Word',
      icon: FileText,
      color: '#007AFF',
      bg: 'bg-[#007AFF]/8',
      hoverBg: 'hover:bg-[#007AFF]/12',
      items: [
        'Xuất danh sách quan hệ (Word)',
        'Xuất danh sách sự kiện (Word)',
        'Xuất báo cáo tổng quan (Word)',
      ],
    },
    {
      format: 'Excel',
      icon: FileSpreadsheet,
      color: '#34C759',
      bg: 'bg-[#34C759]/8',
      hoverBg: 'hover:bg-[#34C759]/12',
      items: [
        'Xuất danh sách quan hệ (Excel)',
        'Xuất danh sách sự kiện (Excel)',
        'Xuất báo cáo tổng quan (Excel)',
      ],
    },
    {
      format: 'PDF',
      icon: File,
      color: '#E6002D',
      bg: 'bg-[#E6002D]/8',
      hoverBg: 'hover:bg-[#E6002D]/12',
      items: [
        'Xuất danh sách quan hệ (PDF)',
        'Xuất danh sách sự kiện (PDF)',
        'Xuất báo cáo tổng quan (PDF)',
      ],
    },
  ];

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

      {/* Export options - 3 formats */}
      <div className="card-ios">
        <div className="flex items-center gap-2 mb-4">
          <Download size={17} className="text-[#8E8E93]" />
          <h3 className="text-[15px] font-semibold text-[#111]">Xuất báo cáo</h3>
        </div>
        <p className="text-[13px] text-[#8E8E93] mb-4">Chọn định dạng để xuất báo cáo:</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {exportFormats.map((fmt) => {
            const Icon = fmt.icon;
            return (
              <div key={fmt.format} className={`rounded-[14px] ${fmt.bg} p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={18} style={{ color: fmt.color }} />
                  <span className="text-[14px] font-semibold" style={{ color: fmt.color }}>
                    {fmt.format}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {fmt.items.map((item) => (
                    <button
                      key={item}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] bg-white ${fmt.hoverBg} transition-all text-left`}
                    >
                      <span className="text-[12px] text-[#111] font-medium">{item}</span>
                      <Download size={13} className="text-[#8E8E93] flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
