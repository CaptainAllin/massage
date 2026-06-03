import './globals.css';
import type { Metadata, Viewport } from 'next';
import { inter, sora } from '@/lib/fonts';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'Iris — Wellness Practice Management',
  description: 'Complete practice management platform for massage therapists, chiropractors, physiotherapists, and wellness clinics',
  keywords: ['wellness', 'CRM', 'practice management', 'massage', 'therapy', 'clinic'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Iris',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#5D4AA8',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Iris" />
      </head>
      <body>
        <AuthProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
