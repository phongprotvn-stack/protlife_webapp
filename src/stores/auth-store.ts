import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'viewer' | 'contributor';
}

interface AuthState {
  isLoggedIn: boolean;
  user: UserProfile | null;
  login: (user: UserProfile) => void;
  logout: () => void;
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
      login: (user) => {
        // Force admin name
        if (user.email?.toLowerCase() === 'phongprot.vn@gmail.com' && user.name !== 'Prot') {
          user.name = 'Prot';
        }
        set({ isLoggedIn: true, user });
      },
      logout: () => set({ isLoggedIn: false, user: null }),
    }),
    {
      name: 'protlife-auth',
      partialize: (state) => ({ isLoggedIn: state.isLoggedIn, user: state.user }),
    }
  )
);

export { DEFAULT_ADMIN };
