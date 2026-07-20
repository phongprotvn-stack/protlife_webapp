import { supabase } from '@/lib/supabase/client';

export interface AppDataStats {
  contacts: number;
  events: number;
  memories: number;
  places: number;
  storageDbMb: number;
  storageFileMb: number;
  totalDbMb: number;
  totalFileMb: number;
  isEstimate: boolean;
}

export const settingsService = {
  /**
   * Fetch real data counts from Supabase tables
   */
  async getDataStats(): Promise<AppDataStats> {
    const [contactsRes, eventsRes, memoriesRes] = await Promise.all([
      supabase.from('contacts').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('memories').select('*', { count: 'exact', head: true }),
    ]);

    // Estimate storage: ~8KB per contact, ~4KB per event, ~6KB per memory (rough)
    const contactCount = contactsRes.count ?? 0;
    const eventCount = eventsRes.count ?? 0;
    const memoryCount = memoriesRes.count ?? 0;

    const dbBytes = contactCount * 8000 + eventCount * 4000 + memoryCount * 6000;
    const dbMb = Math.round((dbBytes / (1024 * 1024)) * 10) / 10;

    return {
      contacts: contactCount,
      events: eventCount,
      memories: memoryCount,
      places: 0, // Not implemented yet
      storageDbMb: Math.min(dbMb, 500),
      storageFileMb: Math.min(dbMb * 0.3, 100), // rough file estimate
      totalDbMb: 500,
      totalFileMb: 1024, // 1GB
      isEstimate: true,
    };
  },

  /**
   * Fetch user email from auth
   */
  async getUserEmail(): Promise<string | null> {
    const { data } = await supabase.auth.getUser();
    return data?.user?.email ?? null;
  },
};
