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
    // Minimalist header: No border, uses background color.
    // Subtle bottom border in dark mode for separation if needed.
    <header className="sticky top-0 z-50 w-full bg-background dark:border-b dark:border-border/50">
      {/* Slightly increased height for better touch targets */}
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-1">
          {showBackButton && (
            <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
           <Link href="/dashboard" className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 transition-colors">
             <Trash2 className="h-6 w-6 text-primary" /> {/* Slightly larger icon */}
             {/* Keep title visible on small screens for branding */}
             <span className="font-semibold text-base sm:text-lg">Put 'Em Out Dreckly</span>
           </Link>
        </div>

        <div className="flex items-center space-x-0.5"> {/* Reduced space */}
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
            {/* Use Sun/Moon icons consistently */}
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
