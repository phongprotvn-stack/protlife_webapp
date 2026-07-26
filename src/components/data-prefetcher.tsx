'use client';

import { useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
 */
export default function DataPrefetcher() {
  const queryClient = useQueryClient();
  const prefetched = useRef(false);

  useEffect(() => {
    if (prefetched.current) return;
    prefetched.current = true;

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
  }, [queryClient]);

  return null;
}
