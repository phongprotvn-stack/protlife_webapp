// Organization service - Supabase-backed CRUD operations
import { supabase } from '@/lib/supabase/client';

export interface Organization {
  OrganizationID: string;
  Name: string;
  Type: string;
  Contact: string;
  Email: string;
  Phone: string;
  Address: string;
  Website: string;
  Notes: string;
  Lat?: number | null;
  Lng?: number | null;
}

export interface OrganizationFormData {
  Name: string;
  Contact?: string;
  Email?: string;
  Phone?: string;
  Address?: string;
  Lat?: number | null;
  Lng?: number | null;
}

export const organizationService = {
  async getAll(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('Name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('OrganizationID', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(data: OrganizationFormData): Promise<Organization> {
    // Generate OrganizationID: ORG + 4-digit sequential
    const { data: maxId } = await supabase
      .from('organizations')
      .select('OrganizationID')
      .order('OrganizationID', { ascending: false })
      .limit(1);

    const nextNum = maxId && maxId.length > 0
      ? parseInt(maxId[0].OrganizationID.replace('ORG', ''), 10) + 1
      : 1;
    const orgId = `ORG${String(nextNum).padStart(4, '0')}`;

    const { data: org, error } = await supabase
      .from('organizations')
      .insert([{
        OrganizationID: orgId,
        Name: data.Name,
        Contact: data.Contact || '',
        Email: data.Email || '',
        Phone: data.Phone || '',
        Address: data.Address || '',
        Lat: data.Lat || null,
        Lng: data.Lng || null,
      }])
      .select()
      .single();

    if (error) throw error;
    return org;
  },

  async update(id: string, data: Partial<OrganizationFormData>): Promise<Organization> {
    const { data: org, error } = await supabase
      .from('organizations')
      .update({ ...data, UpdatedDate: new Date().toISOString() })
      .eq('OrganizationID', id)
      .select()
      .single();

    if (error) throw error;
    return org;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('OrganizationID', id);

    if (error) throw error;
  },
};
