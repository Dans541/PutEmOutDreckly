
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Address } from '@/services/cornwall-council-api';
import { useAddress } from '@/context/address-context';
import { getBinCollectionData, type BinCollectionData } from '@/services/cornwall-council-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isValid, differenceInDays } from 'date-fns';
import { Header } from '@/components/header';
import { BinIcon } from '@/components/bin-icon';
import { DashboardIllustration } from '@/components/dashboard-illustration';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CollectionEntry {
  type: 'generalWaste' | 'recycling' | 'foodWaste' | string;
  date: Date | null;
  name: string;
}

export default function DashboardPage() {
  const { selectedAddress, loading: addressLoading, setAddress } = useAddress();
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
        if (setAddress) {
          setAddress(null);
        }
        router.replace('/postcode');
        setIsLoading(false);
        return;
    }

    fetchBinData(selectedAddress.uprn, selectedAddress.postcode);

  }, [selectedAddress, addressLoading, router, setAddress]);

  const formatDate = (date: Date | null): string => {
    if (!date || !isValid(date)) return 'Not scheduled';
    try {
      return format(date, 'EEEE, d MMMM');
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Invalid Date';
    }
  };

  const formatRelativeDays = (date: Date | null): string => {
    if (!date || !isValid(date)) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const collectionDate = new Date(date);
    collectionDate.setHours(0, 0, 0, 0);

    const daysDiff = differenceInDays(collectionDate, today);

    if (daysDiff < 0) return 'Past';
    if (daysDiff === 0) return 'Today';
    if (daysDiff === 1) return 'Tomorrow';
    return `In ${daysDiff} days`;
  };

  const collectionEntries: CollectionEntry[] = binData
    ? [
        { type: 'foodWaste', date: binData.foodWaste, name: 'Food Waste' },
        { type: 'recycling', date: binData.recycling, name: 'Recycling' },
        { type: 'generalWaste', date: binData.generalWaste, name: 'Rubbish' },
      ]
        .filter(entry => entry.date && isValid(entry.date))
        .sort((a, b) => (a.date!.getTime() - b.date!.getTime()))
    : [];

   const nextCollection = collectionEntries.length > 0 ? collectionEntries.find(entry => entry.date && differenceInDays(entry.date, new Date()) >= 0) || collectionEntries[0] : null;


  const renderSkeleton = () => (
    <div className="flex flex-col flex-grow p-4 md:p-6 space-y-4 animate-pulse">
      <div className="flex justify-center items-center h-32 mb-4">
         <Skeleton className="h-24 w-48 rounded-lg" />
       </div>
      <div className="mb-6 text-center">
        <Skeleton className="h-4 w-24 mx-auto mb-1" />
        <Skeleton className="h-6 w-48 mx-auto mb-1" />
        <Skeleton className="h-5 w-32 mx-auto" />
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex items-center justify-between py-5 px-4 border-b rounded-lg">
            <div className="flex items-center gap-5">
              <Skeleton className="h-14 w-14 rounded-md" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );

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

  return (
    <>
      <Header showBackButton={false} />
      <div className="flex flex-col h-full bg-background overflow-y-auto">
        {isLoading ? (
          renderSkeleton()
        ) : error ? (
          renderError()
        ) : (
          <div className="flex-grow flex flex-col">
            {binData && selectedAddress ? (
              collectionEntries.length > 0 ? (
                <div className="flex-grow p-4 md:p-6 space-y-6 overflow-y-auto"> {/* Increased space-y */}
 <div className="flex justify-center items-center mb-4">
                    <DashboardIllustration className="h-48 md:h-64 w-auto text-primary" data-ai-hint="recycling bins" />
                  </div>

                  {nextCollection && (
                    <Card className="animate-fade-in shadow-md rounded-xl bg-card">
                      <CardHeader className="pt-4 pb-2"> {/* Adjusted padding */}
                        <CardTitle className="text-center text-lg font-medium text-primary"> {/* Adjusted font size and weight */}
                          Next Collection
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-center pt-1 pb-4"> {/* Adjusted padding */}
                        <div className="text-center">
                          <p className="text-2xl md:text-3xl font-semibold mb-1 text-foreground">{formatDate(nextCollection.date)}</p> {/* Adjusted font weight */}
                          <p className="text-sm text-muted-foreground">{formatRelativeDays(nextCollection.date)}</p> {/* Adjusted font size */}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}> {/* Increased space-y */}
                  {collectionEntries.map((entry, index) => (
                    <Card
                      key={`${entry.type}-${index}`}
                      className={`flex items-center justify-between p-5 rounded-xl shadow-lg
                        ${
                          entry.type === 'foodWaste'
                            ? 'bg-green-700 text-primary-foreground dark:bg-green-800 dark:text-primary-foreground'
                            : entry.type === 'recycling'
                            ? 'bg-lime-600 text-primary-foreground dark:bg-lime-700 dark:text-primary-foreground'
                            : 'bg-gray-600 text-primary-foreground dark:bg-gray-700 dark:text-primary-foreground'
                        }
                      `}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`flex items-center justify-center h-14 w-14 rounded-lg
                            ${
                              entry.type === 'foodWaste' ? 'bg-green-800 dark:bg-green-900' :
                              entry.type === 'recycling' ? 'bg-lime-700 dark:bg-lime-800' :
                              'bg-gray-700 dark:bg-gray-800'
                            }`}>
                           <BinIcon binType={entry.type} className="h-9 w-9 text-white" />
                        </div>
                        <div className="flex flex-col">
                           <p className="font-semibold text-lg leading-tight text-white">{formatDate(entry.date)}</p>
                           <p className="text-sm opacity-80 leading-tight text-white">{entry.name}</p>
                        </div>
                    </div>
                       <span className="text-base font-medium text-white">
                        {formatRelativeDays(entry.date)}
                      </span>
                    </Card>
                  ))}
                </div>
                </div>
              ) : (
                <div className="flex flex-col flex-grow items-center justify-start text-center p-6 space-y-4">
 <DashboardIllustration className="h-12 md:h-16 w-auto text-primary mb-4" data-ai-hint="empty calendar" />
                  <h2 className="text-xl font-semibold">No Upcoming Collections!</h2>
                  <p className="text-muted-foreground max-w-sm">
                    You're all caught up with your bin collections for the near future. Check back later for updates.
                  </p>
                </div>
              )
            ) : (
              <div className="flex flex-col flex-grow items-center justify-start text-center p-6 space-y-4">
                 <p className="text-muted-foreground">Preparing dashboard...</p>
               </div>
             )}
          </div>
        )}
      </div>
    </>
  );
}

