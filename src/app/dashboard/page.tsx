'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAddress } from '@/context/address-context';
import { getBinCollectionData, type BinCollectionData } from '@/services/cornwall-council-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Header } from '@/components/header';
import { Trash2, Recycle, Leaf } from 'lucide-react'; // Using Leaf for Garden Waste


export default function DashboardPage() {
  const { selectedAddress, loading: addressLoading } = useAddress();
  const [binData, setBinData] = useState<BinCollectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // If address context is still loading, wait.
    if (addressLoading) {
      setIsLoading(true);
      return;
    }

    // If no address is selected after loading, redirect to postcode entry.
    if (!selectedAddress) {
      // Check if there are favourites, if so redirect to settings, otherwise postcode
      // This logic is handled by the context loading now. If no selectedAddress, go to postcode.
      router.replace('/postcode'); // Use replace to prevent going back to dashboard without address
      return;
    }

    // Fetch bin data if an address is selected.
    const fetchBinData = async () => {
      setIsLoading(true);
      try {
        const data = await getBinCollectionData(selectedAddress.uprn);
        setBinData(data);
      } catch (error) {
        console.error('Error fetching bin collection data:', error);
        // Optionally show a toast message here
      } finally {
        setIsLoading(false);
      }
    };

    fetchBinData();
  }, [selectedAddress, router, addressLoading]);

  const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    try {
      // Format date without year for minimalism if desired, but keeping year for clarity
      return format(date, 'EEEE, do MMMM yyyy');
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Invalid Date';
    }
  };

  return (
    <div className="flex flex-col h-full bg-secondary dark:bg-background">
      <Header showBackButton={false} />
      <div className="flex-grow p-4 md:p-6 space-y-6">
        <div className="text-center mb-8"> {/* Increased bottom margin */}
          <h1 className="text-3xl font-bold">Your Bin Collections</h1>
           {selectedAddress && (
             <p className="text-muted-foreground mt-2">
               Showing collections for: {selectedAddress.address}
             </p>
           )}
         </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {isLoading ? (
            <>
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
            </>
          ) : binData ? (
            <>
              {/* Removed shadow-md and hover:shadow-lg */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">General Waste</CardTitle>
                  <Trash2 className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-semibold">
                    {formatDate(binData.generalWaste)}
                  </div>
                </CardContent>
              </Card>

              {/* Removed shadow-md and hover:shadow-lg */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">Recycling</CardTitle>
                  <Recycle className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-semibold">
                    {formatDate(binData.recycling)}
                  </div>
                </CardContent>
              </Card>

              {/* Removed shadow-md and hover:shadow-lg */}
              <Card>
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-base font-medium">Garden Waste</CardTitle>
                   <Leaf className="h-5 w-5 text-green-600" />
                 </CardHeader>
                 <CardContent>
                   <div className="text-xl font-semibold">
                     {binData.gardenWaste ? formatDate(binData.gardenWaste) : 'Not Subscribed'}
                   </div>
                 </CardContent>
               </Card>
            </>
          ) : (
            <p className="text-center col-span-1 md:col-span-3 text-muted-foreground">
              Could not load bin collection data.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

    