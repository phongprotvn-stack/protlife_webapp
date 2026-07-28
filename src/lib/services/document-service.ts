// Document service - Supabase-backed CRUD operations
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

export const documentService = {
  async getAll(): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('Title', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Document | null> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('DocumentID', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(data: DocumentFormData): Promise<Document> {
    // Generate DocumentID: DOC + 4-digit sequential
    const { data: maxId } = await supabase
      .from('documents')
      .select('DocumentID')
      .order('DocumentID', { ascending: false })
      .limit(1);

    const nextNum = maxId && maxId.length > 0
      ? parseInt(maxId[0].DocumentID.replace('DOC', ''), 10) + 1
      : 1;
    const docId = `DOC${String(nextNum).padStart(4, '0')}`;

    const { data: doc, error } = await supabase
      .from('documents')
      .insert([{
        DocumentID: docId,
        Title: data.Title,
        Type: data.Type || '',
        Date: data.Date || '',
        Size: data.Size || '',
        Notes: data.Notes || '',
      }])
      .select()
      .single();

    if (error) throw error;
    return doc;
  },

  async update(id: string, data: Partial<DocumentFormData>): Promise<Document> {
    const { data: doc, error } = await supabase
      .from('documents')
      .update({ ...data, UpdatedDate: new Date().toISOString() })
      .eq('DocumentID', id)
      .select()
      .single();

    if (error) throw error;
    return doc;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('DocumentID', id);

    if (error) throw error;
  },
};
