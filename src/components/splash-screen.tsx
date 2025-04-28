'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Add a small delay for fade-out transition before navigating
      setTimeout(() => router.push('/postcode'), 500);
    }, 2000); // Show splash screen for 2 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-primary transition-opacity duration-500 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden={!isVisible}
      role="presentation" // Use presentation role for decorative elements
    >
      <div className="text-center animate-pulse">
        <Trash2 className="h-32 w-32 text-white mx-auto" strokeWidth={1.5} />
        <h1 className="mt-4 text-3xl font-bold text-white">
          Put 'Em Out Dreckly
        </h1>
      </div>
    </div>
  );
}
