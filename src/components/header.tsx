'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Settings, ArrowLeft, Menu, Trash2 } from 'lucide-react'; // Added Menu
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useAddress } from '@/context/address-context'; // Import useAddress
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

interface HeaderProps {
  showBackButton?: boolean;
  backDestination?: string; // Optional specific destination for back button
  showAddress?: boolean; // Option to show the address in the header
}

export function Header({
  showBackButton = false,
  backDestination,
  showAddress = true, // Default to true for dashboard-like headers
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { selectedAddress, loading } = useAddress(); // Get selected address and loading state

  const handleBack = () => {
    if (backDestination) {
      router.push(backDestination);
    } else {
      router.back();
    }
  };

  // Function to format address for display (optional: shorten if needed)
  const formatDisplayAddress = (address: string | undefined): string => {
    if (!address) return '';
    // Example: Simple truncation (adjust logic as needed)
    // const maxLength = 25;
    // return address.length > maxLength ? `${address.substring(0, maxLength)}...` : address;
    return address; // Return full address for now
  };

  return (
    // Use border-b for separation, standard height
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Left side: Back/Menu button and optional Title/Address */}
        <div className="flex items-center gap-1">
          {showBackButton ? (
            <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
             // Show Menu icon instead of back button (placeholder for drawer nav)
             // Link Menu to settings for now, replace with sidebar/drawer logic later
            <Button variant="ghost" size="icon" asChild aria-label="Open settings menu">
               <Link href="/settings">
                 <Menu className="h-5 w-5" />
               </Link>
            </Button>
          )}

           {/* Display Address or App Title */}
           {showAddress && !loading && selectedAddress ? (
               <span className="text-sm font-medium text-muted-foreground truncate ml-1" title={selectedAddress.address}>
                 {formatDisplayAddress(selectedAddress.address)}
               </span>
           ) : showAddress && loading ? (
               <Skeleton className="h-4 w-32 ml-1" />
           ) : (
              // Fallback to App Title if address isn't shown or available
              <Link href="/" className="flex items-center space-x-2 ml-1">
                 <Trash2 className="h-5 w-5 text-primary" />
                 <span className="font-semibold text-base hidden sm:inline-block">Put 'Em Out Dreckly</span>
               </Link>
           )}

        </div>

        {/* Right side: Theme toggle and Settings button */}
        <div className="flex items-center gap-0.5">
           {/* Settings Button - always visible unless it's the settings page itself? */}
           {/* Conditionally hide settings icon if already on settings page? */}
          {router.pathname !== '/settings' && ( // Example: Hide on settings page
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
