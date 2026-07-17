// Participant service for managing event-contact relationships
import { supabase } from '@/lib/supabase/client';

export interface EventParticipant {
  EventID: string;
  ContactID: string;
}

export const participantService = {
  async getByEvent(eventId: string): Promise<EventParticipant[]> {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('EventID', eventId);
    if (error) throw error;
    return data || [];
  },

  async addParticipants(eventId: string, contactIds: string[]): Promise<void> {
    if (contactIds.length === 0) return;
    const records = contactIds.map((ContactID) => ({ EventID: eventId, ContactID }));
    const { error } = await supabase.from('participants').insert(records);
    if (error) throw error;
  },

  async removeParticipants(eventId: string, contactIds: string[]): Promise<void> {
    if (contactIds.length === 0) return;
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('EventID', eventId)
      .in('ContactID', contactIds);
    if (error) throw error;
  },

  async setParticipants(eventId: string, contactIds: string[]): Promise<void> {
    const { error: delError } = await supabase
      .from('participants')
      .delete()
      .eq('EventID', eventId);
    if (delError) throw delError;

    if (contactIds.length > 0) {
      const records = contactIds.map((ContactID) => ({ EventID: eventId, ContactID }));
      const { error: insError } = await supabase.from('participants').insert(records);
      if (insError) throw insError;
    }
  },
};
