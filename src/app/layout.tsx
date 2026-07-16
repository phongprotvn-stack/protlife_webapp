import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { MobileLayout } from '@/components/layout/mobile-layout';
import { DesktopLayout } from '@/components/layout/desktop-layout';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'PROT LIFE — Hệ điều hành cuộc sống cá nhân',
  description:
    'PROT LIFE là ứng dụng quản lý cuộc sống cá nhân, lưu trữ ký ức, theo dõi các mối quan hệ và sự kiện trong cuộc đời.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PROT LIFE',
  },
  icons: {
    apple: '/icon-192.png',
  },
  openGraph: {
    title: 'PROT LIFE',
    description: 'Hệ điều hành cuộc sống cá nhân',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#E6002D',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}
      >
        <Providers>
          {/* Mobile View (iOS 26 style) */}
          <div className="block md:hidden">
            <MobileLayout>{children}</MobileLayout>
          </div>
          {/* Desktop View (Windows 11 style) */}
          <div className="hidden md:block">
            <DesktopLayout>{children}</DesktopLayout>
          </div>
        </Providers>
      </body>
    </html>
  );
}
