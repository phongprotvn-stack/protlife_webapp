'use client';

import { useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { contactService } from '@/lib/services/contact-service';
import { eventService } from '@/lib/services/event-service';
import { memoryService } from '@/lib/services/memory-service';
import { goalService } from '@/lib/services/goal-service';
import { organizationService } from '@/lib/services/organization-service';
import { documentService } from '@/lib/services/document-service';

/**
 * DataPrefetcher — preloads ALL critical data at the app root so every page
 * has data ready (or stale-cached) the moment the user navigates to it.
 *
 * Uses prefetchQuery (not useQuery) so the data is loaded into the cache
 * without subscribing to it. The page-level useQuery will find the data
 * already cached and return it immediately.
 *
 * ⚠️ CHỈ prefetch SAU KHI session thật đã được restore (sessionChecked &&
 * isLoggedIn && userId). Bug cũ: prefetch chạy ngay khi mount, trước khi
 * supabase có session → query chạy với anon role → RLS trả [] → cache rỗng
 * 30 phút → dashboard/mọi trang hiển thị KHÔNG có dữ liệu dù đã đăng nhập.
 */
export default function DataPrefetcher() {
  const queryClient = useQueryClient();
  const sessionChecked = useAuthStore((s) => s.sessionChecked);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const userId = useAuthStore((s) => s.user?.id);
  const prefetchedFor = useRef<string | null>(null);

  useEffect(() => {
    // Chỉ prefetch khi session thật đã xong và có user
    if (!sessionChecked || !isLoggedIn || !userId) return;
    // Mỗi tài khoản chỉ prefetch 1 lần (tránh refetch khi state rung)
    if (prefetchedFor.current === userId) return;
    prefetchedFor.current = userId;

    // Tài khoản đổi → dọn cache cũ của tài khoản trước (tránh lộ dữ liệu)
    queryClient.removeQueries();

    const prefetchAll = async () => {
      // Fire all prefetches in parallel
      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: ['contacts'],
          queryFn: () => contactService.getAll(),
          staleTime: 1000 * 60 * 30,
        }),
        queryClient.prefetchQuery({
          queryKey: ['events'],
          queryFn: () => eventService.getAll(),
          staleTime: 1000 * 60 * 30,
        }),
        queryClient.prefetchQuery({
          queryKey: ['memories'],
          queryFn: () => memoryService.getAll(),
          staleTime: 1000 * 60 * 30,
        }),
        queryClient.prefetchQuery({
          queryKey: ['goals'],
          queryFn: () => goalService.getAll(),
          staleTime: 1000 * 60 * 30,
        }),
        queryClient.prefetchQuery({
          queryKey: ['organizations'],
          queryFn: () => organizationService.getAll(),
          staleTime: 1000 * 60 * 30,
        }),
        queryClient.prefetchQuery({
          queryKey: ['documents'],
          queryFn: () => documentService.getAll(),
          staleTime: 1000 * 60 * 30,
        }),
      ]);
    };

    prefetchAll();
  }, [queryClient, sessionChecked, isLoggedIn, userId]);

  return null;
}
