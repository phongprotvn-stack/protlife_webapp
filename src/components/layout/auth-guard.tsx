'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { loadSettingsFromServer } from '@/stores/settings-store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const userId = useAuthStore((s) => s.user?.id);
  const [hydrated, setHydrated] = useState(false);
  const [checking, setChecking] = useState(true);

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

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn) {
      router.replace('/login');
    } else {
      setChecking(false);
    }
  }, [isLoggedIn, router, hydrated]);

  // Load settings from Supabase when user logs in
  useEffect(() => {
    if (!checking && userId) {
      loadSettingsFromServer(userId);
    }
  }, [checking, userId]);

  if (checking) {
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
