'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/login');
    } else {
      setChecking(false);
    }
  }, [isLoggedIn, router]);

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
