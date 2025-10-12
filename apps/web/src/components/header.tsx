'use client';

import Link from 'next/link';
import { Button } from '@ai-cleanup/ui';
import { useAuthStore } from '@/lib/store';
import { apiClient } from '@/lib/api-client';
import { FileIcon, LogOut, User } from 'lucide-react';

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <FileIcon className="h-6 w-6" />
          <span>AI File Cleanup</span>
        </Link>

        <nav className="ml-8 flex items-center gap-6">
          <Link
            href="/upload"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Upload
          </Link>
          {isAuthenticated && (
            <Link
              href="/review"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Review
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="default" size="sm">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

