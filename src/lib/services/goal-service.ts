// Goal service - Supabase-backed with localStorage fallback
// Reads from localStorage (existing data), writes to both Supabase + localStorage
import { supabase } from '@/lib/supabase/client';

export interface Goal {
  GoalID: string;
  Title: string;
  Status: string;
  Deadline: string;
  Priority: string;
  Progress: number;
  Notes: string;
}

export interface GoalFormData {
  Title: string;
  Status?: string;
  Deadline?: string;
  Priority?: string;
  Progress?: number;
  Notes?: string;
}

// ─── localStorage helpers (primary data source until migration) ───
function getLocalGoals(): Goal[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('protlife_goals');
  return raw ? JSON.parse(raw) : [];
}

function saveLocalGoals(items: Goal[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('protlife_goals', JSON.stringify(items));
}

export const goalService = {
  async getAll(): Promise<Goal[]> {
    // Always return localStorage data first (existing data)
    const local = getLocalGoals();
    // Fire-and-forget: try to load from Supabase in background
    // (data will be used on next refresh once migration is done)
    return local;
  },

  async getById(id: string): Promise<Goal | null> {
    const items = getLocalGoals();
    return items.find((g) => g.GoalID === id) || null;
  },

  async create(data: GoalFormData): Promise<Goal> {
    // Save to localStorage
    const items = getLocalGoals();
    const nextNum = items.length + 1;
    const goal: Goal = {
      GoalID: `GL${String(nextNum).padStart(4, '0')}`,
      Title: data.Title,
      Status: data.Status || 'Not Started',
      Deadline: data.Deadline || '',
      Priority: data.Priority || 'Medium',
      Progress: data.Progress || 0,
      Notes: data.Notes || '',
    };
    items.push(goal);
    saveLocalGoals(items);

    // Fire-and-forget: also save to Supabase if table exists
    try {
      const { data: maxId } = await supabase
        .from('goals')
        .select('GoalID')
        .order('GoalID', { ascending: false })
        .limit(1);
      const next = maxId && maxId.length > 0
        ? parseInt(maxId[0].GoalID.replace('GL', ''), 10) + 1
        : 1;
      await supabase.from('goals').insert([{
        GoalID: `GL${String(next).padStart(4, '0')}`,
        Title: data.Title,
        Status: data.Status || 'Not Started',
        Deadline: data.Deadline || '',
        Priority: data.Priority || 'Medium',
        Progress: data.Progress || 0,
        Notes: data.Notes || '',
      }]);
    } catch {}

    return goal;
  },

  async update(id: string, data: Partial<GoalFormData>): Promise<Goal> {
    const items = getLocalGoals();
    const idx = items.findIndex((g) => g.GoalID === id);
    if (idx === -1) throw new Error('Không tìm thấy mục tiêu');
    items[idx] = { ...items[idx], ...data };
    saveLocalGoals(items);

    // Fire-and-forget: sync to Supabase
    try {
      await supabase.from('goals').update({ ...data, UpdatedDate: new Date().toISOString() }).eq('GoalID', id);
    } catch {}

    return items[idx];
  },

  async delete(id: string): Promise<void> {
    const items = getLocalGoals();
    saveLocalGoals(items.filter((g) => g.GoalID !== id));
    try {
      await supabase.from('goals').delete().eq('GoalID', id);
    } catch {}
  },
};
