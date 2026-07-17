// Stub document service - in-memory + localStorage backed
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
  Type: string;
  Date: string;
  Size?: string;
  Notes?: string;
}

function getDocuments(): Document[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('protlife_documents');
  return raw ? JSON.parse(raw) : [];
}

function saveDocuments(items: Document[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('protlife_documents', JSON.stringify(items));
}

export const documentService = {
  async getAll(): Promise<Document[]> {
    return getDocuments();
  },

  async getById(id: string): Promise<Document | null> {
    const items = getDocuments();
    return items.find((d) => d.DocumentID === id) || null;
  },

  async create(data: DocumentFormData): Promise<Document> {
    const items = getDocuments();
    const nextNum = items.length + 1;
    const doc: Document = {
      DocumentID: `DOC${String(nextNum).padStart(4, '0')}`,
      Title: data.Title,
      Type: data.Type,
      Date: data.Date,
      Size: data.Size || '',
      Notes: data.Notes || '',
    };
    items.push(doc);
    saveDocuments(items);
    return doc;
  },

  async update(id: string, data: Partial<DocumentFormData>): Promise<Document> {
    const items = getDocuments();
    const idx = items.findIndex((d) => d.DocumentID === id);
    if (idx === -1) throw new Error('Không tìm thấy tài liệu');
    items[idx] = { ...items[idx], ...data };
    saveDocuments(items);
    return items[idx];
  },

  async delete(id: string): Promise<void> {
    const items = getDocuments();
    saveDocuments(items.filter((d) => d.DocumentID !== id));
  },
};
