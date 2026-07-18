'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Calendar,
  BrainCircuit, History,
} from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'contacts', label: 'Quan hệ', icon: Users, href: '/contacts' },
  { id: 'events', label: 'Sự kiện', icon: Calendar, href: '/events' },
  { id: 'ai-insight', label: 'AI Insight', icon: BrainCircuit, href: '/ai-insight' },
  { id: 'timeline', label: 'Dòng thời gian', icon: History, href: '/timeline' },
];

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const activeTab = useMemo(() => {
    const tab = TABS.find((t) => pathname === t.href || pathname.startsWith(t.href + '/'));
    return tab?.id || 'dashboard';
  }, [pathname]);

  return (
    <div className="min-h-screen min-h-dvh flex flex-col pb-[68px]">
      <main className="flex-1 overflow-y-auto">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </main>

      <nav className="tab-bar-glass">
        {TABS.map((tab) => {
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
      </nav>
    </div>
  );
}
