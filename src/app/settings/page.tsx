'use client';

import { useState, useEffect } from 'react';
import { useAddress } from '@/context/address-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Star, BellRing, PlusCircle } from 'lucide-react'; // Added PlusCircle
import { Header } from '@/components/header';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { type Address } from '@/services/cornwall-council-api';
import { Separator } from '@/components/ui/separator'; // Import Separator

export default function SettingsPage() {
  const {
    favourites,
    removeFavourite,
    selectedAddress,
    setAddress,
    notificationTime,
    setNotificationTime,
    notificationsEnabled,
    setNotificationsEnabled,
    loading: addressLoading // Get loading state
  } = useAddress();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true); // Ensure component only renders client-side where localStorage is available
  }, []);

   // Redirect to postcode if no favourites and no selected address after loading
   useEffect(() => {
     if (!addressLoading && favourites.length === 0 && !selectedAddress) {
       router.replace('/postcode');
     }
   }, [addressLoading, favourites, selectedAddress, router]);

  const handleSelectFavourite = (fav: Address) => {
    setAddress(fav);
    toast({
      title: 'Address Selected',
      description: `Showing collections for ${fav.address}`,
    });
    router.push('/dashboard');
  };

  const handleDeleteFavourite = (uprn: string) => {
    removeFavourite(uprn);
    toast({
      title: 'Favourite Removed',
      description: 'Address removed from your favourites.',
      variant: 'destructive'
    });
    // If after deletion, no favourites are left and no address is selected, redirect
     if (favourites.length === 1 && !selectedAddress) { // Check length before state update
         // Timeout ensures state updates before redirect check in useEffect runs
         setTimeout(() => router.replace('/postcode'), 100);
     }
  };

  const handleNotificationToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
     toast({
       title: `Notifications ${enabled ? 'Enabled' : 'Disabled'}`,
       description: enabled ? `You will be reminded at ${notificationTime}:00 the day before.` : 'You will no longer receive bin reminders.',
     });
  };

 const handleTimeChange = (time: string) => {
   const newTime = parseInt(time, 10);
   setNotificationTime(newTime);
   if (notificationsEnabled) {
     toast({
       title: 'Reminder Time Updated',
       description: `You will now be reminded at ${newTime.toString().padStart(2, '0')}:00.`,
     });
   }
 };


  const availableTimes = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM (21:00)

  if (!isClient || addressLoading) { // Show loading or null state until context is ready
     return (
       <div className="flex flex-col h-full bg-secondary dark:bg-background">
         <Header showBackButton={true} backDestination="/dashboard" />
         <div className="flex-grow p-4 md:p-6 space-y-6 flex items-center justify-center">
           {/* Optional: Add a spinner or skeleton loader here */}
           <p>Loading settings...</p>
         </div>
       </div>
     );
   }


  return (
    <div className="flex flex-col h-full bg-secondary dark:bg-background">
      <Header showBackButton={true} backDestination="/dashboard" />
      <div className="flex-grow p-4 md:p-6 space-y-8"> {/* Increased spacing */}
        <h1 className="text-3xl font-bold text-center">Settings</h1>

        {/* Favourites Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" /> Favourite Addresses
          </h2>
          {favourites.length > 0 && (
             <Card> {/* Keep card for grouping list items */}
               <CardContent className="p-0"> {/* Remove padding */}
                 <ul className="divide-y divide-border"> {/* Use list and dividers */}
                   {favourites.map((fav) => (
                     <li key={fav.uprn} className="flex items-center justify-between p-4 hover:bg-muted/50">
                       <button
                         className={`flex-grow mr-2 text-left ${selectedAddress?.uprn === fav.uprn ? 'font-semibold text-primary' : ''}`}
                         onClick={() => handleSelectFavourite(fav)}
                         aria-label={`Select address: ${fav.address}. ${selectedAddress?.uprn === fav.uprn ? 'Currently selected.' : ''}`}
                       >
                         {fav.address}
                       </button>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="text-muted-foreground hover:text-destructive" // Subtle delete icon
                         onClick={() => handleDeleteFavourite(fav.uprn)}
                         aria-label={`Remove ${fav.address} from favourites`}
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </li>
                   ))}
                 </ul>
               </CardContent>
             </Card>
          )}
          <Button variant="outline" onClick={() => router.push('/postcode')} className="w-full mt-4">
             <PlusCircle className="mr-2 h-4 w-4" /> Add New Address
           </Button>
           {favourites.length === 0 && (
             <p className="text-muted-foreground text-sm text-center mt-4">
               You haven't saved any favourite addresses yet.
             </p>
           )}
        </div>

        <Separator /> {/* Separator between sections */}

        {/* Notifications Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
             <BellRing className="h-5 w-5 text-accent" /> Notifications
           </h2>
          <Card> {/* Use card for grouping notification settings */}
             <CardContent className="space-y-4 pt-6">
               <div className="flex items-center justify-between">
                 <Label htmlFor="notifications-enabled" className="text-base flex-grow mr-4">
                   Enable Reminders
                   <p className="text-sm text-muted-foreground font-normal">Receive a notification the day before collection.</p>
                 </Label>
                 <Switch
                   id="notifications-enabled"
                   checked={notificationsEnabled}
                   onCheckedChange={handleNotificationToggle}
                   aria-label="Toggle bin collection reminders"
                 />
               </div>

               {notificationsEnabled && (
                <>
                 <Separator className="my-4" />
                 <div className="space-y-2">
                   <Label htmlFor="notification-time">Reminder Time</Label>
                   <Select
                     value={String(notificationTime)}
                     onValueChange={handleTimeChange}
                     disabled={!notificationsEnabled} // Disable select if reminders off
                   >
                     <SelectTrigger id="notification-time" className="w-full" aria-label="Select reminder time">
                       <SelectValue placeholder="Select time" />
                     </SelectTrigger>
                     <SelectContent>
                       {availableTimes.map((hour) => (
                         <SelectItem key={hour} value={String(hour)}>
                           {`${hour.toString().padStart(2, '0')}:00`}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                   <p className="text-sm text-muted-foreground pt-1">
                     Reminders are sent the day before collection.
                   </p>
                 </div>
                </>
               )}
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

    