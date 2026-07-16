'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  House,
  Users,
  Calendar,
  Heart,
  Settings,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/app-store';

const tabs = [
  { id: 'home', label: 'Trang chủ', icon: House, href: '/dashboard' },
  { id: 'contacts', label: 'Quan hệ', icon: Users, href: '/contacts' },
  { id: 'events', label: 'Sự kiện', icon: Calendar, href: '/events' },
  { id: 'memories', label: 'Ký ức', icon: Heart, href: '/memories' },
  { id: 'settings', label: 'Cài đặt', icon: Settings, href: '/settings' },
] as const;

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  // Determine active tab from pathname
  const currentTab = tabs.find((t) => pathname.startsWith(t.href))?.id || 'home';

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-[88px] safe-area-bottom">
        {/* iOS Dynamic Island spacer */}
        <div className="h-[12px] safe-area-top" />
        {children}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-[100px] right-[20px] z-50 safe-area-bottom">
        <button
          className="w-[56px] h-[56px] rounded-full bg-[#E6002D] text-white shadow-lg
                     flex items-center justify-center
                     transition-all duration-200 active:scale-90
                     hover:shadow-xl hover:scale-105"
          style={{
            boxShadow: '0 4px 16px rgba(230, 0, 45, 0.35)',
          }}
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      </div>

      {/* iOS-style Bottom Tab Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 safe-area-bottom"
        style={{
          background: 'rgba(255, 255, 255, 0.78)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center justify-around px-2 py-[6px]">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex flex-col items-center justify-center gap-[2px] py-[4px] px-[10px] min-w-[52px]',
                  'transition-all duration-200'
                )}
              >
                <div
                  className={cn(
                    'w-[28px] h-[28px] flex items-center justify-center rounded-full transition-all duration-200',
                    isActive && 'bg-[#E6002D]/10'
                  )}
                >
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={cn(
                      'transition-all duration-200',
                      isActive
                        ? 'text-[#E6002D]'
                        : 'text-[#8E8E93]'
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium tracking-tight transition-all duration-200',
                    isActive ? 'text-[#E6002D] font-semibold' : 'text-[#8E8E93]'
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
