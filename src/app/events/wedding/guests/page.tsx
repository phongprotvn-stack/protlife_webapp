import React from 'react'
import { Search, Plus, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Dummy Data
const dummyGuests = [
  { id: 1, name: 'Nguyễn Văn A', group: 'Bạn đại học', status: 'Đã mời', rsvp: 'Tham gia', gift: '1,000,000' },
  { id: 2, name: 'Trần Thị B', group: 'Nhà Gái', status: 'Chưa mời', rsvp: 'Chờ', gift: '-' },
  { id: 3, name: 'Lê Văn C', group: 'Đồng nghiệp', status: 'Đã mời', rsvp: 'Từ chối', gift: '500,000' },
  { id: 4, name: 'Chú Tư', group: 'Nhà Trai', status: 'Đã mời', rsvp: 'Tham gia', gift: '2,000,000' },
]

export default function WeddingGuestsPage() {
  return (
    <div className="page-content min-h-[80vh]">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/events/wedding">
          <button className="w-8 h-8 rounded-full bg-[rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-[rgba(0,0,0,0.08)] transition-colors">
            <ArrowLeft size={18} className="text-[#5F6368]" />
          </button>
        </Link>
        <div>
          <h2 className="text-[22px] font-bold text-[#111] tracking-tight">Danh sách Khách mời</h2>
          <p className="text-[12px] text-[#8E8E93] mt-0.5">Tổng cộng {dummyGuests.length} khách</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
          <input 
            type="search" 
            placeholder="Tìm kiếm khách mời..." 
            className="w-full h-[38px] pl-[34px] pr-[12px] rounded-[8px] bg-white border border-[rgba(0,0,0,0.06)] text-[13px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:border-[#E6002D] transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <button className="flex-1 sm:flex-none h-[38px] px-4 rounded-[8px] bg-white border border-[rgba(0,0,0,0.06)] text-[#5F6368] text-[12px] font-semibold flex items-center justify-center gap-1.5 hover:bg-[rgba(0,0,0,0.02)] transition-all shadow-sm">
            <Users size={16} /> Import từ Danh bạ
          </button>
          <button className="flex-1 sm:flex-none h-[38px] px-4 rounded-[8px] bg-[#E6002D] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#D40028] transition-all shadow-sm">
            <Plus size={16} strokeWidth={2.5} /> Thêm khách
          </button>
        </div>
      </div>

      <div className="glass-card-compact overflow-hidden border border-[rgba(0,0,0,0.04)] rounded-[12px]">
        {/* Desktop Table View */}
        <div className="hidden md:block w-full overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[rgba(0,0,0,0.02)] border-b border-[rgba(0,0,0,0.03)]">
                <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-[#8E8E93] uppercase">Tên khách</th>
                <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-[#8E8E93] uppercase">Nhóm</th>
                <th className="py-2.5 px-4 text-center text-[11px] font-semibold text-[#8E8E93] uppercase">Trạng thái</th>
                <th className="py-2.5 px-4 text-center text-[11px] font-semibold text-[#8E8E93] uppercase">Phản hồi (RSVP)</th>
                <th className="py-2.5 px-4 text-right text-[11px] font-semibold text-[#8E8E93] uppercase">Tiền mừng</th>
              </tr>
            </thead>
            <tbody>
              {dummyGuests.map((guest) => (
                <tr key={guest.id} className="border-b border-[rgba(0,0,0,0.03)] last:border-b-0 hover:bg-[rgba(230,0,45,0.02)] transition-colors">
                  <td className="py-3 px-4">
                    <span className="text-[13px] font-semibold text-[#111]">{guest.name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[12px] text-[#5F6368]">{guest.group}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-[6px] text-[11px] font-medium ${guest.status === 'Đã mời' ? 'bg-[rgba(230,0,45,0.1)] text-[#E6002D]' : 'bg-[rgba(0,0,0,0.06)] text-[#8E8E93]'}`}>
                      {guest.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-[6px] text-[11px] font-medium ${
                      guest.rsvp === 'Tham gia' ? 'bg-[#34C759]/10 text-[#34C759]' : 
                      guest.rsvp === 'Từ chối' ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 
                      'bg-[rgba(0,0,0,0.06)] text-[#8E8E93]'
                    }`}>
                      {guest.rsvp}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-[13px] font-medium text-[#111]">{guest.gift !== '-' ? `+${guest.gift} đ` : '-'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-[rgba(0,0,0,0.03)]">
          {dummyGuests.map((guest) => (
            <div key={guest.id} className="p-4 bg-white">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-[14px] font-bold text-[#111]">{guest.name}</h4>
                  <p className="text-[12px] text-[#5F6368]">{guest.group}</p>
                </div>
                <span className={`inline-block px-2 py-0.5 rounded-[4px] text-[10px] font-medium ${guest.status === 'Đã mời' ? 'bg-[rgba(230,0,45,0.1)] text-[#E6002D]' : 'bg-[rgba(0,0,0,0.06)] text-[#8E8E93]'}`}>
                  {guest.status}
                </span>
              </div>
              <div className="flex justify-between items-center text-[12px] pt-3 border-t border-dashed border-[rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#8E8E93]">RSVP:</span>
                  <span className={`font-semibold ${
                    guest.rsvp === 'Tham gia' ? 'text-[#34C759]' : 
                    guest.rsvp === 'Từ chối' ? 'text-[#FF3B30]' : 
                    'text-[#8E8E93]'
                  }`}>
                    {guest.rsvp}
                  </span>
                </div>
                <div className="font-bold text-[#111]">
                  {guest.gift !== '-' ? `+${guest.gift} đ` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
