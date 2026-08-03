'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useSettingsStore, loadSettingsFromServer } from '@/stores/settings-store';

/**
 * AuthGuard — 2 lớp bảo vệ:
 *  1. Đăng nhập: chờ session thật (sessionChecked) trước khi quyết định.
 *  2. Onboarding gate: chỉ cho render children khi ĐÃ biết chắc user
 *     đã onboard (onboarded=true) HOẶC có identity (name/dob). User mới
 *     thật (server không có row / row bị nhiễm) → redirect /onboarding.
 *
 * KHÔNG dùng cờ checking chặn redirect (bug cũ: checking=false set sớm
 * khi hydrate → effect redirect return ngay dòng đầu → onboarding gate
 * chết vĩnh viễn, user luôn vào thẳng dashboard).
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const userId = useAuthStore((s) => s.user?.id);
  const sessionChecked = useAuthStore((s) => s.sessionChecked);
  const onboarded = useSettingsStore((s) => s.onboarded);
  const displayName = useSettingsStore((s) => s.displayName);
  const dob = useSettingsStore((s) => s.dob);
  const settingsLoaded = useSettingsStore((s) => s.settingsLoaded);
  const [hydrated, setHydrated] = useState(false);
  const [ready, setReady] = useState(false); // đủ điều kiện render children
  const lastUserId = useRef<string | null>(null);

  // Wait for zustand persist to finish hydrating from localStorage
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    // If already hydrated, set immediately
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return unsub;
  }, []);

  // ─── Lớp 1: đăng nhập + load settings ───
  useEffect(() => {
    if (!hydrated || !sessionChecked) return;
    const store = useAuthStore.getState();
    if (!store.isLoggedIn) {
      router.replace('/login');
      return;
    }
    const uid = store.user?.id;
    if (!uid) return;

    // User (tài khoản) thay đổi → reset cờ settings để load lại từ đầu,
    // tránh kế thừa trạng thái onboarded/identity của tài khoản trước.
    if (lastUserId.current !== uid) {
      lastUserId.current = uid;
      useSettingsStore.setState({ settingsLoaded: false });
      loadSettingsFromServer(uid);
    } else if (!useSettingsStore.getState().settingsLoaded) {
      loadSettingsFromServer(uid);
    }
  }, [hydrated, sessionChecked, isLoggedIn, userId, router]);

  // ─── Lớp 2: onboarding gate — quyết định redirect / render ───
  useEffect(() => {
    if (!hydrated || !sessionChecked || !isLoggedIn) return;
    if (!settingsLoaded) return; // chờ server settings xong mới quyết định

    if (onboarded) {
      setReady(true);
      return;
    }
    const hasIdentity = (displayName?.trim() || '') !== '' || (dob?.trim() || '') !== '';
    if (hasIdentity) {
      setReady(true);
      return;
    }
    // User mới thật (không onboarded, không name/dob) → bắt buộc onboarding
    if (pathname !== '/onboarding') {
      router.replace('/onboarding');
      return;
    }
    setReady(true); // đã ở /onboarding — hiển thị
  }, [hydrated, sessionChecked, isLoggedIn, settingsLoaded, onboarded, displayName, dob, pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#E6002D]/20 border-t-[#E6002D] animate-spin" />
          <p className="text-[13px] text-[#8E8E93] font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
