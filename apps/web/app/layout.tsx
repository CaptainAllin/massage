import './globals.css';
import type { Metadata, Viewport } from 'next';
import { inter, sora } from '@/lib/fonts';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ServiceWorkerProvider } from '@/components/providers/ServiceWorkerProvider';

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
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <head />
      <body>
        <ServiceWorkerProvider />
        <AuthProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
