'use client';

import { useQuery } from '@tanstack/react-query';
import { contactService } from '@/lib/services/contact-service';
import { eventService } from '@/lib/services/event-service';

/**
 * DataPrefetcher — preloads critical data at the app root so every page
 * has data ready (or stale-cached) the moment the user navigates to it.
 *
 * Renders nothing. Lives inside <Providers> so TanStack Query is available.
 */
export default function DataPrefetcher() {
  // Contacts — used by events/add, dashboard, contacts page
  useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactService.getAll(),
    staleTime: 1000 * 60 * 5,
    retry: 3,
  });

  // Events — used by dashboard, events page, timeline
  useQuery({
    queryKey: ['events'],
    queryFn: () => eventService.getAll(),
    staleTime: 1000 * 60 * 5,
    retry: 3,
  });

  return null;
}
