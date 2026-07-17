import { create } from 'zustand';

interface AppState {
  refreshKey: number;
  triggerRefresh: () => void;

  addModalType: string | null;
  setAddModal: (type: string | null) => void;

  // Right panel selection (Desktop)
  selectedContactId: string | null;
  selectedEventId: string | null;
  selectedMemoryId: string | null;
  selectedOrgId: string | null;
  selectedDocumentId: string | null;
  selectedGoalId: string | null;
  rightPanelView: 'detail' | 'add' | 'edit' | null;

  selectContact: (id: string | null) => void;
  selectEvent: (id: string | null) => void;
  selectMemory: (id: string | null) => void;
  selectOrg: (id: string | null) => void;
  selectDocument: (id: string | null) => void;
  selectGoal: (id: string | null) => void;
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
  selectedMemoryId: null,
  selectedOrgId: null,
  selectedDocumentId: null,
  selectedGoalId: null,
  rightPanelView: null,

  selectContact: (id) => set({
    selectedContactId: id, selectedEventId: null, selectedMemoryId: null,
    selectedOrgId: null, selectedDocumentId: null, selectedGoalId: null,
    rightPanelView: id ? 'detail' : null,
  }),
  selectEvent: (id) => set({
    selectedEventId: id, selectedContactId: null, selectedMemoryId: null,
    selectedOrgId: null, selectedDocumentId: null, selectedGoalId: null,
    rightPanelView: id ? 'detail' : null,
  }),
  selectMemory: (id) => set({
    selectedMemoryId: id, selectedContactId: null, selectedEventId: null,
    selectedOrgId: null, selectedDocumentId: null, selectedGoalId: null,
    rightPanelView: id ? 'detail' : null,
  }),
  selectOrg: (id) => set({
    selectedOrgId: id, selectedContactId: null, selectedEventId: null,
    selectedMemoryId: null, selectedDocumentId: null, selectedGoalId: null,
    rightPanelView: id ? 'detail' : null,
  }),
  selectDocument: (id) => set({
    selectedDocumentId: id, selectedContactId: null, selectedEventId: null,
    selectedMemoryId: null, selectedOrgId: null, selectedGoalId: null,
    rightPanelView: id ? 'detail' : null,
  }),
  selectGoal: (id) => set({
    selectedGoalId: id, selectedContactId: null, selectedEventId: null,
    selectedMemoryId: null, selectedOrgId: null, selectedDocumentId: null,
    rightPanelView: id ? 'detail' : null,
  }),
  clearSelection: () => set({
    selectedContactId: null, selectedEventId: null, selectedMemoryId: null,
    selectedOrgId: null, selectedDocumentId: null, selectedGoalId: null,
    rightPanelView: null,
  }),
  setRightPanelView: (view) => set({ rightPanelView: view }),
}));
