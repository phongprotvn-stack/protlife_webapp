// Stub memory service - in-memory + localStorage backed
export interface Memory {
  MemoryID: string;
  Title: string;
  Date: string;
  Type: string;
  Notes: string;
}

export interface MemoryFormData {
  Title: string;
  Date: string;
  Type: string;
  Notes?: string;
}

function getMemories(): Memory[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('protlife_memories');
  return raw ? JSON.parse(raw) : [];
}

function saveMemories(items: Memory[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('protlife_memories', JSON.stringify(items));
}

export const memoryService = {
  async getAll(): Promise<Memory[]> {
    return getMemories();
  },

  async getById(id: string): Promise<Memory | null> {
    const items = getMemories();
    return items.find((m) => m.MemoryID === id) || null;
  },

  async create(data: MemoryFormData): Promise<Memory> {
    const items = getMemories();
    const nextNum = items.length + 1;
    const memory: Memory = {
      MemoryID: `MEM${String(nextNum).padStart(4, '0')}`,
      Title: data.Title,
      Date: data.Date,
      Type: data.Type,
      Notes: data.Notes || '',
    };
    items.push(memory);
    saveMemories(items);
    return memory;
  },

  async update(id: string, data: Partial<MemoryFormData>): Promise<Memory> {
    const items = getMemories();
    const idx = items.findIndex((m) => m.MemoryID === id);
    if (idx === -1) throw new Error('Không tìm thấy ký ức');
    items[idx] = { ...items[idx], ...data };
    saveMemories(items);
    return items[idx];
  },

  async delete(id: string): Promise<void> {
    const items = getMemories();
    saveMemories(items.filter((m) => m.MemoryID !== id));
  },
};
