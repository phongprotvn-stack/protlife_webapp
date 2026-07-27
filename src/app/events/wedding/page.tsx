import React from 'react'
import { CheckCircle2, Circle, Users, Wallet, CalendarDays, Plus } from 'lucide-react'
import Link from 'next/link'

export default function WeddingDashboardPage() {
  return (
    <div className="page-content min-h-[80vh]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[22px] font-bold text-[#111] tracking-tight">Đám cưới của tôi</h2>
          <p className="text-[12px] text-[#8E8E93] mt-0.5">Tổng quan sự kiện</p>
        </div>
        <button className="px-5 py-2 rounded-[10px] text-[12px] font-medium text-white bg-[#E6002D] hover:bg-[#D40028] transition-all shadow-md">
          Tải báo cáo
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {/* Ngân sách */}
        <div className="glass-card p-5 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[rgba(230,0,45,0.05)] rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-[#5F6368]">Ngân sách dự kiến</span>
            <Wallet size={16} className="text-[#E6002D]" />
          </div>
          <div className="text-[24px] font-bold text-[#111] mb-1">250,000,000 đ</div>
          <p className="text-[11px] text-[#8E8E93] mb-3">Đã chi 100,000,000 đ</p>
          <div className="w-full bg-[rgba(0,0,0,0.06)] rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#E6002D] h-1.5 rounded-full" style={{ width: '40%' }}></div>
          </div>
        </div>

        {/* Khách mời */}
        <div className="glass-card p-5 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[rgba(0,122,255,0.05)] rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-[#5F6368]">Khách mời (Đã chốt)</span>
            <Users size={16} className="text-[#007AFF]" />
          </div>
          <div className="text-[24px] font-bold text-[#111] mb-1">120 <span className="text-[16px] text-[#8E8E93] font-normal">/ 300</span></div>
          <p className="text-[11px] text-[#8E8E93] mb-3">+15 khách trong tuần này</p>
          <Link href="/events/wedding/guests">
            <button className="w-full py-1.5 border border-[rgba(0,0,0,0.1)] rounded-[8px] text-[12px] font-medium hover:bg-[rgba(0,0,0,0.02)] transition-all">
              Quản lý khách mời
            </button>
          </Link>
        </div>

        {/* Thời gian */}
        <div className="glass-card p-5 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[rgba(52,199,89,0.05)] rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-[#5F6368]">Thời gian còn lại</span>
            <CalendarDays size={16} className="text-[#34C759]" />
          </div>
          <div className="text-[24px] font-bold text-[#111] mb-1">45 ngày</div>
          <p className="text-[11px] text-[#8E8E93]">Sự kiện: 15/09/2026</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="glass-card p-6 md:col-span-4">
          <div className="mb-4">
            <h3 className="text-[16px] font-bold text-[#111]">Công việc cần làm</h3>
            <p className="text-[12px] text-[#8E8E93]">Bạn có 3 công việc cần hoàn thành trong tuần này.</p>
          </div>
          <div className="space-y-3">
            {[
              { title: 'Chốt thực đơn nhà hàng', status: 'done', date: 'Đã xong' },
              { title: 'Đi thử váy cưới', status: 'pending', date: 'Hôm nay' },
              { title: 'Gửi thiệp mời online', status: 'pending', date: 'Ngày mai' },
              { title: 'Thanh toán đợt 2 chụp ảnh', status: 'pending', date: 'Tuần tới' },
            ].map((task, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-[rgba(0,0,0,0.06)] rounded-[10px] hover:bg-[rgba(0,0,0,0.02)] transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  {task.status === 'done' ? (
                    <CheckCircle2 size={18} className="text-[#34C759]" />
                  ) : (
                    <Circle size={18} className="text-[#8E8E93]" />
                  )}
                  <span className={`text-[13px] ${task.status === 'done' ? 'line-through text-[#8E8E93]' : 'font-medium text-[#111]'}`}>
                    {task.title}
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-[6px] text-[10px] font-medium ${task.status === 'done' ? 'bg-[rgba(0,0,0,0.06)] text-[#8E8E93]' : 'bg-[rgba(230,0,45,0.1)] text-[#E6002D]'}`}>
                  {task.date}
                </span>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 border border-dashed border-[rgba(0,0,0,0.2)] rounded-[10px] text-[13px] font-medium text-[#5F6368] hover:bg-[rgba(0,0,0,0.02)] transition-all">
            <Plus size={16} /> Thêm công việc
          </button>
        </div>

        <div className="glass-card p-6 md:col-span-3">
          <div className="mb-4">
            <h3 className="text-[16px] font-bold text-[#111]">Tiến độ hạng mục</h3>
            <p className="text-[12px] text-[#8E8E93]">Tỉ lệ hoàn thành các hạng mục lớn</p>
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#5F6368] font-medium">Trang phục & Makeup</span>
                <span className="font-bold text-[#111]">80%</span>
              </div>
              <div className="w-full bg-[rgba(0,0,0,0.06)] rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#AF52DE] h-1.5 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#5F6368] font-medium">Địa điểm & Cỗ bàn</span>
                <span className="font-bold text-[#111]">60%</span>
              </div>
              <div className="w-full bg-[rgba(0,0,0,0.06)] rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#FF9500] h-1.5 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#5F6368] font-medium">Khách mời & Thiệp</span>
                <span className="font-bold text-[#111]">20%</span>
              </div>
              <div className="w-full bg-[rgba(0,0,0,0.06)] rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#E6002D] h-1.5 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
