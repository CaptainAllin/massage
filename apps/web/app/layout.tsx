import './globals.css';
import type { Metadata } from 'next';
import { inter, poppins } from '@/lib/fonts';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'Wellness CRM - Practice Management for Wellness Professionals',
  description: 'Complete practice management platform for massage therapists, chiropractors, physiotherapists, and wellness clinics',
  keywords: ['wellness', 'CRM', 'practice management', 'massage', 'therapy', 'clinic'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
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
