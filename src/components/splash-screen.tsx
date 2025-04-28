'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useAddress } from '@/context/address-context'; // Import useAddress

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();
  const { selectedAddress, favourites, loading } = useAddress(); // Get context state

  useEffect(() => {
    // Wait until loading is finished before deciding where to navigate
    if (!loading) {
      const timer = setTimeout(() => {
        setIsVisible(false);

        // Determine destination after fade-out
        setTimeout(() => {
          if (selectedAddress) {
            router.replace('/dashboard'); // Go to dashboard if address selected
          } else if (favourites.length > 0) {
            router.replace('/settings'); // Go to settings if favourites exist but none selected
          } else {
            router.replace('/postcode'); // Go to postcode entry if no address/favourites
          }
        }, 300); // Shorter delay for fade-out
      }, 1500); // Shorter splash duration (1.5 seconds)

      return () => clearTimeout(timer);
    }
     // If still loading, do nothing yet
  }, [router, selectedAddress, favourites, loading]); // Add dependencies

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-primary transition-opacity duration-300 ease-in-out ${ // Faster fade
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none' // Add pointer-events-none when hidden
      }`}
      aria-hidden={!isVisible}
      role="presentation"
    >
      {/* Removed animation */}
      <div className="text-center">
        <Trash2 className="h-24 w-24 text-white mx-auto" strokeWidth={1.5} />
        <h1 className="mt-4 text-2xl font-semibold text-white"> {/* Adjusted font */}
          Put 'Em Out Dreckly
        </h1>
      </div>
    </div>
  );
}

    