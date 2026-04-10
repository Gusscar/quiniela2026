import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  setSession: (session: Session | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  setSession: (session) => set({ session, user: session?.user ?? null, loading: false }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, isAdmin: false });
  },
}));
