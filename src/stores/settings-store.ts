import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'Tiếng Việt' | 'English';

export interface SettingsState {
  // Appearance
  theme: ThemeMode;
  accentColor: string;
  fontSize: number; // 0-4 -> 14,15,16,18,20px
  reduceMotion: boolean;
  haptic: boolean;

  // Profile
  displayName: string;
  displayEmail: string;
  phone: string;
  dob: string;
  gender: string;
  language: Language;
  timezone: string;

  // Login methods
  googleLinked: boolean;

  // Privacy
  publicProfile: boolean;
  onlineStatus: boolean;
  locationShare: boolean;
  aiDataUse: boolean;
  anonymousStats: boolean;

  // Notifications
  notifyBirthday: boolean;
  notifyEventReminder: boolean;
  notifyAnniversary: boolean;
  notifyAiSuggest: boolean;
  pushEnabled: boolean;
  emailNotify: boolean;
  smsNotify: boolean;
  quietFrom: string;
  quietTo: string;

  // Integrations
  googleCalendar: boolean;
  googleContacts: boolean;
  googleDrive: boolean;
  caldav: boolean;
  vcard: boolean;

  // Backup
  dailyBackup: boolean;
  monthlySnapshot: boolean;
  r2Enabled: boolean;
  driveBackup: boolean;
  gitManifest: boolean;

  // Actions
  set: (partial: Partial<SettingsState>) => void;
  reset: () => void;
}

const DEFAULTS: Omit<SettingsState, 'set' | 'reset'> = {
  theme: 'light',
  accentColor: '#E6002D',
  fontSize: 2,
  reduceMotion: false,
  haptic: true,

  displayName: '',
  displayEmail: '',
  phone: '',
  dob: '',
  gender: 'Nam',
  language: 'Tiếng Việt',
  timezone: '(GMT+07:00) Bangkok, Hanoi, Jakarta',

  googleLinked: false,

  publicProfile: false,
  onlineStatus: true,
  locationShare: false,
  aiDataUse: true,
  anonymousStats: true,

  notifyBirthday: true,
  notifyEventReminder: true,
  notifyAnniversary: true,
  notifyAiSuggest: false,
  pushEnabled: true,
  emailNotify: false,
  smsNotify: false,
  quietFrom: '22:00',
  quietTo: '07:00',

  googleCalendar: true,
  googleContacts: false,
  googleDrive: true,
  caldav: true,
  vcard: true,

  dailyBackup: true,
  monthlySnapshot: true,
  r2Enabled: true,
  driveBackup: true,
  gitManifest: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      set: (partial) => set(partial),
      reset: () => set(DEFAULTS),
    }),
    {
      name: 'protlife-settings',
      partialize: (state) => {
        // Persist everything except actions
        const { set: _, reset: _r, ...rest } = state;
        return rest;
      },
    }
  )
);

// Helper: get CSS value based on settings
export function fontSizeValue(index: number): string {
  return ['14px', '15px', '16px', '18px', '20px'][index] || '16px';
}
