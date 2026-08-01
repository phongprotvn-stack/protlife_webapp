import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'public' | 'viewer' | 'contributor' | 'admin';
}

interface AuthState {
  isLoggedIn: boolean;
  user: UserProfile | null;
  isSigningOut: boolean;
  /** true khi AuthListener đã check xong Supabase session ở lần mount đầu (getSession) */
  sessionChecked: boolean;
  login: (user: UserProfile) => void;
  logout: () => void;
  setSigningOut: (v: boolean) => void;
  setSessionChecked: (v: boolean) => void;
}

const DEFAULT_ADMIN: UserProfile = {
  id: 'admin-001',
  email: 'phongprot.vn@gmail.com',
  name: 'Prot',
  role: 'admin',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,
      isSigningOut: false,
      sessionChecked: false,
      login: (user) => {
        set({ isLoggedIn: true, user });
      },
      logout: () => set({ isLoggedIn: false, user: null, isSigningOut: false }),
      setSigningOut: (v) => set({ isSigningOut: v }),
      setSessionChecked: (v) => set({ sessionChecked: v }),
    }),
    {
      name: 'protlife-auth',
      partialize: (state) => ({ isLoggedIn: state.isLoggedIn, user: state.user }),
    }
  )
);

export { DEFAULT_ADMIN };
