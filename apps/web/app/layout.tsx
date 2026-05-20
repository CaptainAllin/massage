import './globals.css';
import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { inter, poppins } from '@/lib/fonts';
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
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
        <body>
          <QueryProvider>
            {children}
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
