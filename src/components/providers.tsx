'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';

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
