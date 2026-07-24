import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase/client';

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
  b2Enabled: boolean;
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
  b2Enabled: true,
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

// ─── Supabase sync ───

let _serverHydrate = false; // prevents feedback loop when loading from server

// Debounce helper
function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

const debouncedUpsert = debounce(async (state: SettingsState) => {
  if (_serverHydrate) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { set: _, reset: _r, ...settings } = state;
  const { error } = await supabase.from('user_preferences').upsert({
    user_id: user.id,
    settings,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) {
    console.warn('[settings-store] Upsert failed:', error.message);
  }
}, 800);

// Subscribe: every store change → upsert to Supabase (debounced)
useSettingsStore.subscribe((state) => {
  if (!_serverHydrate) {
    debouncedUpsert(state);
  }
});

/**
 * Load settings from Supabase user_preferences table.
 * Call this when user logs in (from AuthProvider, layout, or login flow).
 * If server data exists, it overwrites localStorage defaults.
 */
export async function loadSettingsFromServer(userId: string) {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('settings')
    .eq('user_id', userId)
    .single();

  if (error || !data?.settings) return; // no server data yet

  _serverHydrate = true;
  useSettingsStore.setState(data.settings as Partial<SettingsState>);
  // Re-enable upsert after state settles
  setTimeout(() => { _serverHydrate = false; }, 200);
}

// Helper: get CSS value based on settings
export function fontSizeValue(index: number): string {
  return ['14px', '15px', '16px', '18px', '20px'][index] || '16px';
}
