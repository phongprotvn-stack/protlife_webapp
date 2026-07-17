'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  Heart,
  Building2,
  FileText,
  Target,
  BarChart3,
  Settings,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  Plus,
  UserPlus,
  CalendarPlus,
  CirclePlus,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase/client';
import { AddContactModal } from '@/components/contacts/add-contact-modal';
import { AddEventModal } from '@/components/events/add-event-modal';

const sidebarLinks = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'contacts', label: 'Quan hệ', icon: Users, href: '/contacts' },
  { id: 'events', label: 'Sự kiện', icon: Calendar, href: '/events' },
  { id: 'timeline', label: 'Dòng thời gian', icon: Clock, href: '/timeline' },
  { id: 'memories', label: 'Ký ức', icon: Heart, href: '/memories' },
  { id: 'organizations', label: 'Tổ chức', icon: Building2, href: '/organizations' },
  { id: 'documents', label: 'Tài liệu', icon: FileText, href: '/documents' },
  { id: 'goals', label: 'Mục tiêu', icon: Target, href: '/goals' },
  { id: 'statistical', label: 'Thống kê', icon: BarChart3, href: '/statistical' },
  { id: 'settings', label: 'Cài đặt', icon: Settings, href: '/settings' },
];

const ADD_MENU_ITEMS = [
  { id: 'contact', label: 'Quan hệ mới', icon: UserPlus, color: '#007AFF' },
  { id: 'event', label: 'Sự kiện mới', icon: CalendarPlus, color: '#FF9500' },
  { id: 'document', label: 'Tài liệu mới', icon: CirclePlus, color: '#5856D6' },
  { id: 'goal', label: 'Mục tiêu mới', icon: CirclePlus, color: '#34C759' },
];

