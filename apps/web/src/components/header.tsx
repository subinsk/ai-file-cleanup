'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { LogOut, User, Menu } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">AC</span>
              </div>
              <span className="font-semibold text-xl text-gray-900 dark:text-white">
                AI File Cleanup
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {status === 'authenticated' ? (
              <>
                <Link
                  href="/upload"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Upload
                </Link>
                <Link
                  href="/licenses"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Licenses
                </Link>
                <Link
                  href="/docs"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Docs
                </Link>
                <Link
                  href="/download"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Download
                </Link>
                <div className="flex items-center space-x-2 border-l border-gray-200 dark:border-gray-700 pl-4">
                  <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                    <User className="w-4 h-4" />
                    <span className="text-sm">{session?.user?.email}</span>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/upload"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Upload
                </Link>
                <Link
                  href="/docs"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Docs
                </Link>
                <Link
                  href="/download"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Download
                </Link>
                <Link
                  href="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            {status === 'authenticated' ? (
              <div className="space-y-2">
                <Link
                  href="/upload"
                  className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
                >
                  Upload
                </Link>
                <Link
                  href="/licenses"
                  className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
                >
                  Licenses
                </Link>
                <Link
                  href="/docs"
                  className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
                >
                  Docs
                </Link>
                <Link
                  href="/download"
                  className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
                >
                  Download
                </Link>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400 px-3 py-2">
                    {session?.user?.email}
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="block w-full text-left text-red-600 dark:text-red-400 px-3 py-2 rounded-md text-base font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/docs"
                  className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
                >
                  Docs
                </Link>
                <Link
                  href="/download"
                  className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
                >
                  Download
                </Link>
                <Link
                  href="/login"
                  className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-md text-base font-medium text-center"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
