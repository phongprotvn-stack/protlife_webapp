// Document service - Supabase-backed with localStorage fallback
// Reads from localStorage (existing data), writes to both Supabase + localStorage
import { supabase } from '@/lib/supabase/client';

export interface Document {
  DocumentID: string;
  Title: string;
  Type: string;
  Date: string;
  Size: string;
  Notes: string;
}

export interface DocumentFormData {
  Title: string;
  Type?: string;
  Date?: string;
  Size?: string;
  Notes?: string;
}

function getLocalDocs(): Document[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('protlife_documents');
  return raw ? JSON.parse(raw) : [];
}

function saveLocalDocs(items: Document[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('protlife_documents', JSON.stringify(items));
}

export const documentService = {
  async getAll(): Promise<Document[]> {
    return getLocalDocs();
  },

  async getById(id: string): Promise<Document | null> {
    const items = getLocalDocs();
    return items.find((d) => d.DocumentID === id) || null;
  },

  async create(data: DocumentFormData): Promise<Document> {
    const items = getLocalDocs();
    const nextNum = items.length + 1;
    const doc: Document = {
      DocumentID: `DOC${String(nextNum).padStart(4, '0')}`,
      Title: data.Title,
      Type: data.Type || '',
      Date: data.Date || '',
      Size: data.Size || '',
      Notes: data.Notes || '',
    };
    items.push(doc);
    saveLocalDocs(items);

    try {
      const { data: maxId } = await supabase
        .from('documents')
        .select('DocumentID')
        .order('DocumentID', { ascending: false })
        .limit(1);
      const next = maxId && maxId.length > 0
        ? parseInt(maxId[0].DocumentID.replace('DOC', ''), 10) + 1
        : 1;
      await supabase.from('documents').insert([{
        DocumentID: `DOC${String(next).padStart(4, '0')}`,
        Title: data.Title,
        Type: data.Type || '',
        Date: data.Date || '',
        Size: data.Size || '',
        Notes: data.Notes || '',
      }]);
    } catch {}

    return doc;
  },

  async update(id: string, data: Partial<DocumentFormData>): Promise<Document> {
    const items = getLocalDocs();
    const idx = items.findIndex((d) => d.DocumentID === id);
    if (idx === -1) throw new Error('Không tìm thấy tài liệu');
    items[idx] = { ...items[idx], ...data };
    saveLocalDocs(items);

    try {
      await supabase.from('documents').update({ ...data, UpdatedDate: new Date().toISOString() }).eq('DocumentID', id);
    } catch {}

    return items[idx];
  },

  async delete(id: string): Promise<void> {
    const items = getLocalDocs();
    saveLocalDocs(items.filter((d) => d.DocumentID !== id));
    try {
      await supabase.from('documents').delete().eq('DocumentID', id);
    } catch {}
  },
};
