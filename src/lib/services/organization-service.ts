// Stub organization service - in-memory + localStorage backed
export interface Organization {
  OrganizationID: string;
  Name: string;
  Contact: string;
  Email: string;
  Phone: string;
  Address: string;
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

function getOrganizations(): Organization[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('protlife_organizations');
  return raw ? JSON.parse(raw) : [];
}

function saveOrganizations(items: Organization[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('protlife_organizations', JSON.stringify(items));
}

export const organizationService = {
  async getAll(): Promise<Organization[]> {
    return getOrganizations();
  },

  async getById(id: string): Promise<Organization | null> {
    const items = getOrganizations();
    return items.find((o) => o.OrganizationID === id) || null;
  },

  async create(data: OrganizationFormData): Promise<Organization> {
    const items = getOrganizations();
    const nextNum = items.length + 1;
    const org: Organization = {
      OrganizationID: `ORG${String(nextNum).padStart(4, '0')}`,
      Name: data.Name,
      Contact: data.Contact || '',
      Email: data.Email || '',
      Phone: data.Phone || '',
      Address: data.Address || '',
    };
    items.push(org);
    saveOrganizations(items);
    return org;
  },

  async update(id: string, data: Partial<OrganizationFormData>): Promise<Organization> {
    const items = getOrganizations();
    const idx = items.findIndex((o) => o.OrganizationID === id);
    if (idx === -1) throw new Error('Không tìm thấy tổ chức');
    items[idx] = { ...items[idx], ...data };
    saveOrganizations(items);
    return items[idx];
  },

  async delete(id: string): Promise<void> {
    const items = getOrganizations();
    saveOrganizations(items.filter((o) => o.OrganizationID !== id));
  },
};
