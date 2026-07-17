'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { useAppStore } from '@/stores/app-store';
import {
  LayoutDashboard, Users, Calendar, Timeline, Heart, Map,
  Building2, FileText, Target, BarChart3, BrainCircuit, Settings,
  Menu, X, LogOut, Plus, ChevronRight,
} from 'lucide-react';

// ─── Full nav items ───
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'contacts', label: 'Quan hệ', icon: Users, href: '/contacts' },
  { id: 'events', label: 'Sự kiện', icon: Calendar, href: '/events' },
  { id: 'timeline', label: 'Dòng thời gian', icon: Timeline, href: '/timeline' },
  { id: 'memories', label: 'Ký ức', icon: Heart, href: '/memories' },
  { id: 'map', label: 'Bản đồ', icon: Map, href: '/map' },
  { id: 'organizations', label: 'Tổ chức', icon: Building2, href: '/organizations' },
  { id: 'documents', label: 'Tài liệu', icon: FileText, href: '/documents' },
  { id: 'goals', label: 'Mục tiêu', icon: Target, href: '/goals' },
  { id: 'statistical', label: 'Thống kê', icon: BarChart3, href: '/statistical' },
  { id: 'ai-insight', label: 'AI Insight', icon: BrainCircuit, href: '/ai-insight', badge: 'Mới' },
  { id: 'settings', label: 'Cài đặt', icon: Settings, href: '/settings' },
];

// ─── Right Panel Views ───
import { ContactDetail } from '@/components/contacts/contact-detail';
import { EventDetail } from '@/components/events/event-detail';
import { AddContactModal } from '@/components/contacts/add-contact-modal';
import { AddEventModal } from '@/components/events/add-event-modal';

export function DesktopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const addModalType = useAppStore((s) => s.addModalType);
  const setAddModal = useAppStore((s) => s.setAddModal);
  const selectedContactId = useAppStore((s) => s.selectedContactId);
  const selectedEventId = useAppStore((s) => s.selectedEventId);
  const rightPanelView = useAppStore((s) => s.rightPanelView);
  const clearSelection = useAppStore((s) => s.clearSelection);
  const selectContact = useAppStore((s) => s.selectContact);
  const selectEvent = useAppStore((s) => s.selectEvent);
  const setRightPanelView = useAppStore((s) => s.setRightPanelView);

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

  const showRightPanel = rightPanelView === 'detail' || rightPanelView === 'add' || rightPanelView === 'edit';
  const showPanel = selectedContactId !== null || selectedEventId !== null || rightPanelView === 'add';

  return (
    <div className="desktop-layout">
      {/* ═══ SIDEBAR ─ Trái ═══ */}
      <aside className="desktop-sidebar" style={{ padding: '16px 0' }}>
        {/* Logo */}
        <div className="px-4 mb-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-[#E6002D] to-[#FF1A4A] flex items-center justify-center shadow-lg shadow-[rgba(230,0,45,0.25)]">
              <span className="text-white text-[15px] font-bold">PL</span>
            </div>
            <span className="text-[17px] font-bold text-[#111] tracking-tight">PROT LIFE</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.id;
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`fluent-nav-item relative ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#E6002D] text-white">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: User + Version */}
        <div className="mt-auto pt-4 px-4 border-t border-[rgba(0,0,0,0.04)]">
          {user && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-br from-[#E6002D] to-[#FF1A4A] flex items-center justify-center text-white font-bold text-[14px] flex-shrink-0">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[#111] truncate">{user.name || 'Prot'}</p>
                <p className="text-[10px] text-[#8E8E93] truncate">{user.email}</p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-[9px] text-[#B0B0B8] font-medium tracking-[0.2px]">PROT LIFE v1.0.3</p>
            <button onClick={handleLogout} className="p-1 rounded hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]" title="Đăng xuất">
              <LogOut size={14} />
            </button>
          </div>
          <p className="text-[8px] text-[#B0B0B8]/60 mt-0.5">All rights reserved</p>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ─ Giữa ═══ */}
      <main className="desktop-main">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </main>

      {/* ═══ RIGHT PANEL ─ Phải ═══ */}
      <aside className="desktop-panel">
        {showPanel ? (
          <RightPanelContent />
        ) : (
          <RightPanelDefault activeNav={activeNav} user={user} />
        )}
      </aside>

      {/* Modals (mobile fallback) */}
      <AddContactModal open={addModalType === 'contact'} onClose={() => setAddModal(null)} />
      <AddEventModal open={addModalType === 'event'} onClose={() => setAddModal(null)} />
    </div>
  );
}

/* ─── Right Panel ─── */
function RightPanelContent() {
  const selectedContactId = useAppStore((s) => s.selectedContactId);
  const selectedEventId = useAppStore((s) => s.selectedEventId);
  const rightPanelView = useAppStore((s) => s.rightPanelView);
  const clearSelection = useAppStore((s) => s.clearSelection);

  if (selectedContactId) {
    return <ContactDetail contactId={selectedContactId} onClose={clearSelection} panelMode />;
  }
  if (selectedEventId) {
    return <EventDetail eventId={selectedEventId} onClose={clearSelection} panelMode />;
  }
  if (rightPanelView === 'add') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-[#111]">Thêm mới</h3>
          <button onClick={clearSelection} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]">
            <X size={16} />
          </button>
        </div>
        <p className="text-[13px] text-[#8E8E93]">Chọn loại muốn thêm từ menu bên trái.</p>
      </div>
    );
  }
  return null;
}

/* ─── Right Panel Default (no selection) ─── */
function RightPanelDefault({ activeNav, user }: { activeNav: string; user: any }) {
  const navItem = NAV_ITEMS.find(n => n.id === activeNav);
  const Icon = navItem?.icon || LayoutDashboard;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-[rgba(0,0,0,0.04)]">
        <div className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(230,0,45,0.08)] flex items-center justify-center">
          <Icon size={18} className="text-[#E6002D]" />
        </div>
        <div>
          <h3 className="text-[14px] font-semibold text-[#111]">{navItem?.label || 'Tổng quan'}</h3>
          <p className="text-[11px] text-[#8E8E93]">Chi tiết</p>
        </div>
      </div>

      {/* Content hint */}
      <div className="glass-card-compact p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-[rgba(230,0,45,0.05)] mx-auto mb-3 flex items-center justify-center">
          <ChevronRight size={24} className="text-[#E6002D]/40" />
        </div>
        <p className="text-[13px] font-medium text-[#6B7280]">Chọn một mục để xem chi tiết</p>
        <p className="text-[12px] text-[#9CA3AF] mt-1">Click vào thẻ ở cột giữa để hiển thị thông tin tại đây</p>
      </div>

      {/* Quick stats */}
      <div className="glass-card-compact p-4">
        <h4 className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-[0.5px] mb-3">Tổng quan</h4>
        <div className="space-y-2.5">
          <StatRow label="Quan hệ" value="114" color="#007AFF" />
          <StatRow label="Sự kiện" value="27" color="#FF9500" />
          <StatRow label="Ký ức" value="0" color="#FF4D6A" />
        </div>
      </div>

      {/* AI tip */}
      <div className="glass-card-compact p-4">
        <div className="flex items-start gap-3">
          <BrainCircuit size={18} className="text-[#AF52DE] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[13px] font-semibold text-[#111] mb-1">AI Insight</h4>
            <p className="text-[12px] text-[#8E8E93] leading-relaxed">Phân tích thông minh về mối quan hệ và sự kiện.</p>
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
