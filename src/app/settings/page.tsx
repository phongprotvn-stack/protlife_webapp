'use client';

import { Settings, User, Bell, Shield, Database, Palette, Info } from 'lucide-react';

const settingsSections = [
  {
    id: 'profile',
    title: 'Hồ sơ',
    icon: User,
    items: [
      { label: 'Thông tin cá nhân', description: 'Tên, email, ảnh đại diện' },
      { label: 'Đổi mật khẩu', description: 'Cập nhật mật khẩu đăng nhập' },
      { label: 'Ngôn ngữ', description: 'Tiếng Việt' },
    ],
  },
  {
    id: 'notifications',
    title: 'Thông báo',
    icon: Bell,
    items: [
      { label: 'Nhắc nhở sinh nhật', description: 'Bật thông báo sinh nhật sắp tới' },
      { label: 'Nhắc nhở gặp gỡ', description: 'Nhắc khi đã lâu không gặp' },
    ],
  },
  {
    id: 'privacy',
    title: 'Quyền riêng tư',
    icon: Shield,
    items: [
      { label: 'Dữ liệu cá nhân', description: 'Quản lý dữ liệu và quyền riêng tư' },
      { label: 'Sao lưu dữ liệu', description: 'Sao lưu và khôi phục dữ liệu' },
    ],
  },
  {
    id: 'database',
    title: 'Dữ liệu',
    icon: Database,
    items: [
      { label: 'Import dữ liệu', description: 'Nhập từ Excel, CSV' },
      { label: 'Export dữ liệu', description: 'Xuất ra Excel, PDF' },
    ],
  },
  {
    id: 'appearance',
    title: 'Giao diện',
    icon: Palette,
    items: [
      { label: 'Chế độ sáng/tối', description: 'Tự động theo hệ thống' },
      { label: 'Theme', description: 'PROT LIFE Red' },
    ],
  },
  {
    id: 'about',
    title: 'Thông tin ứng dụng',
    icon: Info,
    items: [
      { label: 'Phiên bản', description: 'v1.0.3' },
      { label: 'Giới thiệu', description: 'PROT LIFE - Hệ điều hành cuộc sống cá nhân' },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-[12px] bg-[#8E8E93]/10 flex items-center justify-center">
          <Settings size={20} className="text-[#8E8E93]" />
        </div>
        <h1 className="text-[26px] font-bold text-[#111] tracking-tight">Cài đặt</h1>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.id} className="card-ios !p-0 overflow-hidden">
              {/* Section Header */}
              <div className="flex items-center gap-3 px-5 pt-4 pb-2">
                <Icon size={16} className="text-[#8E8E93]" />
                <h2 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">
                  {section.title}
                </h2>
              </div>

              {/* Items */}
              <div>
                {section.items.map((item, i) => (
                  <button
                    key={item.label}
                    className="w-full flex items-center justify-between px-5 py-[14px] hover:bg-[rgba(0,0,0,0.02)] active:bg-[rgba(0,0,0,0.04)] transition-all border-t border-[rgba(0,0,0,0.04)] text-left"
                  >
                    <div>
                      <p className="text-[15px] font-medium text-[#111]">{item.label}</p>
                      <p className="text-[12px] text-[#8E8E93] mt-0.5">{item.description}</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
