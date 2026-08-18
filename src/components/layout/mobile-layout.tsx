'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, CalendarDays,
  BookHeart, MoreHorizontal, X,
  Timeline, Map, Building2,
  FileText, Target, BarChart3,
  Cpu, Settings,
} from 'lucide-react';

const PRIMARY_TABS = [
  { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'contacts',  label: 'Quan hệ',    icon: Users,          href: '/contacts' },
  { id: 'events',    label: 'Sự kiện',   icon: CalendarDays,    href: '/events' },
  { id: 'memories',  label: 'Ký ức',     icon: BookHeart,       href: '/memories' },
];

const MORE_TABS = [
  { id: 'timeline',       label: 'Dòng thời gian', icon: Timeline,    href: '/timeline' },
  { id: 'map',            label: 'Bản đồ',         icon: Map,         href: '/map' },
  { id: 'organizations',  label: 'Tổ chức',        icon: Building2,   href: '/organizations' },
  { id: 'documents',      label: 'Tài liệu',       icon: FileText,    href: '/documents' },
  { id: 'goals',          label: 'Mục tiêu',       icon: Target,      href: '/goals' },
  { id: 'statistical',    label: 'Thống kê',       icon: BarChart3,   href: '/statistical' },
  { id: 'ai-insight',     label: 'AI Insight',     icon: Cpu,         href: '/ai-insight' },
  { id: 'settings',       label: 'Cài đặt',        icon: Settings,    href: '/settings' },
];

const MORE_ROUTES = MORE_TABS.map(t => t.href);

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const activeTab = useMemo(() => {
    const tab = PRIMARY_TABS.find((t) => pathname === t.href || pathname.startsWith(t.href + '/'));
    if (tab) return tab.id;
    if (MORE_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))) return 'more';
    return 'dashboard';
  }, [pathname]);

  const handleMoreClick = useCallback(() => {
    setShowMore(true);
  }, []);

  const handleNavClick = useCallback((href: string) => {
    setShowMore(false);
  }, []);

  return (
    <div className="h-screen h-dvh overflow-hidden flex flex-col pb-[68px]">
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain relative">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-full"
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom sheet overlay */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowMore(false)}
            className="fixed inset-0 z-[99] bg-black/15"
          />
        )}
      </AnimatePresence>

      {/* Bottom sheet — More tabs */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ translateY: '100%' }}
            animate={{ translateY: '0%' }}
            exit={{ translateY: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card fixed bottom-0 left-0 right-0 z-[101] rounded-t-[28px] max-w-[480px] mx-auto p-4 pb-[100px]"
          >
            {/* Handle */}
            <div className="w-[36px] h-[4px] bg-[rgba(0,0,0,0.15)] rounded-full mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[15px] font-bold text-[#111]">Danh mục</span>
              <button
                onClick={() => setShowMore(false)}
                className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-4 gap-2">
              {MORE_TABS.map((tab) => {
                const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    onClick={() => handleNavClick(tab.href)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-[14px] transition-colors ${
                      isActive ? 'bg-[#E6002D]/8' : 'hover:bg-[rgba(0,0,0,0.03)]'
                    }`}
                  >
                    <div className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center"
                      style={{
                        background: isActive ? 'linear-gradient(135deg,#E6002D,#FF1A4A)' : 'rgba(0,0,0,0.04)',
                      }}
                    >
                      <Icon
                        size={20}
                        strokeWidth={isActive ? 2.5 : 1.8}
                        className={isActive ? 'text-white' : 'text-[#8E8E93]'}
                      />
                    </div>
                    <span className={`text-[10px] font-medium leading-tight text-center ${
                      isActive ? 'text-[#E6002D]' : 'text-[#8E8E93]'
                    }`}>
                      {tab.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav bar */}
      <nav className="tab-bar-glass">
        {PRIMARY_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`tab-item ${isActive ? 'active' : ''}`}
            >
              <div className="tab-icon">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={isActive ? 'text-[#E6002D]' : 'text-[#8E8E93]'}
                />
              </div>
              <span className="text-[10px] font-medium leading-tight mt-0.5">{tab.label}</span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={handleMoreClick}
          className={`tab-item ${activeTab === 'more' ? 'active' : ''}`}
        >
          <div className="tab-icon">
            <MoreHorizontal
              size={22}
              strokeWidth={activeTab === 'more' ? 2.5 : 1.8}
              className={activeTab === 'more' ? 'text-[#E6002D]' : 'text-[#8E8E93]'}
            />
          </div>
          <span className="text-[10px] font-medium leading-tight mt-0.5">Thêm</span>
        </button>
      </nav>
    </div>
  );
}
