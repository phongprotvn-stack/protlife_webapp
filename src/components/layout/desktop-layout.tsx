'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import {
  LayoutDashboard, Users, Calendar, BrainCircuit, Settings,
  Heart, Target, FileText, Building2, Menu, X, LogOut,
  Sparkles, Search,
} from 'lucide-react';
import { AddContactModal } from '@/components/contacts/add-contact-modal';
import { AddEventModal } from '@/components/events/add-event-modal';
import { useAppStore } from '@/stores/app-store';

interface NavItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'contacts', label: 'Quan hệ', icon: Users, href: '/contacts' },
  { id: 'events', label: 'Sự kiện', icon: Calendar, href: '/events' },
  { id: 'memories', label: 'Ký ức', icon: Heart, href: '/memories' },
  { id: 'ai-insight', label: 'AI Insight', icon: BrainCircuit, href: '/ai-insight', badge: 'Mới' },
  { id: 'organizations', label: 'Tổ chức', icon: Building2, href: '/organizations' },
  { id: 'documents', label: 'Tài liệu', icon: FileText, href: '/documents' },
  { id: 'goals', label: 'Mục tiêu', icon: Target, href: '/goals' },
];

const ADD_ITEMS = [
  { id: 'contact', label: 'Quan hệ mới', icon: Users },
  { id: 'event', label: 'Sự kiện mới', icon: Calendar },
  { id: 'memory', label: 'Ký ức mới', icon: Heart },
  { id: 'document', label: 'Tài liệu mới', icon: FileText },
  { id: 'goal', label: 'Mục tiêu mới', icon: Target },
];

export function DesktopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setAddModal = useAppStore((s) => s.setAddModal);
  const addModalType = useAppStore((s) => s.addModalType);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const activeNav = useMemo(() => {
    const n = NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(item.href + '/'));
    return n?.id || 'dashboard';
  }, [pathname]);

  const handleLogout = async () => {
    const { supabase } = await import('@/lib/supabase/client');
    await supabase.auth.signOut();
    logout();
    router.push('/login');
  };

  const handleAddClick = (id: string) => {
    if (id === 'contact' || id === 'event') {
      setAddModal(id);
    } else {
      // Toast for others
      const el = document.createElement('div');
      el.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-[14px] bg-[#111] text-white text-[13px] font-medium shadow-lg';
      el.textContent = 'Chức năng đang phát triển';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    }
  };

  return (
    <div className="desktop-layout">
      {/* Sidebar */}
      <aside className={`desktop-sidebar ${sidebarCollapsed ? 'w-[60px]' : ''}`}>
        {/* Logo */}
        <div className="flex items-center justify-between mb-6 px-2">
          {!sidebarCollapsed && (
            <div>
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-[32px] h-[32px] rounded-[10px] bg-gradient-to-br from-[#E6002D] to-[#FF1A4A] flex items-center justify-center shadow-lg shadow-[rgba(230,0,45,0.25)]">
                  <span className="text-white text-[14px] font-bold">PL</span>
                </div>
                <span className="text-[16px] font-bold text-[#111] tracking-tight">PROT LIFE</span>
              </Link>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]"
          >
            <Menu size={16} />
          </button>
        </div>

        {/* User card */}
        {!sidebarCollapsed && user && (
          <div className="glass-card-compact p-3 mb-4 flex items-center gap-3">
            <div className="w-[40px] h-[40px] rounded-full bg-gradient-to-br from-[#E6002D] to-[#FF1A4A] flex items-center justify-center text-white font-bold text-[16px] flex-shrink-0">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#111] truncate">{user.name}</p>
              <p className="text-[11px] text-[#8E8E93] truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.id;
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`fluent-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                {!sidebarCollapsed && (
                  <span className="flex-1">{item.label}</span>
                )}
                {!sidebarCollapsed && item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#E6002D] text-white">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Add buttons */}
        {!sidebarCollapsed && (
          <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.04)] space-y-1">
            <p className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-[0.5px] px-2 mb-2">Thêm</p>
            {ADD_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleAddClick(item.id)}
                  className="fluent-nav-item w-full text-left"
                >
                  <Icon size={16} className="text-[#5F6368]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Logout */}
        {!sidebarCollapsed && (
          <div className="mt-auto pt-4 border-t border-[rgba(0,0,0,0.04)]">
            <button onClick={handleLogout} className="fluent-nav-item w-full text-left">
              <LogOut size={16} className="text-[#E6002D]" />
              <span className="text-[#E6002D]">Đăng xuất</span>
            </button>
            {/* Version */}
            <p className="text-[10px] text-[#B0B0B8] text-center mt-3 tracking-[0.2px]">
              PROT LIFE v1.0.3
            </p>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="desktop-main">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="p-4 md:p-6 max-w-5xl mx-auto"
        >
          {children}
        </motion.div>
      </main>

      {/* Right panel (3-column) - shows quick info */}
      <aside className="desktop-panel hidden lg:block">
        <RightPanel activeNav={activeNav} />
      </aside>

      {/* Modals */}
      <AddContactModal
        open={addModalType === 'contact'}
        onClose={() => setAddModal(null)}
      />
      <AddEventModal
        open={addModalType === 'event'}
        onClose={() => setAddModal(null)}
      />
    </div>
  );
}

/* Right Panel Component */
function RightPanel({ activeNav }: { activeNav: string }) {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-4">
      {/* Profile widget */}
      <div className="glass-card-compact p-4 text-center">
        <div className="w-[56px] h-[56px] rounded-full bg-gradient-to-br from-[#E6002D] to-[#FF1A4A] flex items-center justify-center text-white font-bold text-[22px] mx-auto mb-2">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <h3 className="text-[15px] font-semibold text-[#111]">{user?.name}</h3>
        <p className="text-[12px] text-[#8E8E93]">{user?.email}</p>
      </div>

      {/* Quick stats */}
      <div className="glass-card-compact p-4">
        <h4 className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-[0.5px] mb-3">
          Tổng quan
        </h4>
        <div className="space-y-3">
          <StatRow label="Quan hệ" value="114" color="#007AFF" />
          <StatRow label="Sự kiện" value="27" color="#FF9500" />
          <StatRow label="Ký ức" value="0" color="#FF4D6A" />
        </div>
      </div>

      {/* Tip */}
      <div className="glass-card-compact p-4">
        <div className="flex items-start gap-3">
          <Sparkles size={18} className="text-[#FF9500] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[13px] font-semibold text-[#111] mb-1">AI Insight</h4>
            <p className="text-[12px] text-[#8E8E93] leading-relaxed">
              Khám phá những phân tích thông minh về mối quan hệ và sự kiện của bạn.
            </p>
            <Link href="/ai-insight" className="inline-block mt-2 text-[12px] font-medium text-[#E6002D] hover:underline">
              Khám phá →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-[#5F6368]">{label}</span>
      <span className="text-[15px] font-bold" style={{ color }}>{value}</span>
    </div>
  );
}
