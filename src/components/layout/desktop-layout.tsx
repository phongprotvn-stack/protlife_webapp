'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { useAppStore } from '@/stores/app-store';
import { ContactDetail } from '@/components/contacts/contact-detail';
import { EventDetail } from '@/components/events/event-detail';
import {
  LayoutDashboard, Users, CalendarDays, Timeline, Map, Building2,
  FileText, Target, BarChart3, Cpu, Settings, Plus, LogOut,
  Sparkles, BookHeart
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Trang chủ',   icon: LayoutDashboard,  href: '/dashboard' },
  { label: 'Quan hệ',     icon: Users,            href: '/contacts' },
  { label: 'Sự kiện',     icon: CalendarDays,     href: '/events' },
  { label: 'Dòng thời gian', icon: Timeline,      href: '/timeline' },
  { label: 'Ký ức',       icon: BookHeart,        href: '/memories' },
  { label: 'Bản đồ',      icon: Map,              href: '/map' },
  { label: 'Tổ chức',     icon: Building2,        href: '/organizations' },
  { label: 'Tài liệu',    icon: FileText,         href: '/documents' },
  { label: 'Mục tiêu',    icon: Target,           href: '/goals' },
  { label: 'Thống kê',    icon: BarChart3,        href: '/statistical' },
  { label: 'AI Insight',  icon: Cpu,              href: '/ai-insight' },
  { label: 'Cài đặt',     icon: Settings,         href: '/settings' },
];

const ADD_ITEMS = [
  { label: 'Quan hệ mới',    icon: Users,        href: '/contacts/add' },
  { label: 'Sự kiện mới',    icon: CalendarDays, href: '/events/add' },
  { label: 'Ký ức mới',      icon: BookHeart,    href: '/memories/add' },
  { label: 'Tổ chức mới',    icon: Building2,    href: '/organizations/add' },
  { label: 'Tài liệu mới',   icon: FileText,     href: '/documents/add' },
  { label: 'Mục tiêu mới',   icon: Target,       href: '/goals/add' },
];

export function DesktopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const {
    selectedContactId, selectedEventId,
    rightPanelView, clearSelection,
  } = useAppStore();

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  useEffect(() => { clearSelection(); }, [pathname, clearSelection]);

  const handleLogout = useCallback(() => {
    logout(); router.push('/login');
  }, [logout, router]);

  const handleAddClick = (href: string) => {
    setShowAddMenu(false);
    router.push(href);
  };

  const hasSelection = selectedContactId || selectedEventId;

  return (
    <div className="desktop-layout">
      {/* ─── SIDEBAR ─── */}
      <aside className="desktop-sidebar">
        <div className="flex flex-col h-full">
          <div className="px-4 py-3 flex items-center gap-2.5 border-b border-[rgba(0,0,0,0.04)]">
            <div className="w-[28px] h-[28px] rounded-[8px] bg-gradient-to-br from-[#E6002D] to-[#FF4D6A] flex items-center justify-center text-white font-bold text-[13px]">P</div>
            <span className="text-[14px] font-semibold text-[#111]">Prot Life</span>
          </div>

          <nav className="flex-1 overflow-y-auto py-1 px-2 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <button key={item.href} onClick={() => router.push(item.href)}
                  className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-[8px] text-[13px] font-medium transition-all text-left ${
                    isActive
                      ? 'bg-[rgba(230,0,45,0.06)] text-[#E6002D] font-semibold'
                      : 'text-[#5F6368] hover:bg-[rgba(0,0,0,0.03)]'
                  }`}>
                  <item.icon size={16} className={isActive ? 'text-[#E6002D]' : 'text-[#8E8E93]'} />
                  <span>{item.label}</span>
                  {isActive && <div className="ml-auto w-[3px] h-3 rounded-full bg-[#E6002D]" />}
                </button>
              );
            })}
          </nav>

          <div className="px-3 py-3 border-t border-[rgba(0,0,0,0.04)]">
            {user ? (
              <div className="flex items-center gap-2.5 px-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E6002D] to-[#FF4D6A] flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                  {(user.name || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[#111] truncate">{user.name || 'Prot'}</p>
                  <p className="text-[10px] text-[#8E8E93] truncate">{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E6002D] to-[#FF4D6A] flex items-center justify-center text-white text-[15px] font-bold">🤡</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[#111]">FREE</p>
                  <p className="text-[10px] text-[#8E8E93]">Chưa đăng nhập</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mt-2 px-2">
              <span className="text-[9px] text-[#B0B0B8] font-medium">PROT LIFE v1.0.3</span>
              <span className="text-[9px] text-[#B0B0B8] font-medium">All rights reserved</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="desktop-main">
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-[rgba(0,0,0,0.04)] bg-white/80 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-semibold text-[#111]">
              {NAV_ITEMS.find(i => pathname === i.href || pathname.startsWith(i.href + '/'))?.label || 'Prot Life'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowAddMenu(!showAddMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#E6002D] text-white text-[12px] font-medium hover:bg-[#CC0028] transition-colors">
                <Plus size={14} /> Thêm
              </button>
              {showAddMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-[180px] bg-white rounded-[10px] shadow-lg border border-[rgba(0,0,0,0.06)] py-1 z-50 overflow-hidden">
                    {ADD_ITEMS.map((item) => (
                      <button key={item.label} onClick={() => handleAddClick(item.href)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-[#5F6368] hover:bg-[rgba(0,0,0,0.03)] transition-colors">
                        <item.icon size={14} className="text-[#8E8E93]" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button onClick={handleLogout}
              className="p-1.5 rounded-[8px] text-[#8E8E93] hover:bg-[rgba(0,0,0,0.04)]">
              <LogOut size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </main>

      {/* ─── RIGHT PANEL ─── */}
      <aside className={`desktop-panel ${hasSelection ? 'open' : ''}`}>
        <div className="h-full overflow-y-auto">
          {selectedContactId ? (
            <ContactDetail contactId={selectedContactId === 'new' ? null : selectedContactId}
              onClose={() => useAppStore.getState().clearSelection()} panelMode />
          ) : selectedEventId ? (
            <EventDetail eventId={selectedEventId === 'new' ? null : selectedEventId}
              onClose={() => useAppStore.getState().clearSelection()} panelMode />
          ) : (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[rgba(230,0,45,0.06)] flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-[#E6002D]/30" />
              </div>
              <p className="text-[14px] font-medium text-[#6B7280]">Chọn mục để xem chi tiết</p>
              <p className="text-[12px] text-[#9CA3AF] mt-1 max-w-[200px]">
                Click vào một thẻ Quan hệ hoặc Sự kiện để xem thông tin chi tiết tại đây
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
