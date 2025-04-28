'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useAddress } from '@/context/address-context'; // Import useAddress

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [startExit, setStartExit] = useState(false); // State to trigger exit animation
  const router = useRouter();
  const { selectedAddress, favourites, loading } = useAddress(); // Get context state

  useEffect(() => {
    // Wait until loading is finished before deciding where to navigate
    if (!loading) {
      const timer = setTimeout(() => {
        setStartExit(true); // Start fade-out animation

        // Determine destination after fade-out animation completes
        setTimeout(() => {
          setIsVisible(false); // Make invisible after fade out
          if (selectedAddress) {
            router.replace('/dashboard'); // Go to dashboard if address selected
          } else if (favourites.length > 0) {
            // Keep user on postcode page if favourites exist but none selected
            router.replace('/postcode');
          } else {
            router.replace('/postcode'); // Go to postcode entry if no address/favourites
          }
        }, 300); // Wait for fade-out animation (duration-300)
      }, 1500); // Splash duration (1.5 seconds)

      return () => clearTimeout(timer);
    }
     // If still loading, do nothing yet
  }, [router, selectedAddress, favourites, loading]); // Add dependencies

  return (
    <div
      // Use primary color for background to match BinDays green
      className={`fixed inset-0 flex items-center justify-center bg-primary transition-opacity duration-300 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none' // Fade out or hide
      } ${startExit ? 'opacity-0' : 'opacity-100'}`} // Control fade-out trigger
      aria-hidden={!isVisible}
      role="presentation"
    >
      {/* Apply entrance animation */}
      <div className={`text-center transition-transform duration-500 ease-out ${isVisible && !startExit ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
         {/* Use primary-foreground color for icon and text */}
        <Trash2 className="h-24 w-24 text-primary-foreground mx-auto" strokeWidth={1.5} />
        <h1 className="mt-4 text-2xl font-semibold text-primary-foreground">
          Put 'Em Out Dreckly
        </h1>
      </div>
    </div>
  );
}
