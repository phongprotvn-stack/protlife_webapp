// Database types matching Supabase schema

export type Relationship =
  | 'Family' | 'Relative' | 'Friend' | 'Colleague'
  | 'Neighbor' | 'Teacher' | 'Partner' | 'Other';

export type ContactStatus =
  | 'Active' | 'Lost Contact' | 'Deceased' | 'Blocked';

export type EventType =
  | 'Meeting' | 'Birthday' | 'Travel' | 'Work' | 'Sport'
  | 'Hospital' | 'Meal' | 'Call' | 'Shopping' | 'Study'
  | 'Party' | 'Date' | 'Entertainment' | 'Other';

export type Mood =
  | 'Happy' | 'Normal' | 'Sad' | 'Excited'
  | 'Tired' | 'Angry' | 'Thoughtful' | 'Loved';

export type Importance =
  | 'Lowest' | 'Low' | 'Medium' | 'High' | 'Highest';

export type LifeStage =
  | 'Infancy' | 'Childhood' | 'Secondary School' | 'High School'
  | 'University' | 'Early Career' | 'Mid Career' | 'Mature Career' | 'Retirement';

export type Source =
  | 'Manual' | 'Memory' | 'Email';

export interface Contact {
  ContactID: string;
  Name: string;
  Relationship: Relationship;
  Gender: 'Male' | 'Female' | 'Other' | null;
  Birthday: string | null;
  Phone: string | null;
  Email: string | null;
  Organization1: string | null;
  Organization2: string | null;
  RelationshipScore: number;
  Status: ContactStatus;
  IsFavorite: boolean;
  Avatar: string | null;
  Notes: string | null;
  CreatedDate: string;
  UpdatedDate: string;
  user_id?: string;
}

export interface ContactFormData {
  Name: string;
  Relationship: Relationship;
  Gender?: 'Male' | 'Female' | 'Other' | null;
  Birthday?: string | null;
  Phone?: string | null;
  Email?: string | null;
  Organization1?: string | null;
  Organization2?: string | null;
  RelationshipScore?: number;
  Status?: ContactStatus;
  IsFavorite?: boolean;
  Avatar?: string | null;
  Notes?: string | null;
}

export interface EventItem {
  EventID: string;
  No: number;
  EventType: EventType;
  LifeStage: LifeStage | null;
  Source: Source | null;
  Title: string;
  StartDate: string;
  EndDate: string | null;
  Place: string | null;
  Maplink: string | null;
  Lat: number | null;
  Lng: number | null;
  Mood: Mood | null;
  Importance: Importance;
  ParticipantCount: number;
  Cost: number;
  Notes: string | null;
  CreatedDate: string;
  UpdatedDate: string;
  user_id?: string;
}

export interface EventFormData {
  EventType: EventType;
  LifeStage?: LifeStage | null;
  Source?: Source | null;
  Title: string;
  StartDate: string;
  EndDate?: string | null;
  Place?: string | null;
  Maplink?: string | null;
  Lat?: number | null;
  Lng?: number | null;
  Mood?: Mood | null;
  Importance?: Importance;
  ParticipantCount?: number;
  Cost?: number;
  Notes?: string | null;
}

// ── Memories ──
export type MoodEmoji = '😊' | '😢' | '🤩' | '😌' | '😤' | '😴';

export interface Memory {
  MemoryID: string;
  EventID: string | null;
  Title: string;
  Content: string | null;
  Image: string | null;
  Mood: Mood | null;
  MoodEmoji: MoodEmoji | null;
  MemoryDate: string | null;
  CreatedDate: string;
  UpdatedDate: string;
  user_id?: string;
}

export interface MemoryFormData {
  Title: string;
  Content?: string | null;
  Image?: string | null;
  Mood?: Mood | null;
  MoodEmoji?: MoodEmoji | null;
  MemoryDate?: string | null;
  EventID?: string | null;
}

export interface MemoryWithEvent extends Memory {
  EventTitle?: string;
  EventDate?: string;
  EventType?: EventType;
}
