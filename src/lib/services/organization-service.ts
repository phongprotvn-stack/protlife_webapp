// Organization service - Supabase-backed with localStorage fallback
// Reads from localStorage (existing data), writes to both Supabase + localStorage
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

function getLocalOrgs(): Organization[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('protlife_organizations');
  return raw ? JSON.parse(raw) : [];
}

function saveLocalOrgs(items: Organization[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('protlife_organizations', JSON.stringify(items));
}

export const organizationService = {
  async getAll(): Promise<Organization[]> {
    // Try Supabase first for cross-device sync
    try {
      const { data: supabaseData, error } = await supabase
        .from('organizations')
        .select('*')
        .order('OrganizationID', { ascending: true });

      if (!error && supabaseData && supabaseData.length > 0) {
        // Sync to localStorage so next load is instant
        saveLocalOrgs(supabaseData);
        return supabaseData;
      }
    } catch {
      // Supabase unavailable, fall back to localStorage
    }

    // Fallback to localStorage
    return getLocalOrgs();
  },

  async getById(id: string): Promise<Organization | null> {
    // Check localStorage first
    const items = getLocalOrgs();
    const found = items.find((o) => o.OrganizationID === id);
    if (found) return found;

    // Fallback to Supabase
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('OrganizationID', id)
        .single();
      if (!error && data) return data;
    } catch {}
    return null;
  },

  async create(data: OrganizationFormData): Promise<Organization> {
    const items = getLocalOrgs();
    const nextNum = items.length + 1;
    const org: Organization = {
      OrganizationID: `ORG${String(nextNum).padStart(4, '0')}`,
      Name: data.Name,
      Type: '',
      Contact: data.Contact || '',
      Email: data.Email || '',
      Phone: data.Phone || '',
      Address: data.Address || '',
      Website: '',
      Notes: '',
      Lat: data.Lat || null,
      Lng: data.Lng || null,
    };
    items.push(org);
    saveLocalOrgs(items);

    // Fire-and-forget: save to Supabase too
    try {
      const { data: maxId } = await supabase
        .from('organizations')
        .select('OrganizationID')
        .order('OrganizationID', { ascending: false })
        .limit(1);
      const next = maxId && maxId.length > 0
        ? parseInt(maxId[0].OrganizationID.replace('ORG', ''), 10) + 1
        : 1;
      await supabase.from('organizations').insert([{
        OrganizationID: `ORG${String(next).padStart(4, '0')}`,
        Name: data.Name,
        Contact: data.Contact || '',
        Email: data.Email || '',
        Phone: data.Phone || '',
        Address: data.Address || '',
        Lat: data.Lat || null,
        Lng: data.Lng || null,
      }]);
    } catch {}

    return org;
  },

  async update(id: string, data: Partial<OrganizationFormData>): Promise<Organization> {
    const items = getLocalOrgs();
    const idx = items.findIndex((o) => o.OrganizationID === id);
    if (idx === -1) throw new Error('Không tìm thấy tổ chức');
    items[idx] = { ...items[idx], ...data };
    saveLocalOrgs(items);

    try {
      await supabase.from('organizations').update({ ...data, UpdatedDate: new Date().toISOString() }).eq('OrganizationID', id);
    } catch {}

    return items[idx];
  },

  async delete(id: string): Promise<void> {
    const items = getLocalOrgs();
    saveLocalOrgs(items.filter((o) => o.OrganizationID !== id));
    try {
      await supabase.from('organizations').delete().eq('OrganizationID', id);
    } catch {}
  },
};