export function DesktopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarOpen = useUIStore((s) => s.isSidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const [searchFocused, setSearchFocused] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addModalType = useAppStore((s) => s.addModalType);
  const setAddModal = useAppStore((s) => s.setAddModal);
  const [toast, setToast] = useState<string | null>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  const { isLoggedIn, user, logout } = useAuthStore();

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Close add menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    router.push('/login');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      {/* Sidebar - Notion/Linear style */}
      <aside
        className={cn(
          'flex-shrink-0 border-r border-[rgba(0,0,0,0.06)] bg-white transition-all duration-300 ease-in-out overflow-hidden',
          sidebarOpen ? 'w-[240px]' : 'w-[56px]'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className={cn(
            'flex items-center h-[56px] px-[14px] border-b border-[rgba(0,0,0,0.04)]',
            !sidebarOpen && 'justify-center px-0'
          )}>
            {sidebarOpen ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  {/* Logo: default 🤡+FREE, logged in = avatar+name */}
                  {isLoggedIn && user ? (
                    <>
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[14px]"
                        style={{ background: '#5856D6' }}
                      >
                        <span className="text-white text-[10px] font-bold">{user.name[0]}</span>
                      </div>
                      <span className="font-semibold text-[15px] text-[#111]">{user.name}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-7 h-7 rounded-lg bg-[rgba(0,0,0,0.06)] flex items-center justify-center text-[14px]">
                        🤡
                      </div>
                      <span className="font-semibold text-[15px] text-[#8E8E93]">FREE</span>
                    </>
                  )}
                </div>
                <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]">
                  <ChevronLeft size={18} />
                </button>
              </div>
            ) : (
              <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]">
                <Menu size={18} />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-[8px] py-[12px] space-y-[2px]">
            {sidebarLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  className={cn(
                    'sidebar-link',
                    isActive && 'active',
                    !sidebarOpen && 'justify-center px-0'
                  )}
                  title={!sidebarOpen ? link.label : undefined}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  {sidebarOpen && <span>{link.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          {sidebarOpen ? (
            <div className="px-[14px] py-[12px] border-t border-[rgba(0,0,0,0.04)]">
              {/* User info */}
              <div className="flex items-center gap-3">
                {isLoggedIn && user ? (
                  <>
                    <div
                      className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-white text-[12px] font-semibold flex-shrink-0"
                      style={{ background: '#5856D6' }}
                    >
                      {user.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#111] truncate">{user.name}</p>
                      <p className="text-[11px] text-[#8E8E93] truncate">{user.email}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-[32px] h-[32px] rounded-full bg-[rgba(0,0,0,0.04)] flex items-center justify-center text-[16px] flex-shrink-0">
                      🤡
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#111] truncate">FREE</p>
                      <p className="text-[11px] text-[#8E8E93] truncate">Chưa đăng nhập</p>
                    </div>
                  </>
                )}
              </div>

              {/* Logout button */}
              {isLoggedIn && (
                <button
                  onClick={handleLogout}
                  className="mt-[8px] w-full flex items-center gap-2 px-3 py-[7px] rounded-[10px] text-[12px] font-medium text-[#8E8E93] hover:bg-[rgba(0,0,0,0.04)] hover:text-[#E6002D] transition-all"
                >
                  <LogOut size={14} />
                  Đăng xuất
                </button>
              )}

              {/* Version footer */}
              <div className="mt-[10px] pt-[10px] border-t border-[rgba(0,0,0,0.03)]">
                <p className="text-[10px] text-[#8E8E93]/60 text-center font-medium tracking-[0.3px] select-none">
                  © 2026 PROT LIFE v1.0.1
                </p>
                <p className="text-[9px] text-[#8E8E93]/40 text-center -mt-[2px]">
                  All right reserved
                </p>
              </div>
            </div>
          ) : (
            <div className="pb-[12px] flex flex-col items-center gap-[6px]">
              {isLoggedIn && user ? (
                <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-white text-[12px] font-semibold"
                  style={{ background: '#5856D6' }}>
                  {user.name[0]}
                </div>
              ) : (
                <div className="w-[32px] h-[32px] rounded-full bg-[rgba(0,0,0,0.04)] flex items-center justify-center text-[16px]">
                  🤡
                </div>
              )}
              <span className="text-[8px] text-[#8E8E93]/50 font-medium tracking-[0.2px]"
                title={isLoggedIn ? user?.name : 'FREE'}>
                {isLoggedIn ? user?.name[0]?.toLowerCase() || 'u' : 'v1.0.1'}
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="flex items-center h-[56px] px-[20px] border-b border-[rgba(0,0,0,0.04)] bg-white">
          {/* Search */}
          <div className="relative flex-1 max-w-[360px]">
            <Search size={16} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#8E8E93]" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={cn(
                'w-full h-[36px] pl-[36px] pr-[12px] rounded-[10px]',
                'text-[14px] text-[#111] placeholder:text-[#8E8E93]',
                'bg-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.06)]',
                'focus:outline-none focus:ring-2 focus:ring-[#E6002D]/20 focus:bg-white',
                'border border-transparent focus:border-[#E6002D]/30',
                'transition-all duration-200'
              )}
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-[8px] ml-auto">
            <button className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.06)] flex items-center justify-center transition-all duration-200">
              <Bell size={18} className="text-[#8E8E93]" />
            </button>
            {/* Add button with dropdown */}
            <div className="relative" ref={addMenuRef}>
              <button
                onClick={() => setAddMenuOpen(!addMenuOpen)}
                className="h-[36px] px-[16px] rounded-[10px] bg-[#E6002D] text-white text-[13px] font-semibold
                           hover:opacity-90 active:scale-[0.97] transition-all duration-200 flex items-center gap-[6px]"
              >
                <Plus size={16} />
                <span>Thêm</span>
              </button>
              {/* Dropdown menu */}
              {addMenuOpen && (
                <div
                  className="absolute top-full right-0 mt-[6px] w-[220px] rounded-[14px] py-[6px] z-50"
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
                  }}
                >
                  {ADD_MENU_ITEMS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAddMenuOpen(false);
                        if (item.id === 'contact' || item.id === 'event') {
                          setAddModal(item.id);
                        } else {
                          setToast(`Chức năng "${item.label}" đang phát triển`);
                        }
                      }}
                      className="w-full flex items-center gap-3 px-[14px] py-[10px] text-[13px] font-medium text-[#111] hover:bg-[rgba(0,0,0,0.04)] transition-colors"
                    >
                      <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center"
                        style={{ background: `${item.color}10` }}>
                        <item.icon size={15} style={{ color: item.color }} />
                      </div>
                      {item.label}
                    </button>
                  ))}
                  <div className="mx-[14px] my-[4px] h-[1px] bg-[rgba(0,0,0,0.04)]" />
                  <button
                    onClick={() => setAddMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-[14px] py-[10px] text-[13px] font-medium text-[#8E8E93] hover:bg-[rgba(0,0,0,0.04)] transition-colors"
                  >
                    <HelpCircle size={15} />
                    Hướng dẫn thêm
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#F8F9FA]">
          {children}
        </main>
      </div>

      {/* Inspector Panel (right sidebar) — optional */}
      {/* <InspectorPanel /> */}

      {/* Add Modals */}
      <AddContactModal
        open={addModalType === 'contact'}
        onClose={() => setAddModal(null)}
      />
      <AddEventModal
        open={addModalType === 'event'}
        onClose={() => setAddModal(null)}
      />

      {/* Coming soon for Documents & Goals */}
      {toast && (
        <div className="fixed bottom-[80px] left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-[14px] bg-[#111] text-white text-[13px] font-medium shadow-lg animate-[fadeInUp_0.3s_ease]">
          {toast}
        </div>
      )}
    </div>
  );
}
