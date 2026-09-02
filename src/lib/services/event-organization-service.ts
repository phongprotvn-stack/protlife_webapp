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
  TableNumber?: string | null;
  GiftAmount?: number | null;
  GiftMethod?: 'Cash' | 'Transfer' | null;
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

export type WeddingTaskCategory = 'Venue' | 'Apparel' | 'Photography' | 'Food' | 'Decoration' | 'Transport' | 'Other';

export interface DefaultWeddingTaskTemplate {
  title: string;
  category: WeddingTaskCategory;
  /** Số tháng trước ngày cưới. Mốc lẻ được quy đổi thành số ngày gần đúng. */
  monthsBefore: number;
  estimatedCostRatio?: number;
}

export type WeddingSubEvent = 'engagement-visit' | 'engagement-ceremony' | 'wedding-reception';

export interface WeddingBlueprintParams {
  eventId: string;
  brideName: string;
  groomName: string;
  budget: number;
  weddingDate: string;
  subEvents?: WeddingSubEvent[];
}

/**
 * Checklist cưới hỏi theo phong tục Việt Nam, đi từ D-9 tháng tới ngày cưới.
 * `estimatedCostRatio` chỉ là tham chiếu cho UI; ngân sách chính thức được tạo
 * theo sáu nhóm trong `initWeddingBlueprint` bên dưới.
 */
export const VIETNAMESE_WEDDING_TASKS: DefaultWeddingTaskTemplate[] = [
  // Giai đoạn 6–9 tháng trước cưới
  { title: 'Xem ngày lành tháng tốt (Dạm ngõ, Ăn hỏi, Rước dâu)', category: 'Other', monthsBefore: 9 },
  { title: 'Thống nhất hai bên gia đình về nghi lễ và quy mô tiệc', category: 'Other', monthsBefore: 9 },
  { title: 'Dự toán tổng ngân sách và phân bổ các hạng mục chi tiêu', category: 'Other', monthsBefore: 8 },
  { title: 'Khảo sát và đặt cọc sảnh tiệc / trung tâm tiệc cưới', category: 'Venue', monthsBefore: 7, estimatedCostRatio: 0.45 },
  { title: 'Tìm kiếm và đặt lịch Studio chụp ảnh cưới Pre-wedding', category: 'Photography', monthsBefore: 6, estimatedCostRatio: 0.10 },
  { title: 'Đặt lịch quay phim / chụp ảnh phóng sự ngày cưới', category: 'Photography', monthsBefore: 6, estimatedCostRatio: 0.05 },

  // Giai đoạn 3–5 tháng trước cưới
  { title: 'Chọn concept, màu sắc chủ đạo và phong cách đám cưới', category: 'Decoration', monthsBefore: 5 },
  { title: 'Chọn và đặt may / thuê Váy cưới, Vest chú rể', category: 'Apparel', monthsBefore: 4, estimatedCostRatio: 0.08 },
  { title: 'Đặt lịch Makeup & Làm tóc cô dâu (Ăn hỏi + Tiệc cưới)', category: 'Apparel', monthsBefore: 4, estimatedCostRatio: 0.03 },
  { title: 'Chọn và mua nhẫn cưới đôi', category: 'Other', monthsBefore: 3, estimatedCostRatio: 0.06 },
  { title: 'Lên danh sách khách mời sơ bộ (Nhà trai + Nhà gái)', category: 'Other', monthsBefore: 3 },
  { title: 'Chọn mẫu thiệp cưới và chốt số lượng in ấn', category: 'Other', monthsBefore: 3, estimatedCostRatio: 0.02 },

  // Giai đoạn 1–2 tháng trước cưới
  { title: 'Đặt tráp lễ ăn hỏi (5/7/9 tráp theo phong tục)', category: 'Decoration', monthsBefore: 2, estimatedCostRatio: 0.05 },
  { title: 'Đặt xe hoa rước dâu và xe đưa đón 2 họ', category: 'Transport', monthsBefore: 2, estimatedCostRatio: 0.03 },
  { title: 'Gửi thiệp mời cưới (Trực tiếp & E-invitation)', category: 'Other', monthsBefore: 1.5 },
  { title: 'Thử món ăn và chốt thực đơn chính thức với nhà hàng', category: 'Food', monthsBefore: 1 },
  { title: 'Chốt kịch bản MC, âm thanh, ánh sáng và ban nhạc', category: 'Venue', monthsBefore: 1, estimatedCostRatio: 0.03 },
  { title: 'Xác nhận timeline với gia đình, nhà hàng và các nhà cung cấp', category: 'Other', monthsBefore: 1 },

  // Giai đoạn tuần cưới
  { title: 'Chốt danh sách khách mời xác nhận (RSVP) & Xếp bàn tiệc', category: 'Other', monthsBefore: 0.5 },
  { title: 'Chuẩn bị phong bao lì xì cho đội bê tráp 2 nhà', category: 'Other', monthsBefore: 0.3 },
  { title: 'Phân công ban đón tiếp khách & người quản lý thùng tiền mừng', category: 'Other', monthsBefore: 0.2 },
  { title: 'Kiểm tra trang phục, phụ kiện và lịch trình chi tiết ngày cưới', category: 'Other', monthsBefore: 0.1 },
  { title: 'Tổng duyệt nghi thức, xe hoa và đầu mối liên lạc ngày cưới', category: 'Other', monthsBefore: 0.05 },
  { title: 'Chuẩn bị đồ dùng khẩn cấp cho cô dâu, chú rể và đội ngũ hỗ trợ', category: 'Other', monthsBefore: 0.02 },
];

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

  const { error } = await supabase
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

