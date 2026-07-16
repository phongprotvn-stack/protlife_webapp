// Event service for CRUD operations
import { supabase } from '@/lib/supabase/client';
import type { Event, EventFormData } from '@/types/database';

export const eventService = {
  async getAll(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('StartDate', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('EventID', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(event: EventFormData): Promise<Event> {
    // Get max sequence number for today
    const today = new Date(event.StartDate);
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const prefix = `EV${y}${m}${d}`;

    const { data: maxEvent } = await supabase
      .from('events')
      .select('EventID')
      .like('EventID', `${prefix}%`)
      .order('EventID', { ascending: false })
      .limit(1);

    let seqNo = 1;
    if (maxEvent && maxEvent.length > 0) {
      seqNo = parseInt(maxEvent[0].EventID.slice(-3)) + 1;
    }
    const eventId = `${prefix}${String(seqNo).padStart(3, '0')}`;

    const { data, error } = await supabase
      .from('events')
      .insert([{
        ...event,
        EventID: eventId,
        No: seqNo,
        CreatedDate: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, event: Partial<EventFormData>): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .update({ ...event, UpdatedDate: new Date().toISOString() })
      .eq('EventID', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('EventID', id);

    if (error) throw error;
  },

  async getUpcomingEvents(days: number = 30): Promise<Event[]> {
    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('StartDate', today.toISOString().split('T')[0])
      .lte('StartDate', futureDate.toISOString().split('T')[0])
      .order('StartDate', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getByContact(contactId: string): Promise<Event[]> {
    const { data: participantData, error: participantError } = await supabase
      .from('participants')
      .select('EventID')
      .eq('ContactID', contactId);

    if (participantError) throw participantError;
    const eventIds = participantData?.map(p => p.EventID) || [];
    
    if (eventIds.length === 0) return [];

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .in('EventID', eventIds)
      .order('StartDate', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
