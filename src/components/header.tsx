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
    // Removed background blur and reduced height from h-14 to h-12
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-12 items-center justify-between px-4">
        <div className="flex items-center space-x-1"> {/* Reduced space */}
          {showBackButton && (
            <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
           {/* Removed redundant aria-label */}
           <Link href="/dashboard" className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
             <Trash2 className="h-5 w-5 text-primary" /> {/* Slightly smaller icon */}
             <span className="font-semibold text-base hidden sm:inline-block">Put 'Em Out Dreckly</span> {/* Adjusted font */}
           </Link>
        </div>

        <div className="flex items-center space-x-1"> {/* Reduced space */}
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

    