import React from 'react'
import { Receipt, Users, Calculator, Plus, UserPlus } from 'lucide-react'

// Dummy Data
const dummyMembers = [
  { id: 1, name: 'Bạn (Admin)', paidFund: 500000, hasPaid: true },
  { id: 2, name: 'Hoàng', paidFund: 500000, hasPaid: true },
  { id: 3, name: 'Mai', paidFund: 0, hasPaid: false },
  { id: 4, name: 'Tuấn', paidFund: 500000, hasPaid: true },
]

const dummyExpenses = [
  { id: 1, desc: 'Tiền taxi sân bay', amount: 350000, paidBy: 'Bạn (Admin)', date: '25/07' },
  { id: 2, desc: 'Ăn trưa hải sản', amount: 1200000, paidBy: 'Hoàng', date: '25/07' },
  { id: 3, desc: 'Vé tham quan', amount: 800000, paidBy: 'Bạn (Admin)', date: '26/07' },
]

const dummySplits = [
  { from: 'Mai', to: 'Hoàng', amount: 300000 },
  { from: 'Mai', to: 'Bạn (Admin)', amount: 287500 },
  { from: 'Tuấn', to: 'Bạn (Admin)', amount: 87500 },
]

export default function GroupEventPage() {
  return (
    <div className="page-content min-h-[80vh]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-[22px] font-bold text-[#111] tracking-tight">Chuyến đi Đà Nẵng 2026</h2>
          <p className="text-[12px] text-[#8E8E93] mt-0.5">25/07/2026 - 28/07/2026</p>
        </div>
        <div className="flex w-full sm:w-auto space-x-2">
          <button className="flex-1 sm:flex-none px-4 py-2 bg-white border border-[rgba(0,0,0,0.06)] rounded-[10px] text-[12px] font-semibold text-[#5F6368] flex items-center justify-center gap-1.5 hover:bg-[rgba(0,0,0,0.02)] transition-all shadow-sm">
            <UserPlus size={16} /> Thêm thành viên
          </button>
          <button className="flex-1 sm:flex-none px-4 py-2 bg-[#E6002D] rounded-[10px] text-[12px] font-semibold text-white flex items-center justify-center gap-1.5 hover:bg-[#D40028] transition-all shadow-sm">
            <Plus size={16} strokeWidth={2.5} /> Thêm chi tiêu
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="glass-card p-5 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[rgba(52,199,89,0.05)] rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-[#5F6368]">Tổng Quỹ Thu Được</span>
            <Users size={16} className="text-[#34C759]" />
          </div>
          <div className="text-[24px] font-bold text-[#111] mb-1">1,500,000 đ</div>
          <p className="text-[11px] text-[#8E8E93]">3/4 người đã đóng (Mức quỹ: 500k)</p>
        </div>

        <div className="glass-card p-5 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[rgba(255,59,48,0.05)] rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-[#5F6368]">Tổng Chi Tiêu</span>
            <Receipt size={16} className="text-[#FF3B30]" />
          </div>
          <div className="text-[24px] font-bold text-[#111] mb-1">2,350,000 đ</div>
          <p className="text-[11px] text-[#8E8E93]">Chi tiêu trung bình: 587,500 đ / người</p>
        </div>

        <div className="glass-card p-5 relative overflow-hidden group hover:shadow-lg transition-all bg-[rgba(230,0,45,0.02)] border-[#E6002D]/10">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[rgba(230,0,45,0.05)] rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-[#5F6368]">Trạng thái quỹ</span>
            <Calculator size={16} className="text-[#E6002D]" />
          </div>
          <div className="text-[24px] font-bold text-[#E6002D] mb-1">- 850,000 đ</div>
          <p className="text-[11px] text-[#8E8E93]">Quỹ đang âm, cần thu thêm</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Lịch sử chi tiêu */}
        <div className="glass-card p-0 md:col-span-2 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[rgba(0,0,0,0.04)] bg-white/50">
            <h3 className="text-[16px] font-bold text-[#111]">Lịch sử chi tiêu</h3>
          </div>
          <div className="p-2 space-y-1 bg-[rgba(0,0,0,0.01)] flex-1">
            {dummyExpenses.map((expense) => (
              <div key={expense.id} className="flex justify-between items-center p-4 bg-white rounded-[10px] border border-[rgba(0,0,0,0.03)] hover:shadow-sm transition-all">
                <div>
                  <p className="font-semibold text-[#111] text-[14px]">{expense.desc}</p>
                  <p className="text-[11px] text-[#8E8E93] mt-1">Người trả: <span className="font-medium text-[#5F6368]">{expense.paidBy}</span> • {expense.date}</p>
                </div>
                <div className="font-bold text-[15px] text-[#FF3B30]">
                  - {expense.amount.toLocaleString()} đ
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quyết toán Splitwise */}
        <div className="glass-card p-0 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[rgba(0,0,0,0.04)] bg-white/50">
            <h3 className="text-[16px] font-bold text-[#111]">Bảng Kê Quyết Toán</h3>
            <p className="text-[11px] text-[#8E8E93] mt-1">Hệ thống tối ưu số lần chuyển khoản.</p>
          </div>
          <div className="p-4 bg-[rgba(230,0,45,0.02)] flex-1 flex flex-col">
            <div className="space-y-3 flex-1">
              {dummySplits.map((split, i) => (
                <div key={i} className="p-3 bg-white border border-[rgba(230,0,45,0.08)] rounded-[10px] shadow-sm">
                  <div className="flex items-center justify-between mb-1 text-[12px]">
                    <span className="font-bold text-[#111]">{split.from}</span>
                    <span className="text-[#8E8E93]">cần trả cho</span>
                    <span className="font-bold text-[#E6002D]">{split.to}</span>
                  </div>
                  <div className="text-center font-black text-[18px] text-[#111]">
                    {split.amount.toLocaleString()} đ
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2.5 bg-[#111] text-white rounded-[10px] text-[12px] font-semibold hover:bg-black transition-all shadow-md">
              Sao chép tin nhắn nhóm
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
