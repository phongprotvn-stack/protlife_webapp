'use client';

import { supabase } from '@/lib/supabase/client';
import type { Memory, MemoryFormData, MemoryWithEvent } from '@/types/database';

// Sequence-based ID generator (client-side fallback)
function generateMemoryID(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MEM${timestamp}${random}`;
}

export const memoryService = {
  async getAll(): Promise<Memory[]> {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .order('CreatedDate', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  /**
   * Get all memories with their linked event info (for Memory Wheel)
   */
  async getAllWithEvent(): Promise<MemoryWithEvent[]> {
    const { data, error } = await supabase
      .from('memories')
      .select(`
        *,
        events!memories_EventID_fkey (Title, StartDate, EventType)
      `)
      .order('CreatedDate', { ascending: false });
    if (error) throw error;
    // Transform the joined data
    return (data || []).map((m: any) => ({
      MemoryID: m.MemoryID,
      EventID: m.EventID,
      Title: m.Title,
      Content: m.Content,
      Image: m.Image,
      Mood: m.Mood,
      MoodEmoji: m.MoodEmoji,
      CreatedDate: m.CreatedDate,
      UpdatedDate: m.UpdatedDate,
      user_id: m.user_id,
      EventTitle: m.events?.Title || undefined,
      EventDate: m.events?.StartDate || undefined,
      EventType: m.events?.EventType || undefined,
    }));
  },

  async getById(id: string): Promise<Memory | null> {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('MemoryID', id)
      .single();
    if (error) return null;
    return data;
  },

  /**
   * Check if an event already has a memory linked to it
   */
  async getByEventId(eventId: string): Promise<Memory | null> {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('EventID', eventId)
      .maybeSingle();
    if (error) return null;
    return data;
  },

  async create(data: MemoryFormData): Promise<Memory> {
    const now = new Date().toISOString();
    const memory: Memory = {
      MemoryID: generateMemoryID(),
      EventID: data.EventID || null,
      Title: data.Title,
      Content: data.Content || null,
      Image: data.Image || null,
      Mood: data.Mood || null,
      MoodEmoji: data.MoodEmoji || null,
      CreatedDate: now,
      UpdatedDate: now,
    };
    const { data: result, error } = await supabase
      .from('memories')
      .insert(memory)
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  async update(id: string, data: Partial<MemoryFormData>): Promise<Memory> {
    const updates: any = { UpdatedDate: new Date().toISOString() };
    if (data.Title !== undefined) updates.Title = data.Title;
    if (data.Content !== undefined) updates.Content = data.Content;
    if (data.Image !== undefined) updates.Image = data.Image;
    if (data.Mood !== undefined) updates.Mood = data.Mood;
    if (data.MoodEmoji !== undefined) updates.MoodEmoji = data.MoodEmoji;
    if (data.EventID !== undefined) updates.EventID = data.EventID;

    const { data: result, error } = await supabase
      .from('memories')
      .update(updates)
      .eq('MemoryID', id)
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('MemoryID', id);
    if (error) throw error;
  },

  /**
   * Get memories by mood (for Memory Wheel filtering)
   */
  async getByMood(mood: string): Promise<Memory[]> {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('Mood', mood)
      .order('CreatedDate', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  /**
   * Count total memories
   */
  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('memories')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  },
};
