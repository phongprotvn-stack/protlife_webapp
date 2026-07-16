// Contact service for CRUD operations
import { supabase } from '@/lib/supabase/client';
import type { Contact, ContactFormData } from '@/types/database';

export const contactService = {
  async getAll(): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('Name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Contact | null> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('ContactID', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(contact: ContactFormData): Promise<Contact> {
    // Generate ContactID: C + 4-digit sequential
    const { data: maxId } = await supabase
      .from('contacts')
      .select('ContactID')
      .order('ContactID', { ascending: false })
      .limit(1);

    const nextNum = maxId && maxId.length > 0
      ? parseInt(maxId[0].ContactID.replace('C', '')) + 1
      : 1;
    const contactId = `C${String(nextNum).padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('contacts')
      .insert([{ ...contact, ContactID: contactId, CreatedDate: new Date().toISOString() }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, contact: Partial<ContactFormData>): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .update({ ...contact, UpdatedDate: new Date().toISOString() })
      .eq('ContactID', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('ContactID', id);

    if (error) throw error;
  },

  async getUpcomingBirthdays(days: number = 30): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('Status', 'Active')
      .not('Birthday', 'is', null);

    if (error) throw error;
    return (data || []).filter((c) => {
      if (!c.Birthday) return false;
      const today = new Date();
      const birth = new Date(c.Birthday);
      const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
      const diff = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= days;
    });
  },
};
