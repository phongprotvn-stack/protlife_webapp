'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/app-store';

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

export function DesktopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const sidebarOpen = useUIStore((s) => s.isSidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const [searchFocused, setSearchFocused] = useState(false);

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
                  <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                    <span className="text-white text-[11px] font-bold">PL</span>
                  </div>
                  <span className="font-semibold text-[15px] text-[#111]">PROT LIFE</span>
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
          {sidebarOpen && (
            <div className="px-[14px] py-[12px] border-t border-[rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-3">
                <div className="w-[32px] h-[32px] rounded-full bg-[#E6002D] flex items-center justify-center text-white text-[12px] font-semibold">
                  P
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#111] truncate">Prot</p>
                  <p className="text-[11px] text-[#8E8E93] truncate">Admin</p>
                </div>
              </div>
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
            <button
              className="h-[36px] px-[16px] rounded-[10px] bg-[#E6002D] text-white text-[13px] font-semibold
                         hover:opacity-90 active:scale-[0.97] transition-all duration-200 flex items-center gap-[6px]"
            >
              <span>+</span>
              <span>Thêm</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#F8F9FA]">
          {children}
        </main>
      </div>

      {/* Inspector Panel (right sidebar) — optional */}
      {/* <InspectorPanel /> */}
    </div>
  );
}
