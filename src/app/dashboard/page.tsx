
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAddress } from '@/context/address-context';
import { getBinCollectionData, type BinCollectionData } from '@/services/cornwall-council-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isValid, differenceInDays, isToday, isTomorrow, formatRelative } from 'date-fns';
import { Header } from '@/components/header'; // Use the existing header
import { BinIcon } from '@/components/bin-icon'; // Use the BinIcon component
import { DashboardIllustration } from '@/components/dashboard-illustration'; // Import illustration
import { AlertCircle, RefreshCw } from 'lucide-react'; // Icons for error/retry
import { Button } from '@/components/ui/button'; // Import button for Retry

// Extend BinCollectionData to include the bin type for mapping
interface CollectionEntry {
  type: 'generalWaste' | 'recycling' | 'foodWaste' | string; // Use specific types + string fallback
  date: Date | null;
  name: string; // e.g., "Rubbish", "Recycling"
}

export default function DashboardPage() {
  const { selectedAddress, loading: addressLoading, setAddress } = useAddress(); // Add setAddress
  const [binData, setBinData] = useState<BinCollectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchBinData = async (uprn: string, postcode: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getBinCollectionData(uprn, postcode);
      setBinData(data);
    } catch (error) {
      console.error('Error fetching bin collection data:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred fetching collection data.');
      setBinData(null);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    if (addressLoading) {
      setIsLoading(true);
      setError(null);
      return;
    }

    if (!selectedAddress) {
      console.log("Dashboard: No selected address, redirecting to postcode.");
      router.replace('/postcode');
      return;
    }

    if (!selectedAddress.uprn || !selectedAddress.postcode) {
        console.error("Dashboard: Selected address missing UPRN or Postcode:", selectedAddress);
        setError("Selected address information is incomplete. Please re-select your address.");
        setAddress(null); // Clear corrupted address from context
        router.replace('/postcode'); // Redirect to fix it
        setIsLoading(false);
        return;
    }

    fetchBinData(selectedAddress.uprn, selectedAddress.postcode);

  }, [selectedAddress, addressLoading, router, setAddress]); // Added setAddress dependency

  const formatDate = (date: Date | null): string => {
    if (!date || !isValid(date)) return 'Not scheduled';
    try {
      return format(date, 'EEEE, d MMMM'); // e.g., Monday, 10 January
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Invalid Date';
    }
  };

  const formatRelativeDays = (date: Date | null): string => {
    if (!date || !isValid(date)) return '';
    const today = new Date();
    // Set time to 00:00:00 for accurate day difference calculation
    today.setHours(0, 0, 0, 0);
    const collectionDate = new Date(date);
    collectionDate.setHours(0, 0, 0, 0);

    const daysDiff = differenceInDays(collectionDate, today);

    if (daysDiff < 0) return 'Past'; // Should ideally not happen with future dates
    if (daysDiff === 0) return 'Today';
    if (daysDiff === 1) return 'Tomorrow';
    // Now use "In X Days" for all future dates > 1 day
    return `In ${daysDiff} days`;
  };

  // Prepare sorted collection entries
  const collectionEntries: CollectionEntry[] = binData
    ? [
        { type: 'generalWaste', date: binData.generalWaste, name: 'Rubbish' },
        { type: 'recycling', date: binData.recycling, name: 'Recycling' },
        { type: 'foodWaste', date: binData.foodWaste, name: 'Food Waste' },
      ]
        .filter(entry => entry.date && isValid(entry.date)) // Filter out invalid/null dates
        // Sort by date, soonest first
        .sort((a, b) => (a.date!.getTime() - b.date!.getTime()))
    : [];

   const nextCollection = collectionEntries.length > 0 ? collectionEntries[0] : null;

  // --- Skeleton Loading State ---
  const renderSkeleton = () => (
    <div className="flex flex-col flex-grow p-4 md:p-6 space-y-4 animate-pulse">
      {/* Header Skeleton */}
      {/* Removed as Header component handles its own loading state */}
       {/* Illustration Placeholder */}
      <div className="flex justify-center items-center h-32 mb-4">
         <Skeleton className="h-24 w-48 rounded-lg" />
       </div>
       {/* Next Collection Skeleton */}
      <div className="mb-6 text-center">
        <Skeleton className="h-4 w-24 mx-auto mb-1" />
        <Skeleton className="h-6 w-48 mx-auto mb-1" />
        <Skeleton className="h-5 w-32 mx-auto" />
      </div>
       {/* Collection List Skeleton */}
      <div className="space-y-3">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-md" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );

   // --- Error State ---
  const renderError = () => (
    <div className="flex flex-col flex-grow items-center justify-center text-center p-6 space-y-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold text-destructive">Oops! Something went wrong.</h2>
      <p className="text-muted-foreground max-w-sm">{error || 'Could not load bin collection data.'}</p>
      <Button
        variant="outline"
        onClick={() => selectedAddress && fetchBinData(selectedAddress.uprn, selectedAddress.postcode)}
        disabled={isLoading}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        Retry
      </Button>
      <Button variant="link" onClick={() => router.push('/postcode')}>
        Change Address
      </Button>
    </div>
  );


  // --- Main Content ---
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Integrate Header */}
      <Header showBackButton={false} /> {/* Hamburger menu could be added to Header later */}

      {isLoading ? (
        renderSkeleton()
      ) : error ? (
         <div className="flex-grow flex flex-col"> {renderError()} </div>
      ) : binData && selectedAddress ? (
        <div className="flex-grow p-4 md:p-6 space-y-6 overflow-y-auto">
           {/* Illustration Area */}
          <div className="flex justify-center items-center mb-4">
            <DashboardIllustration className="h-24 md:h-32 w-auto text-primary" />
          </div>

           {/* Next Collection Section */}
           {nextCollection ? (
             <div className="text-center mb-6 animate-fade-in">
               <p className="text-sm text-muted-foreground mb-1">Next Collection</p>
               <h1 className="text-2xl md:text-3xl font-semibold">
                 {formatDate(nextCollection.date)}
               </h1>
               <p className="text-lg text-primary mt-1">{formatRelativeDays(nextCollection.date)}</p>
             </div>
           ) : (
              <div className="text-center mb-6 animate-fade-in">
                <p className="text-muted-foreground">No upcoming collections scheduled.</p>
              </div>
           )}


           {/* Collection List */}
           <div className="space-y-1 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {collectionEntries.length > 0 ? (
              collectionEntries.map((entry, index) => (
                <div
                  key={`${entry.type}-${index}`} // Use index in key for stability if types repeat
                  className="flex items-center justify-between py-3 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <BinIcon binType={entry.type} className="h-8 w-8" /> {/* Larger Icon */}
                    <div>
                      <p className="font-medium">{formatDate(entry.date)}</p>
                      <p className="text-sm text-muted-foreground">{entry.name}</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">
                    {formatRelativeDays(entry.date)}
                  </span>
                </div>
              ))
            ) : (
              !isLoading && <p className="text-center text-muted-foreground pt-4">No collection data available.</p>
            )}
           </div>
        </div>
      ) : (
         // Fallback if binData is null but no error (e.g., initial state before fetch)
         <div className="flex flex-col flex-grow items-center justify-center">
             <p className="text-muted-foreground">Loading collection data...</p>
         </div>
      )}
    </div>
  );
}

