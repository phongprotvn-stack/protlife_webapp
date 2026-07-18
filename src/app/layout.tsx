'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import './globals.css';
import { AuthGuard } from '@/components/layout/auth-guard';
import { MobileLayout } from '@/components/layout/mobile-layout';
import { DesktopLayout } from '@/components/layout/desktop-layout';
import { PWARegister } from '@/components/pwa-register';
import { Providers } from '@/components/providers';

// Pages that don't need the app layout (login, register, etc.)
const AUTH_PAGES = ['/login', '/register', '/', '/_not-found'];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const isAuthPage = AUTH_PAGES.includes(pathname);

  // For auth pages, render standalone
  if (isAuthPage) {
    return (
      <html lang="vi">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <link rel="icon" href="/favicon.ico" />
          <title>PROT LIFE</title>
        </head>
        <body>
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="vi">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="icon" href="/favicon.ico" />
        <title>PROT LIFE</title>
      </head>
      <body>
        <PWARegister />
        <Providers>
          <AuthGuard>
            {isMobile ? (
              <MobileLayout>{children}</MobileLayout>
            ) : (
              <DesktopLayout>{children}</DesktopLayout>
            )}
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