function subtractWeddingLeadTime(weddingDate: string, monthsBefore: number): string {
  // Dùng 12:00 trưa để không bị lệch ngày do DST khi database chuyển đổi TIMESTAMPTZ.
  const date = new Date(`${weddingDate}T12:00:00`);
  const wholeMonths = Math.floor(monthsBefore);
  const fractionalDays = Math.round((monthsBefore - wholeMonths) * 30);

  if (wholeMonths > 0) {
    const originalDay = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() - wholeMonths);
    const lastDayOfTargetMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(originalDay, lastDayOfTargetMonth));
  }
  if (fractionalDays > 0) date.setDate(date.getDate() - fractionalDays);

  return date.toISOString();
}

const WEDDING_BUDGET_ALLOCATION: Array<{
  category: WeddingExpense['Category'];
  ratio: number;
  note: string;
}> = [
  // Schema hiện tại tách Food/Venue; hai dòng này tạo thành một nhóm "Ẩm thực & Sảnh" 50%.
  { category: 'Food', ratio: 0.25, note: 'Ẩm thực & Sảnh (phần Ẩm thực) · 50% tổng ngân sách' },
  { category: 'Venue', ratio: 0.25, note: 'Ẩm thực & Sảnh (phần Sảnh) · 50% tổng ngân sách' },
  { category: 'Photography', ratio: 0.15, note: 'Chụp ảnh & Quay phim · 15% tổng ngân sách' },
  { category: 'Apparel', ratio: 0.10, note: 'Trang phục, Váy cưới & Makeup · 10% tổng ngân sách' },
  { category: 'Decoration', ratio: 0.10, note: 'Trang trí gia tiên & Sảnh tiệc · 10% tổng ngân sách' },
  { category: 'Transport', ratio: 0.05, note: 'Xe hoa & Di chuyển · 5% tổng ngân sách' },
  { category: 'Other', ratio: 0.10, note: 'Khác & Dự phòng phát sinh · 10% tổng ngân sách' },
];

