
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Settings, ArrowLeft, Menu, Trash2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
import { useAddress } from '@/context/address-context';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDisplayAddress } from '@/lib/address-utils'; // Import the centralized formatter

interface HeaderProps {
  showBackButton?: boolean;
  backDestination?: string;
  pageTitle?: string; // Prop for context (e.g., accessibility, document title)
  showAddress?: boolean;
}

export function Header({
  showBackButton = false,
  backDestination,
  // pageTitle prop is not directly rendered if showAddress is true and address is available
  showAddress = true,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname(); // Get current path
  const { selectedAddress, loading } = useAddress();

  const handleBack = () => {
    if (backDestination) {
      router.push(backDestination);
    } else {
      router.back();
    }
  };

  // Helper to determine the displayed text in the header
  const getHeaderText = (): string | React.ReactNode => {
    if (loading) {
      return <Skeleton className="h-4 w-32 ml-1" />;
    }
    if (showAddress && selectedAddress) {
      // Use the centralized formatter
      const formatted = formatDisplayAddress(selectedAddress.address, selectedAddress.postcode);
      // For header, let's use the first 2-3 parts for brevity if too long, or all if short
      // The imported formatDisplayAddress already limits to 4 parts, which was what the old hardcoded one did.
      // The 'truncate' class will handle overflow.
      return formatted || 'Address Details';
    }
    // Fallback to App Title
    return (
      <Link href="/" className="flex items-center space-x-2 ml-1">
        <Trash2 className="h-5 w-5 text-primary" />
        <span className="font-semibold text-base hidden sm:inline-block">Put 'Em Out Dreckly</span>
      </Link>
    );
  };


  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-1">
          {showBackButton ? (
            <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" asChild aria-label="Open settings menu">
              <Link href="/settings">
                <Menu className="h-5 w-5" />
              </Link>
            </Button>
          )}

          {/* Display Address or App Title */}
          <div className="text-sm font-medium text-muted-foreground truncate ml-1" title={selectedAddress?.address || ''}>
            {getHeaderText()}
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          {pathname !== '/settings' && (
            <Button variant="ghost" size="icon" asChild aria-label="Go to settings">
              <Link href="/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
