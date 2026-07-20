'use client';

import { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase/client';

/**
 * Syncs the auth-store with the Supabase session across tabs.
 *
 * Strategy (3 layers of defence):
 * 1. getSession() on mount — restores session from cookie in a fresh tab
 * 2. onAuthStateChange — catches SIGNED_IN/SIGNED_OUT/TOKEN_REFRESHED events
 * 3. BroadcastChannel — relays login/logout events between tabs in real time
 * 4. window focus — catches the user switching to this tab after logging in elsewhere
 */
function AuthListener() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Helper: fetch profile name and update store
    const syncSession = async (userId: string, email: string, metadataName?: string) => {
      const store = useAuthStore.getState();
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, role')
          .eq('id', userId)
          .single();
        store.login({
          id: userId,
          email,
          name: profile?.name || metadataName || email.split('@')[0] || 'User',
          role: profile?.role || 'viewer',
        });
      } catch {
        store.login({
          id: userId,
          email,
          name: metadataName || email.split('@')[0] || 'User',
          role: 'viewer',
        });
      }
    };

    // ─── 1. Sync existing session on mount ───
    const initFromSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const store = useAuthStore.getState();
      if (session?.user) {
        const u = session.user;
        if (store.user?.id !== u.id) {
          await syncSession(u.id, u.email || '', u.user_metadata?.name);
        }
      } else {
        if (store.isLoggedIn) store.logout();
      }
    };
    initFromSession();

    // ─── 2. React to auth events ───
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const store = useAuthStore.getState();

      if (event === 'SIGNED_OUT') {
        store.logout();
        bc?.postMessage({ type: 'LOGOUT' });
        return;
      }

      // Covers SIGNED_IN, TOKEN_REFRESHED, INITIAL_SESSION
      if (session?.user) {
        const u = session.user;
        if (store.user?.id === u.id) return;
        await syncSession(u.id, u.email || '', u.user_metadata?.name);
        // Notify other tabs
        if (event === 'SIGNED_IN') {
          bc?.postMessage({ type: 'LOGIN', userId: u.id });
        }
      }
    });

    // ─── 3. BroadcastChannel for cross-tab sync ───
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('protlife-auth');
      bc.onmessage = async (msg) => {
        if (msg.data?.type === 'LOGIN' || msg.data?.type === 'LOGOUT') {
          // Re-check session when another tab signals a change
          const { data: { session } } = await supabase.auth.getSession();
          const store = useAuthStore.getState();
          if (session?.user) {
            if (store.user?.id !== session.user.id) {
              await syncSession(session.user.id, session.user.email || '', session.user.user_metadata?.name);
            }
          } else {
            if (store.isLoggedIn) store.logout();
          }
        }
      };
    } catch {
      // BroadcastChannel not supported in this browser (Safari < 15.4, etc.)
    }

    // ─── 4. Re-check on focus (user switches to this tab) ───
    const handleFocus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const store = useAuthStore.getState();
      if (session?.user) {
        if (store.user?.id !== session.user.id) {
          await syncSession(session.user.id, session.user.email || '', session.user.user_metadata?.name);
        }
      } else {
        if (store.isLoggedIn) store.logout();
      }
    };
    window.addEventListener('focus', handleFocus);

    // ─── Cleanup ───
    return () => {
      subscription.unsubscribe();
      bc?.close();
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthListener />
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#111111',
            color: 'white',
            borderRadius: '40px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '500',
            border: 'none',
            boxShadow: '0 12px 48px rgba(0,0,0,0.12)',
          },
        }}
      />
    </QueryClientProvider>
  );
}