/**
 * Khởi tạo trọn bộ dữ liệu cưới cho một event đã tồn tại.
 *
 * Hàm có thể gọi lại sau khi lỗi mạng: dữ liệu đã được tạo không bị nhân đôi,
 * còn phần bị thiếu sẽ được bổ sung. Lựa chọn nghi lễ được lưu kèm công việc
 * chuẩn bị nghi lễ vì schema v1.1.1 chưa có cột riêng cho các nghi lễ phụ.
 */
export async function initWeddingBlueprint({
  eventId,
  brideName,
  groomName,
  budget,
  weddingDate,
  subEvents = ['wedding-reception'],
}: WeddingBlueprintParams): Promise<{
  details: WeddingDetails;
  createdTasks: number;
  createdExpenses: number;
}> {
  if (!eventId || !brideName.trim() || !groomName.trim() || !weddingDate) {
    throw new Error('Thiếu thông tin để khởi tạo hành trình cưới');
  }

  const normalizedBudget = Math.max(0, Math.round(Number(budget) || 0));
  const ceremonyNames: Record<WeddingSubEvent, string> = {
    'engagement-visit': 'Lễ Dạm ngõ',
    'engagement-ceremony': 'Lễ Ăn hỏi',
    'wedding-reception': 'Tiệc cưới chính',
  };
  const ceremonySummary = subEvents.length > 0
    ? subEvents.map(item => ceremonyNames[item]).filter(Boolean).join(', ')
    : 'Tiệc cưới chính';

  const details: WeddingDetails = {
    EventID: eventId,
    BrideName: brideName.trim(),
    GroomName: groomName.trim(),
    BudgetLimit: normalizedBudget,
  };
  const { data: savedDetails, error: detailsError } = await supabase
    .from('wedding_details')
    .upsert([details], { onConflict: 'EventID' })
    .select()
    .single();
  if (detailsError) throw detailsError;

  const { data: existingTasks, error: existingTasksError } = await supabase
    .from('wedding_tasks')
    .select('Title')
    .eq('EventID', eventId);
  if (existingTasksError) throw existingTasksError;

  const existingTaskTitles = new Set((existingTasks || []).map(task => task.Title));
  const tasksToCreate = VIETNAMESE_WEDDING_TASKS
    .filter(template => !existingTaskTitles.has(template.title))
    .map(template => ({
      EventID: eventId,
      Title: template.title,
      Description: template === VIETNAMESE_WEDDING_TASKS[0] ? `Nghi lễ đã chọn: ${ceremonySummary}.` : null,
      Status: 'Pending' as const,
      DueDate: subtractWeddingLeadTime(weddingDate, template.monthsBefore),
      Category: template.category,
      Order: VIETNAMESE_WEDDING_TASKS.indexOf(template) + 1,
      EstimatedCost: template.estimatedCostRatio
        ? Math.round(normalizedBudget * template.estimatedCostRatio)
        : 0,
    }));

  if (tasksToCreate.length > 0) {
    const { error } = await supabase.from('wedding_tasks').insert(tasksToCreate);
    if (error) throw error;
  }

  const { data: existingExpenses, error: existingExpensesError } = await supabase
    .from('wedding_expenses')
    .select('Category')
    .eq('EventID', eventId);
  if (existingExpensesError) throw existingExpensesError;

  const existingCategories = new Set((existingExpenses || []).map(expense => expense.Category));
  const expensesToCreate = WEDDING_BUDGET_ALLOCATION
    .filter(allocation => !existingCategories.has(allocation.category))
    .map(allocation => ({
      EventID: eventId,
      Category: allocation.category,
      EstimatedCost: Math.round(normalizedBudget * allocation.ratio),
      ActualCost: 0,
      Notes: allocation.note,
    }));

  if (expensesToCreate.length > 0) {
    const { error } = await supabase.from('wedding_expenses').insert(expensesToCreate);
    if (error) throw error;
  }

  return {
    details: savedDetails as WeddingDetails,
    createdTasks: tasksToCreate.length,
    createdExpenses: expensesToCreate.length,
  };
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
      .order('DueDate', { ascending: true, nullsFirst: false })
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
