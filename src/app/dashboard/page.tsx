
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAddress } from '@/context/address-context';
import { getBinCollectionData, type BinCollectionData } from '@/services/cornwall-council-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isValid } from 'date-fns';
import { Header } from '@/components/header';
import { Trash2, Recycle, Utensils } from 'lucide-react'; // Using Utensils for Food Waste

export default function DashboardPage() {
  const { selectedAddress, loading: addressLoading } = useAddress();
  const [binData, setBinData] = useState<BinCollectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Add error state
  const router = useRouter();

  useEffect(() => {
    if (addressLoading) {
      setIsLoading(true);
      setError(null); // Clear error on reload
      return;
    }

    if (!selectedAddress) {
      console.warn("Dashboard reached without selected address after loading.");
      router.replace('/postcode');
      return;
    }

    if (!selectedAddress.uprn || !selectedAddress.postcode) {
        console.error("Selected address is missing UPRN or Postcode:", selectedAddress);
        setError("Selected address information is incomplete. Please re-select your address.");
        setIsLoading(false);
        return;
    }

    const fetchBinData = async () => {
      setIsLoading(true);
      setError(null); // Clear previous errors
      try {
        const data = await getBinCollectionData(selectedAddress.uprn, selectedAddress.postcode);
        setBinData(data);
      } catch (error) {
        console.error('Error fetching bin collection data:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred.');
        setBinData(null); // Clear bin data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchBinData();
  }, [selectedAddress, router, addressLoading]);

  const formatDate = (date: Date | null): string => {
    if (!date || !isValid(date)) return 'Not scheduled'; // More informative text
    try {
      return format(date, 'EEEE, do MMMM'); // Simplified format
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Invalid Date';
    }
  };

  // Function to calculate animation delay
  const getAnimationDelay = (index: number) => `${index * 0.1}s`;

  const renderSkeletonCard = (index: number) => (
     // Mimic Card structure with padding and spacing for a nicer look
    <div
      key={index}
      className="rounded-lg border border-border bg-card p-4 space-y-3 animate-pulse"
      style={{ animationDelay: getAnimationDelay(index) }} // Apply delay here too
    >
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-1/3" /> {/* Title placeholder */}
        <Skeleton className="h-5 w-5 rounded-full" /> {/* Icon placeholder */}
      </div>
      <Skeleton className="h-6 w-3/4" /> {/* Date placeholder */}
    </div>
  );


  return (
    // Use background for the whole page container
    <div className="flex flex-col h-full bg-background">
      <Header showBackButton={false} />
      <div className="flex-grow p-4 md:p-6 space-y-6">
        <div className="text-center mb-6 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold">Your Collections</h1>
           {selectedAddress && (
             <p className="text-sm md:text-base text-muted-foreground mt-1">
               {selectedAddress.address}, {selectedAddress.postcode}
             </p>
           )}
         </div>

        {isLoading ? (
            // Responsive grid: 1 col default, 2 cols on sm+, 3 cols on lg+
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 3 }).map((_, index) => renderSkeletonCard(index))}
            </div>
          ) : error ? (
             <Card className="border-destructive bg-destructive/10 animate-fade-in">
               <CardHeader>
                 <CardTitle className="text-destructive text-lg">Error Loading Data</CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-destructive-foreground">{error}</p>
                 <p className="text-muted-foreground text-sm mt-2">Please try selecting your address again or check back later.</p>
               </CardContent>
             </Card>
          ) : binData ? (
             // Use the same responsive grid for the actual cards
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {/* General Waste (Rubbish) */}
              <Card
                className="animate-slide-up"
                style={{ animationDelay: getAnimationDelay(0) }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">Rubbish</CardTitle>
                  <Trash2 className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-xl font-semibold">
                    {formatDate(binData.generalWaste)}
                  </div>
                  {/* Optional: Add next collection day if available */}
                  {/* <p className="text-xs text-muted-foreground pt-1">Next: {formatDate(binData.nextGeneralWaste)}</p> */}
                </CardContent>
              </Card>

              {/* Recycling */}
              <Card
                className="animate-slide-up"
                style={{ animationDelay: getAnimationDelay(1) }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">Recycling</CardTitle>
                  <Recycle className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-xl font-semibold">
                    {formatDate(binData.recycling)}
                  </div>
                </CardContent>
              </Card>

               {/* Food Waste */}
              <Card
                className="animate-slide-up"
                style={{ animationDelay: getAnimationDelay(2) }}
               >
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-base font-medium">Food Waste</CardTitle>
                   {/* Using a consistent color from theme */}
                   <Utensils className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                 </CardHeader>
                 <CardContent>
                   <div className="text-lg md:text-xl font-semibold">
                     {formatDate(binData.foodWaste)}
                   </div>
                 </CardContent>
               </Card>
            </div>
          ) : (
            <p className="text-center col-span-1 md:col-span-3 text-muted-foreground animate-fade-in">
              Could not load bin collection data. Ensure the address is correct.
            </p>
          )}
        </div>
      </div>
  );
}

    