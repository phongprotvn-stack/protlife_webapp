// Goal service - Supabase-backed CRUD operations
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

export const goalService = {
  async getAll(): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('Title', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Goal | null> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('GoalID', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(data: GoalFormData): Promise<Goal> {
    // Generate GoalID: GL + 4-digit sequential
    const { data: maxId } = await supabase
      .from('goals')
      .select('GoalID')
      .order('GoalID', { ascending: false })
      .limit(1);

    const nextNum = maxId && maxId.length > 0
      ? parseInt(maxId[0].GoalID.replace('GL', ''), 10) + 1
      : 1;
    const goalId = `GL${String(nextNum).padStart(4, '0')}`;

    const { data: goal, error } = await supabase
      .from('goals')
      .insert([{
        GoalID: goalId,
        Title: data.Title,
        Status: data.Status || 'Not Started',
        Deadline: data.Deadline || '',
        Priority: data.Priority || 'Medium',
        Progress: data.Progress || 0,
        Notes: data.Notes || '',
      }])
      .select()
      .single();

    if (error) throw error;
    return goal;
  },

  async update(id: string, data: Partial<GoalFormData>): Promise<Goal> {
    const { data: goal, error } = await supabase
      .from('goals')
      .update({ ...data, UpdatedDate: new Date().toISOString() })
      .eq('GoalID', id)
      .select()
      .single();

    if (error) throw error;
    return goal;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('GoalID', id);

    if (error) throw error;
  },
};
