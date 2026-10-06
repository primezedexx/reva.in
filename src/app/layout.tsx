import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Reva — Digital Loyalty Card & WhatsApp Customer Win-Back for Cafés',
  description:
    'Reva gives your customers a digital stamp card with no app to install. See who stopped visiting and bring back customers with one tap on WhatsApp. Perfect café loyalty program.',
  keywords: [
    'digital loyalty card',
    'café loyalty program',
    'digital stamp card',
    'WhatsApp customer win-back',
    'bring back customers',
    'restaurant loyalty program',
    'stamp card wallet',
  ],
  openGraph: {
    title: 'Reva — Digital Loyalty Card & WhatsApp Customer Win-Back for Cafés',
    description:
      'Digital stamp card with no app to install. Bring back customers with one tap on WhatsApp.',
    url: 'https://reva.in',
    siteName: 'Reva',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reva — Digital Loyalty Card & WhatsApp Customer Win-Back for Cafés',
    description:
      'Digital stamp cards with one-tap WhatsApp comeback messages for cafés and restaurants.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${outfit.variable} ${plusJakartaSans.variable}`}>
      <body className="min-h-full flex flex-col bg-white text-[#0F172A] font-sans antialiased selection:bg-[#0F172A] selection:text-white">
        {children}
      </body>
    </html>
  );
}
