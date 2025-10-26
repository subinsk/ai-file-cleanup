'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { LogOut, User, Menu, Upload, History, Download } from 'lucide-react';
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
          <div className="hidden md:flex items-center space-x-1">
            {status === 'authenticated' ? (
              <>
                {/* Primary Actions */}
                <Link
                  href="/upload"
                  className="flex items-center space-x-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Files</span>
                </Link>

                <Link
                  href="/uploads"
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <History className="w-4 h-4" />
                  <span>My Uploads</span>
                </Link>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

                {/* Secondary Links */}
                <Link
                  href="/docs"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Docs
                </Link>
                <Link
                  href="/download"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                </Link>

                {/* User Menu */}
                <div className="flex items-center space-x-2 border-l border-gray-200 dark:border-gray-700 pl-4 ml-2">
                  <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">{session?.user?.email}</span>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Guest Navigation */}
                <Link
                  href="/upload"
                  className="flex items-center space-x-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Files</span>
                </Link>

                <Link
                  href="/docs"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Docs
                </Link>
                <Link
                  href="/download"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                </Link>

                <div className="flex items-center space-x-2 border-l border-gray-200 dark:border-gray-700 pl-4 ml-2">
                  <Link
                    href="/login"
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            {status === 'authenticated' ? (
              <div className="space-y-2">
                {/* Primary Actions */}
                <Link
                  href="/upload"
                  className="flex items-center space-x-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-3 rounded-lg text-base font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload Files</span>
                </Link>

                <Link
                  href="/uploads"
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 px-4 py-3 rounded-lg text-base font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <History className="w-5 h-5" />
                  <span>My Uploads</span>
                </Link>

                {/* Secondary Links */}
                <Link
                  href="/docs"
                  className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 px-4 py-3 rounded-lg text-base font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Documentation
                </Link>
                <Link
                  href="/download"
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 px-4 py-3 rounded-lg text-base font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Download className="w-5 h-5" />
                  <span>Download App</span>
                </Link>

                {/* User Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 px-4 py-2">
                    <User className="w-5 h-5" />
                    <span className="text-sm">{session?.user?.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/' });
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 w-full text-left text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-base font-medium transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Guest Actions */}
                <Link
                  href="/upload"
                  className="flex items-center space-x-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-3 rounded-lg text-base font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload Files</span>
                </Link>

                <Link
                  href="/docs"
                  className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 px-4 py-3 rounded-lg text-base font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Documentation
                </Link>
                <Link
                  href="/download"
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 px-4 py-3 rounded-lg text-base font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Download className="w-5 h-5" />
                  <span>Download App</span>
                </Link>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 space-y-2">
                  <Link
                    href="/login"
                    className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 px-4 py-3 rounded-lg text-base font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="block bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 px-4 py-3 rounded-lg text-base font-medium text-center transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
