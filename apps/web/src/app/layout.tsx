import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@ai-cleanup/ui/styles.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI File Cleanup - Smart Duplicate Detection',
  description: 'AI-powered file deduplication system with smart similarity detection',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

