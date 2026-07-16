import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isMobile: boolean;
  isSidebarOpen: boolean;
  isInspectorOpen: boolean;
  activeTab: 'home' | 'contacts' | 'events' | 'memories' | 'settings';
  setMobile: (val: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (val: boolean) => void;
  toggleInspector: () => void;
  setActiveTab: (tab: UIState['activeTab']) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isMobile: false,
      isSidebarOpen: true,
      isInspectorOpen: false,
      activeTab: 'home',
      setMobile: (val) => set({ isMobile: val }),
      toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
      setSidebarOpen: (val) => set({ isSidebarOpen: val }),
      toggleInspector: () => set((s) => ({ isInspectorOpen: !s.isInspectorOpen })),
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'protlife-ui',
      partialize: (state) => ({ activeTab: state.activeTab }),
    }
  )
);

interface AppState {
  // Global search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  
  // Refresh trigger
  refreshKey: number;
  triggerRefresh: () => void;
  
  // Filters
  contactFilter: {
    relationship: string;
    status: string;
    isFavorite: boolean | null;
  };
  setContactFilter: (filter: Partial<AppState['contactFilter']>) => void;
  
  eventFilter: {
    eventType: string;
    importance: string;
    mood: string;
  };
  setEventFilter: (filter: Partial<AppState['eventFilter']>) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  refreshKey: 0,
  triggerRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
  contactFilter: {
    relationship: '',
    status: '',
    isFavorite: null,
  },
  setContactFilter: (filter) =>
    set((s) => ({ contactFilter: { ...s.contactFilter, ...filter } })),
  eventFilter: {
    eventType: '',
    importance: '',
    mood: '',
  },
  setEventFilter: (filter) =>
    set((s) => ({ eventFilter: { ...s.eventFilter, ...filter } })),
}));
