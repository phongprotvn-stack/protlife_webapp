import { create } from 'zustand';

interface AppState {
  // Refresh trigger
  refreshKey: number;
  triggerRefresh: () => void;

  // Global add modal
  addModalType: string | null;
  setAddModal: (type: string | null) => void;

  // Right panel selection (Desktop)
  selectedContactId: string | null;
  selectedEventId: string | null;
  rightPanelView: 'detail' | 'add' | 'edit' | null;
  selectContact: (id: string | null) => void;
  selectEvent: (id: string | null) => void;
  clearSelection: () => void;
  setRightPanelView: (view: 'detail' | 'add' | 'edit' | null) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  refreshKey: 0,
  triggerRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),

  addModalType: null,
  setAddModal: (type) => set({ addModalType: type }),

  selectedContactId: null,
  selectedEventId: null,
  rightPanelView: null,
  selectContact: (id) => set({ selectedContactId: id, selectedEventId: null, rightPanelView: id ? 'detail' : null }),
  selectEvent: (id) => set({ selectedEventId: id, selectedContactId: null, rightPanelView: id ? 'detail' : null }),
  clearSelection: () => set({ selectedContactId: null, selectedEventId: null, rightPanelView: null }),
  setRightPanelView: (view) => set({ rightPanelView: view }),
}));
