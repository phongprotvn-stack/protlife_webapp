'use client';

import { BarChart3, Download, FileText, FileSpreadsheet, File, Users, Calendar, LayoutList, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const reports = [
  {
    id: 'danh-sach-quan-he',
    label: 'Danh sách quan hệ',
    icon: Users,
    color: '#E6002D',
    bg: 'bg-[#E6002D]/6',
    border: 'border-[#E6002D]/10',
    desc: 'Xuất danh sách tất cả các mối quan hệ kèm thông tin chi tiết',
    count: '0 quan hệ',
  },
  {
    id: 'danh-sach-su-kien',
    label: 'Danh sách sự kiện',
    icon: Calendar,
    color: '#007AFF',
    bg: 'bg-[#007AFF]/6',
    border: 'border-[#007AFF]/10',
    desc: 'Xuất danh sách tất cả các sự kiện kèm thời gian và mô tả',
    count: '0 sự kiện',
  },
  {
    id: 'bao-cao-tong-hop',
    label: 'Danh sách Tổng hợp',
    icon: LayoutList,
    color: '#5856D6',
    bg: 'bg-[#5856D6]/6',
    border: 'border-[#5856D6]/10',
    desc: 'Báo cáo tổng hợp toàn bộ dữ liệu quan hệ và sự kiện',
    count: 'Báo cáo tổng quan',
  },
];

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

      {/* Báo cáo section */}
      <div className="card-ios">
        <div className="flex items-center gap-2 mb-4">
          <Download size={17} className="text-[#8E8E93]" />
          <h3 className="text-[15px] font-semibold text-[#111]">Báo cáo</h3>
        </div>
        <p className="text-[13px] text-[#8E8E93] mb-4">
          Chọn danh mục báo cáo để xem chi tiết và xuất dữ liệu:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <Link
                key={report.id}
                href={`/statistical/report/${report.id}`}
                className={`rounded-[16px] ${report.bg} ${report.border} border p-5 group hover:shadow-md transition-all duration-200`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center bg-white shadow-sm"
                  >
                    <Icon size={22} style={{ color: report.color }} />
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-[#D1D5DB] group-hover:translate-x-0.5 group-hover:text-[#8E8E93] transition-all"
                  />
                </div>
                <h4 className="text-[15px] font-semibold text-[#111] mb-1">
                  {report.label}
                </h4>
                <p className="text-[12px] text-[#8E8E93] leading-relaxed mb-2">
                  {report.desc}
                </p>
                <span className="text-[11px] font-medium" style={{ color: report.color }}>
                  {report.count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
