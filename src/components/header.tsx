
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Settings, ArrowLeft, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';
import { useAddress } from '@/context/address-context';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDisplayAddress } from '@/lib/address-utils';
import { useState, useEffect } from 'react';
import { AppLogo } from '@/components/app-logo';


interface HeaderProps {
  showBackButton?: boolean;
  backDestination?: string;
  pageTitle?: string;
  showAddress?: boolean;
}

export function Header({
  showBackButton = false,
  backDestination,
  showAddress = true,
}: HeaderProps) {
  const { resolvedTheme, setTheme } = useTheme(); // Use resolvedTheme for initial consistency
  const router = useRouter();
  const pathname = usePathname();
  const { selectedAddress, loading } = useAddress();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBack = () => {
    if (backDestination) {
      router.push(backDestination);
    } else {
      router.back();
    }
  };

  const getHeaderText = (): string | React.ReactNode => {
    if (loading) {
      return <Skeleton className="h-4 w-32 ml-1" />;
    }
    if (showAddress && selectedAddress) {
      const formatted = formatDisplayAddress(selectedAddress.address, selectedAddress.postcode);
      return formatted || 'Address Details';
    }
    return (
      <Link href="/" className="flex items-center space-x-2 ml-1">
        <AppLogo className="h-5 w-5 text-primary" />
        <span className="font-semibold text-base hidden sm:inline-block">Put 'Em Out Dreckly</span>
      </Link>
    );
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  const themeAriaLabel = mounted ? `Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode` : 'Toggle theme';


  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-1">
          {showBackButton ? (
            <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
             // Show Menu icon linking to settings on non-settings pages,
             // or back button on settings page if it's not the primary way to show back
            pathname === '/settings' && !showBackButton ? (
                 <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} aria-label="Go to dashboard">
                   <ArrowLeft className="h-5 w-5" />
                 </Button>
            ) : pathname !== '/settings' ? (
              <Button variant="ghost" size="icon" asChild aria-label="Open settings menu">
                <Link href="/settings">
                  <Menu className="h-5 w-5" />
                </Link>
              </Button>
            ) : <div className="w-10" /> // Placeholder to keep alignment if no icon is shown
          )}

          <div className="text-sm font-medium text-muted-foreground truncate ml-1" title={selectedAddress?.address ? formatDisplayAddress(selectedAddress.address, selectedAddress.postcode) : ''}>
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
            onClick={toggleTheme}
            aria-label={themeAriaLabel}
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
