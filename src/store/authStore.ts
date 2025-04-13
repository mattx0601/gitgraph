import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      login: async (token: string) => {
        const response = await fetch('https://api.github.com/user', {
          headers: { Authorization: `token ${token}` },
        });
        
        if (!response.ok) throw new Error('Invalid token');
        
        const userData = await response.json();
        console.log('Authenticated as:', userData.login);
        
        set({ token, isAuthenticated: true });
      },
      logout: () => set({ token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', // unique name for localStorage key
      partialize: (state) => ({ token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);