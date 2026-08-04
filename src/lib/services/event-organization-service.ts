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
  Organization?: string;
  PhoneNumber?: string;
  InvitationStatus?: string;
  AttendanceStatus?: string;
  TableNumber?: string;
  GiftAmount?: number;
  Notes?: string;
}

export interface WeddingTable {
  TableID?: string;
  EventID: string;
  TableName: string;
  Capacity: number; // 6 hoặc 10
}

export interface WeddingDetails {
  EventID: string;
  BrideName?: string | null;
  GroomName?: string | null;
  BudgetLimit?: number;
}

export interface WeddingTask {
  TaskID?: string;
  EventID: string;
  Title: string;
  Description?: string | null;
  Status?: 'Pending' | 'In Progress' | 'Done';
  DueDate?: string | null;
  ParentTaskID?: string | null;
  EstimatedCost?: number;
  Category?: string;
  Order?: number;
}

export interface WeddingExpense {
  ExpenseID?: string;
  EventID: string;
  Category: 'Apparel' | 'Photography' | 'Food' | 'Venue' | 'Decoration' | 'Transport' | 'Other';
  EstimatedCost?: number;
  ActualCost?: number;
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
  InvolvedContactIDs?: string[];
  CreatedDate?: string;
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

/** Lấy danh sách event Party/đám cưới (cho EventPicker), ưu tiên event có tên cưới/wedding + sắp tới */
export async function getPartyEvents(): Promise<{ EventID: string; Title: string; StartDate: string }[]> {
  const { data, error } = await supabase
    .from('events')
    .select('EventID, Title, StartDate')
    .in('EventType', ['Party', 'Other', 'Entertainment'])
    .order('StartDate', { ascending: true })
    .limit(100);
  if (error) throw error;

  const list = (data || []) as { EventID: string; Title: string; StartDate: string }[];
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = list.filter(e => (e.StartDate || '') >= today);
  const pool = upcoming.length > 0 ? upcoming : list;
  const named = pool.filter(e => /cưới|wedding/i.test(e.Title));
  const sorted = [...(named.length > 0 ? named : pool)].sort((a, b) => a.StartDate.localeCompare(b.StartDate));
  return sorted;
}

/** Lấy event Party/đám cưới GẦN NHẤT (mặc định cho các trang không có [id]) */
export async function getNearestPartyEvent(): Promise<{ EventID: string; Title: string; StartDate: string } | null> {
  const { data, error } = await supabase
    .from('events')
    .select('EventID, Title, StartDate')
    .in('EventType', ['Party', 'Other', 'Entertainment'])
    .order('StartDate', { ascending: true })
    .limit(50);
  if (error) throw error;

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (data || [])
    .filter(e => (e.StartDate || '') >= today)
    .sort((a, b) => a.StartDate.localeCompare(b.StartDate));
  const pool = upcoming.length > 0 ? upcoming : (data || []).sort((a, b) => b.StartDate.localeCompare(a.StartDate));

  // Ưu tiên event có tên chứa "cưới"/"wedding" hoặc đã có wedding_details
  const named = pool.find(e => /cưới|wedding/i.test(e.Title));
  if (named) return named;

  const { data: wd } = await supabase.from('wedding_details').select('EventID').limit(1);
  if (wd && wd.length > 0) {
    const withDetails = pool.find(e => e.EventID === wd[0].EventID);
    if (withDetails) return withDetails;
  }

  return pool[0] || null;
}

// -----------------------------------------------------------------------------
// SERVICES
// -----------------------------------------------------------------------------

/**
 * Tạo sự kiện LỚN (nhóm hoặc đám cưới) — luôn tạo 1 row trong bảng `events` chung
 * để nó xuất hiện đồng thời trong timeline sự kiện. Trả về EventID mới.
 */
export async function createBigEvent(params: {
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  eventType?: string; // mặc định 'Party' (đám cưới) hoặc 'Travel' (nhóm)
}): Promise<string> {
  const d = new Date(params.startDate + 'T00:00:00');
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const prefix = `EV${y}${m}${day}`;

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
      EventID: eventId,
      No: seqNo,
      EventType: params.eventType || 'Party',
      Title: params.title,
      StartDate: params.startDate,
      EndDate: params.endDate || null,
      Source: 'Manual',
      Importance: 'High',
      CreatedDate: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;
  return eventId;
}

export const weddingService = {
  // --- Details ---
  async getDetails(eventId: string): Promise<WeddingDetails | null> {
    const { data, error } = await supabase
      .from('wedding_details')
      .select('*')
      .eq('EventID', eventId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async upsertDetails(details: WeddingDetails): Promise<WeddingDetails> {
    const { data, error } = await supabase
      .from('wedding_details')
      .upsert([details], { onConflict: 'EventID' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- Tasks (Checklist) ---
  async getTasks(eventId: string): Promise<WeddingTask[]> {
    const { data, error } = await supabase
      .from('wedding_tasks')
      .select('*')
      .eq('EventID', eventId)
      .order('CreatedDate', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async addTask(task: WeddingTask): Promise<WeddingTask> {
    const { data, error } = await supabase
      .from('wedding_tasks')
      .insert([task])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTask(taskId: string, updates: Partial<WeddingTask>): Promise<WeddingTask> {
    const { data, error } = await supabase
      .from('wedding_tasks')
      .update({ ...updates, UpdatedDate: new Date().toISOString() })
      .eq('TaskID', taskId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('wedding_tasks')
      .delete()
      .eq('TaskID', taskId);
    if (error) throw error;
  },

  // --- Expenses ---
  async getExpenses(eventId: string): Promise<WeddingExpense[]> {
    const { data, error } = await supabase
      .from('wedding_expenses')
      .select('*')
      .eq('EventID', eventId)
      .order('CreatedDate', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addExpense(expense: WeddingExpense): Promise<WeddingExpense> {
    const { data, error } = await supabase
      .from('wedding_expenses')
      .insert([expense])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateExpense(expenseId: string, updates: Partial<WeddingExpense>): Promise<WeddingExpense> {
    const { data, error } = await supabase
      .from('wedding_expenses')
      .update({ ...updates, UpdatedDate: new Date().toISOString() })
      .eq('ExpenseID', expenseId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteExpense(expenseId: string): Promise<void> {
    const { error } = await supabase
      .from('wedding_expenses')
      .delete()
      .eq('ExpenseID', expenseId);
    if (error) throw error;
  },

  // --- Guests ---
  async getGuests(eventId: string): Promise<WeddingGuest[]> {
    const { data, error } = await supabase
      .from('wedding_guests')
      .select('*')
      .eq('EventID', eventId)
      .order('CreatedDate', { ascending: true })
      .order('Name', { ascending: true });
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
      .update({ ...updates, UpdatedDate: new Date().toISOString() })
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

    // --- Tables (Bàn tiệc) ---
    async getTables(eventId: string): Promise<WeddingTable[]> {
      const { data, error } = await supabase
        .from('wedding_tables')
        .select('*')
        .eq('EventID', eventId)
        .order('CreatedDate', { ascending: true });
      if (error) throw error;
      return data || [];
    },

    async addTable(table: WeddingTable): Promise<WeddingTable> {
      const { data, error } = await supabase
        .from('wedding_tables')
        .insert([table])
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    /** Thêm nhiều khách cùng lúc (chọn từ danh bạ hoặc tự nhập nhanh) */
    async addGuestsBatch(guests: WeddingGuest[]): Promise<WeddingGuest[]> {
      if (guests.length === 0) return [];
      const { data, error } = await supabase
        .from('wedding_guests')
        .insert(guests)
        .select();
      if (error) throw error;
      return data || [];
    },
  };

export const groupEventService = {
  // --- Funds (Who paid) ---
  async getFunds(eventId: string): Promise<(GroupEventFund & { contacts?: { Name: string } | null })[]> {
    const { data, error } = await supabase
      .from('group_event_funds')
      .select('*, contacts("Name")') // Join with contacts to get name
      .eq('EventID', eventId)
      .order('CreatedDate', { ascending: true });
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

  async deleteFund(fundId: string): Promise<void> {
    const { error } = await supabase
      .from('group_event_funds')
      .delete()
      .eq('FundID', fundId);
    if (error) throw error;
  },

  // --- Expenses ---
  async getExpenses(eventId: string): Promise<(GroupEventExpense & { contacts?: { Name: string } | null })[]> {
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
