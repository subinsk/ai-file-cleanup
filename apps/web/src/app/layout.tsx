import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/header';
import { ClientErrorBoundary } from '@/components/client-error-boundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI File Cleanup - Intelligent File Deduplication',
  description: 'AI-powered file deduplication system for managing duplicate files efficiently',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientErrorBoundary>
          <Providers>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center text-gray-600 dark:text-gray-400">
                    <p>&copy; 2024 AI File Cleanup. All rights reserved.</p>
                    <div className="mt-2 space-x-4">
                      <a href="#" className="hover:text-blue-600">
                        Terms
                      </a>
                      <a href="#" className="hover:text-blue-600">
                        Privacy
                      </a>
                      <a href="#" className="hover:text-blue-600">
                        Support
                      </a>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </Providers>
        </ClientErrorBoundary>
      </body>
    </html>
  );
}
