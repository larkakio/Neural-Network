import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { IBM_Plex_Mono, Orbitron } from 'next/font/google';
import { cookieToInitialState } from 'wagmi';
import { Providers } from './providers';
import { config } from '@/lib/wagmi/config';
import './globals.css';

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
});

const ibmPlex = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-ibm-plex',
  display: 'swap',
});

const baseAppId =
  process.env.NEXT_PUBLIC_BASE_APP_ID?.trim() || '';

export const metadata: Metadata = {
  title: 'Neural Network',
  description: 'Swipe the grid. Sync the signal. Built for Base.',
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieHeader = (await headers()).get('cookie') ?? undefined;
  const initialState = cookieToInitialState(config, cookieHeader);

  return (
    <html lang="en" className={`${orbitron.variable} ${ibmPlex.variable}`}>
      <head>
        <meta name="base:app_id" content={baseAppId} />
      </head>
      <body className="relative min-h-dvh overflow-x-hidden antialiased">
        <div className="nn-backdrop" aria-hidden />
        <Providers initialState={initialState}>{children}</Providers>
      </body>
    </html>
  );
}
