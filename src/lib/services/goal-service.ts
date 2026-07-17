// Stub goal service - in-memory + localStorage backed
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

function getGoals(): Goal[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('protlife_goals');
  return raw ? JSON.parse(raw) : [];
}

function saveGoals(items: Goal[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('protlife_goals', JSON.stringify(items));
}

export const goalService = {
  async getAll(): Promise<Goal[]> {
    return getGoals();
  },

  async getById(id: string): Promise<Goal | null> {
    const items = getGoals();
    return items.find((g) => g.GoalID === id) || null;
  },

  async create(data: GoalFormData): Promise<Goal> {
    const items = getGoals();
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
    saveGoals(items);
    return goal;
  },

  async update(id: string, data: Partial<GoalFormData>): Promise<Goal> {
    const items = getGoals();
    const idx = items.findIndex((g) => g.GoalID === id);
    if (idx === -1) throw new Error('Không tìm thấy mục tiêu');
    items[idx] = { ...items[idx], ...data };
    saveGoals(items);
    return items[idx];
  },

  async delete(id: string): Promise<void> {
    const items = getGoals();
    saveGoals(items.filter((g) => g.GoalID !== id));
  },
};
