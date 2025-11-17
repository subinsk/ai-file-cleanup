'use client';

import { Download, Monitor, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-6">
            <Download className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Download Desktop App
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Get the full power of AI File Cleanup on your desktop. Scan entire directories, manage
            files locally, and process unlimited files with advanced AI detection.
          </p>
        </div>

        {/* Download Card */}
        <div className="max-w-2xl mx-auto mb-16">
          {/* Windows */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:shadow-2xl transition-all group">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform">
                <Monitor className="w-16 h-16 text-blue-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-2 text-center dark:text-white">Windows</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-2 text-center">
              Windows 10 or later (64-bit)
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
              Version 1.0.0
            </p>
            <div className="flex gap-3 mb-4">
              <a
                href="https://github.com/subinsk/ai-file-cleanup/releases/download/v1.0.0/AI-File-Cleanup-1.0.0.exe"
                className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium shadow-md hover:shadow-lg text-center"
              >
                <div className="text-sm opacity-90 mb-1">NSIS Installer</div>
                <div className="font-semibold">.exe • 80 MB</div>
              </a>
              <a
                href="https://github.com/subinsk/ai-file-cleanup/releases/download/v1.0.0/AI-File-Cleanup-1.0.0.msi"
                className="flex-1 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors font-medium shadow-md hover:shadow-lg text-center"
              >
                <div className="text-sm opacity-90 mb-1">MSI Installer</div>
                <div className="font-semibold">.msi • 90 MB</div>
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center font-medium">
                Alternative Downloads:
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <a
                  href="https://github.com/subinsk/ai-file-cleanup/releases/download/v1.0.0/AI-File-Cleanup-1.0.0-Portable.exe"
                  className="text-sm px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  Portable (.exe)
                </a>
                <a
                  href="https://github.com/subinsk/ai-file-cleanup/releases/download/v1.0.0/AI-File-Cleanup-1.0.0-win.zip"
                  className="text-sm px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  ZIP Archive
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center dark:text-white">
            Desktop App Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1 dark:text-white">Offline Processing</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Scan and process files without internet connection
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1 dark:text-white">Unlimited Files</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No file size or count limitations
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1 dark:text-white">Directory Scanning</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Scan entire folders and subfolders recursively
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1 dark:text-white">Safe Operations</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Files moved to recycle bin, never permanently deleted
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* System Requirements */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 dark:text-white">System Requirements</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-3 text-lg dark:text-white">Minimum</h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>
                    <strong>OS:</strong> Windows 10 (64-bit)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>
                    <strong>Processor:</strong> Intel Core i3 or equivalent
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>
                    <strong>RAM:</strong> 4 GB
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>
                    <strong>Storage:</strong> 500 MB available space
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>
                    <strong>Internet:</strong> Required for activation and AI features
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-lg dark:text-white">Recommended</h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>
                    <strong>OS:</strong> Windows 11 (64-bit)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>
                    <strong>Processor:</strong> Intel Core i5 or AMD Ryzen 5
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>
                    <strong>RAM:</strong> 8 GB or more
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>
                    <strong>Storage:</strong> 2 GB available space
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>
                    <strong>Internet:</strong> Broadband connection
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 dark:text-white">Installation Instructions</h2>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2 dark:text-white">
              <Monitor className="w-5 h-5 text-blue-600" />
              Windows Installation
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300 ml-2">
              <li>Download either the .exe (NSIS) or .msi installer from above</li>
              <li>Double-click the downloaded file</li>
              <li>Follow the installation wizard steps</li>
              <li>Launch the app and enter your license key to activate</li>
            </ol>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-300">
              Which installer should I choose?
            </h3>
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <div>
                <strong className="text-blue-900 dark:text-blue-300">NSIS Installer (.exe):</strong>{' '}
                Popular installer with customizable installation wizard. Smaller file size (80 MB),
                supports custom install locations, and creates Start Menu shortcuts. Good for most
                users who want flexibility.
              </div>
              <div>
                <strong className="text-blue-900 dark:text-blue-300">MSI Installer (.msi):</strong>{' '}
                Windows standard installer format (90 MB). Better integration with Windows Installer
                service, supports Group Policy deployment, and preferred in enterprise environments.
                Recommended for IT administrators.
              </div>
              <div>
                <strong className="text-blue-900 dark:text-blue-300">Portable (.exe):</strong> No
                installation required. Run directly from any location. Great for USB drives or
                testing.
              </div>
              <div>
                <strong className="text-blue-900 dark:text-blue-300">ZIP Archive:</strong> Contains
                the complete portable version with all dependencies. Extract and run from any
                location.
              </div>
            </div>
          </div>
        </div>

        {/* License Info */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-8 text-center border border-blue-200 dark:border-blue-800">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Need a License?</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            A desktop license is required to use the desktop application. Web licenses do not work
            with the desktop app. Sign up to manage your licenses.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium shadow-md hover:shadow-lg"
          >
            Sign Up & Get License
          </Link>
        </div>

        {/* Release Notes */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 dark:text-white">Release Notes</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold dark:text-white">Version 1.0.0</h3>
                <span className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                  Latest
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Released October 2025</p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Initial release</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>AI-powered duplicate detection for images, documents, and code</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Local directory scanning</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Safe file operations (moves to recycle bin)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>License key activation system</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Windows 10/11 support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
