// Database types for Supabase

export type Relationship = 'Family' | 'Relative' | 'Friend' | 'Colleague' | 'Neighbor' | 'Teacher' | 'Partner' | 'Other';

export type Gender = 'Male' | 'Female' | 'Other';

export type ContactStatus = 'Active' | 'Lost Contact' | 'Deceased' | 'Blocked';

export type EventType = 'Meeting' | 'Birthday' | 'Travel' | 'Work' | 'Sport' | 'Hospital' | 'Meal' | 'Call' | 'Shopping' | 'Study' | 'Party' | 'Date' | 'Entertainment' | 'Other';

export type LifeStage = 'Infancy' | 'Childhood' | 'Secondary School' | 'High School' | 'University' | 'Early Career' | 'Mid Career' | 'Mature Career' | 'Retirement';

export type Source = 'Manual' | 'Memory' | 'Email';

export type Mood = 'Happy' | 'Normal' | 'Sad' | 'Excited' | 'Tired' | 'Angry' | 'Thoughtful' | 'Loved';

export type Importance = 'Lowest' | 'Low' | 'Medium' | 'High' | 'Highest';

export interface Contact {
  ContactID: string;
  Name: string;
  Relationship: Relationship;
  Gender: Gender;
  Birthday: string | null;
  Phone: string | null;
  Email: string | null;
  Organization1: string | null;
  Organization2: string | null;
  RelationshipScore: number;
  Status: ContactStatus;
  IsFavorite: boolean;
  CreatedDate: string;
  UpdatedDate: string;
  Avatar: string | null;
  Notes: string | null;
}

export interface Event {
  EventID: string;
  No: number;
  EventType: EventType;
  LifeStage: LifeStage | null;
  Source: Source;
  Title: string;
  StartDate: string;
  EndDate: string | null;
  Place: string | null;
  Maplink: string | null;
  Mood: Mood | null;
  Importance: Importance;
  ParticipantCount: number;
  Cost: number;
  Notes: string | null;
  CreatedDate: string;
  UpdatedDate: string;
}

export interface Participant {
  id: string;
  EventID: string;
  ContactID: string;
  Role: string | null;
  CreatedDate: string;
}

export interface Memory {
  MemoryID: string;
  EventID: string | null;
  Title: string;
  Content: string | null;
  MediaUrl: string | null;
  Mood: Mood | null;
  CreatedDate: string;
  UpdatedDate: string;
}

export interface Organization {
  OrganizationID: string;
  Name: string;
  Type: string | null;
  Phone: string | null;
  Email: string | null;
  Address: string | null;
  Website: string | null;
  Notes: string | null;
  CreatedDate: string;
  UpdatedDate: string;
}

export interface Tag {
  TagID: string;
  Name: string;
  Color: string | null;
  CreatedDate: string;
}

export interface File {
  FileID: string;
  Name: string;
  Url: string;
  Type: string;
  Size: number | null;
  EntityID: string | null;
  EntityType: string | null;
  CreatedDate: string;
}

export type Role = 'public' | 'viewer' | 'contributor' | 'admin';

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Form types
export interface ContactFormData {
  Name: string;
  Relationship: Relationship;
  Gender: Gender;
  Birthday: string;
  Phone: string;
  Email: string;
  Organization1: string;
  Organization2: string;
  RelationshipScore: number;
  Status: ContactStatus;
  IsFavorite: boolean;
  Notes: string;
}

export interface EventFormData {
  Title: string;
  EventType: EventType;
  LifeStage: LifeStage | '';
  Source: Source;
  StartDate: string;
  EndDate: string;
  Place: string;
  Maplink: string;
  Mood: Mood | '';
  Importance: Importance;
  Cost: number;
  Notes: string;
}

export interface MemoryFormData {
  Title: string;
  Content: string;
  Mood: Mood | '';
  EventID: string;
}

// Dashboard stats types
export interface DashboardStats {
  totalContacts: number;
  totalEvents: number;
  totalMemories: number;
  upcomingBirthdays: Contact[];
  relationshipDistribution: Record<Relationship, number>;
  eventTypeDistribution: Record<EventType, number>;
}

// Life Score types
export interface LifeScore {
  relationship: number;
  social: number;
  travel: number;
  health: number;
  learning: number;
  emotion: number;
}
