import { supabase } from '@/lib/supabase/client';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export interface WeddingGuest {
  GuestID?: string;
  EventID: string;
  ContactID?: string | null;
  Name: string;
  Group?: string;
  InvitationStatus?: string;
  AttendanceStatus?: string;
  TableNumber?: string;
  GiftAmount?: number;
  Notes?: string;
}

export interface GroupEventFund {
  FundID?: string;
  EventID: string;
  ContactID: string;
  HasPaid: boolean;
  AmountPaid: number;
}

export interface GroupEventExpense {
  ExpenseID?: string;
  EventID: string;
  PaidByContactID: string;
  Amount: number;
  Description?: string;
  CreatedDate?: string;
}

// -----------------------------------------------------------------------------
// SERVICES
// -----------------------------------------------------------------------------

export const weddingService = {
  // --- Guests ---
  async getGuests(eventId: string): Promise<WeddingGuest[]> {
    const { data, error } = await supabase
      .from('wedding_guests')
      .select('*')
      .eq('EventID', eventId);
    if (error) throw error;
    return data || [];
  },

  async addGuest(guest: WeddingGuest): Promise<WeddingGuest> {
    const { data, error } = await supabase
      .from('wedding_guests')
      .insert([guest])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateGuest(guestId: string, updates: Partial<WeddingGuest>): Promise<WeddingGuest> {
    const { data, error } = await supabase
      .from('wedding_guests')
      .update(updates)
      .eq('GuestID', guestId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteGuest(guestId: string): Promise<void> {
    const { error } = await supabase
      .from('wedding_guests')
      .delete()
      .eq('GuestID', guestId);
    if (error) throw error;
  },
};

export const groupEventService = {
  // --- Funds (Who paid) ---
  async getFunds(eventId: string): Promise<GroupEventFund[]> {
    const { data, error } = await supabase
      .from('group_event_funds')
      .select('*, contacts("Name")') // Join with contacts to get name
      .eq('EventID', eventId);
    if (error) throw error;
    return data || [];
  },

  async upsertFund(fund: GroupEventFund): Promise<GroupEventFund> {
    const { data, error } = await supabase
      .from('group_event_funds')
      .upsert([fund], { onConflict: 'EventID, ContactID' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- Expenses ---
  async getExpenses(eventId: string): Promise<GroupEventExpense[]> {
    const { data, error } = await supabase
      .from('group_event_expenses')
      .select('*, contacts("Name")') // Join with contacts
      .eq('EventID', eventId)
      .order('CreatedDate', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addExpense(expense: GroupEventExpense): Promise<GroupEventExpense> {
    const { data, error } = await supabase
      .from('group_event_expenses')
      .insert([expense])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteExpense(expenseId: string): Promise<void> {
    const { error } = await supabase
      .from('group_event_expenses')
      .delete()
      .eq('ExpenseID', expenseId);
    if (error) throw error;
  }
};
