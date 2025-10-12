'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Download, Shield, Zap, Cloud } from 'lucide-react';

export default function HomePage() {
  const { status } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            AI-Powered File Cleanup
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Intelligent file deduplication system that uses AI to find and manage duplicate files
            efficiently. Clean up your storage and organize your files with ease.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {status === 'authenticated' ? (
              <>
                <Link
                  href="/upload"
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Start Cleanup
                </Link>
                <Link
                  href="/licenses"
                  className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  View Licenses
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Get Started
                </Link>
                <Link
                  href="/register"
                  className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <Zap className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Advanced machine learning models detect similar files with high accuracy
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <Shield className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Safe & Secure</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Files are never deleted permanently. Everything goes to recycle bin first
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <Cloud className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Web & Desktop</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Use our web app for quick cleanups or desktop app for deep local scans
            </p>
          </div>
        </div>
      </div>

      {/* Desktop App Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 md:p-12 text-white">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Download className="w-8 h-8" />
              <h2 className="text-3xl font-bold">Desktop Application</h2>
            </div>
            <p className="text-xl mb-6 text-blue-100">
              Download our powerful desktop app for Windows, macOS, and Linux. Scan entire
              directories and manage files locally with full control.
            </p>
            <Link
              href="/download"
              className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Download Desktop App
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {status !== 'authenticated' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Clean Up Your Files?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
              Sign up now and start organizing your files with AI
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
