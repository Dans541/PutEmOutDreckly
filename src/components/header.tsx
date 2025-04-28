'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Settings, ArrowLeft, Trash2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  showBackButton?: boolean;
  backDestination?: string; // Optional specific destination for back button
}

export function Header({ showBackButton = false, backDestination }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleBack = () => {
    if (backDestination) {
      router.push(backDestination);
    } else {
      router.back();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          {showBackButton && (
            <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
           <Link href="/dashboard" className="flex items-center space-x-2" aria-label="Go to dashboard">
             <Trash2 className="h-6 w-6 text-primary" />
             <span className="font-bold hidden sm:inline-block">Put 'Em Out Dreckly</span>
           </Link>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild aria-label="Go to settings">
            <Link href="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
