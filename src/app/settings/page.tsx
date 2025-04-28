'use client';

import { useState, useEffect } from 'react';
import { useAddress } from '@/context/address-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card'; // Removed Header/Title imports
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Star, BellRing, PlusCircle, Loader2, Home } from 'lucide-react'; // Added Home
import { Header } from '@/components/header';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { type Address } from '@/services/cornwall-council-api';
import { Separator } from '@/components/ui/separator';

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
    setIsClient(true); // Component ready client-side
  }, []);

   // Redirect logic remains the same
   useEffect(() => {
     if (!addressLoading && favourites.length === 0 && !selectedAddress) {
       router.replace('/postcode');
     }
   }, [addressLoading, favourites, selectedAddress, router]);

  const handleSelectFavourite = (fav: Address) => {
    setAddress(fav); // Set the full address object
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
    // Redirect if it was the last favourite and wasn't selected
     if (favourites.length === 1 && !selectedAddress) {
         setTimeout(() => router.replace('/postcode'), 100);
     }
     // If the deleted one *was* selected, the context handles clearing it,
     // and the dashboard/postcode page will handle redirect if needed.
  };

  const handleNotificationToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
     toast({
       title: `Notifications ${enabled ? 'Enabled' : 'Disabled'}`,
       description: enabled ? `You will be reminded at ${String(notificationTime).padStart(2, '0')}:00 the day before.` : 'You will no longer receive bin reminders.',
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

  if (!isClient || addressLoading) {
     return (
       // Use background for the container
       <div className="flex flex-col h-full bg-background">
         <Header showBackButton={true} backDestination="/dashboard" />
         <div className="flex-grow p-4 md:p-6 space-y-6 flex items-center justify-center">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
           <p className="ml-3 text-muted-foreground">Loading settings...</p>
         </div>
       </div>
     );
   }


  return (
     // Use background for the container
    <div className="flex flex-col h-full bg-background">
       {/* Ensure back button always goes to dashboard from settings */}
      <Header showBackButton={true} backDestination="/dashboard" />
      <div className="flex-grow p-4 md:p-6 space-y-8">
        <h1 className="text-2xl md:text-3xl font-bold text-center animate-fade-in">Settings</h1>

        {/* Favourites Section */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" /> Favourite Addresses
          </h2>
           {/* Minimal card: no border/shadow on light, subtle border on dark */}
          {favourites.length > 0 ? (
             <Card className="border-transparent dark:border shadow-none bg-card">
               <CardContent className="p-0">
                 <ul className="divide-y divide-border">
                   {favourites.map((fav) => (
                     <li key={fav.uprn} className="flex items-center justify-between p-3 md:p-4 hover:bg-muted/50 transition-colors duration-150">
                       <button
                         className="flex-grow mr-2 text-left text-sm md:text-base group" // Added group for potential future use
                         onClick={() => handleSelectFavourite(fav)}
                         aria-label={`Select address: ${fav.address}. ${selectedAddress?.uprn === fav.uprn ? 'Currently selected.' : ''}`}
                       >
                         <span className={`${selectedAddress?.uprn === fav.uprn ? 'font-semibold text-primary' : 'text-foreground'}`}>
                            {fav.address}
                         </span>
                         {/* Show postcode subtly */}
                         <span className="block text-xs text-muted-foreground">{fav.postcode}</span>
                       </button>
                         {/* Show Home icon if selected */}
                        {selectedAddress?.uprn === fav.uprn && (
                          <Home className="h-4 w-4 text-primary mr-2 shrink-0" />
                        )}
                       <Button
                         variant="ghost"
                         size="icon"
                         className="text-muted-foreground hover:text-destructive h-8 w-8 md:h-9 md:w-9 shrink-0" // Added shrink-0
                         onClick={(e) => { e.stopPropagation(); handleDeleteFavourite(fav.uprn); }} // Prevent select on delete click
                         aria-label={`Remove ${fav.address} from favourites`}
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </li>
                   ))}
                 </ul>
               </CardContent>
             </Card>
          ) : (
             <p className="text-muted-foreground text-sm text-center mt-4">
               You haven't saved any favourite addresses yet.
             </p>
           )}
          <Button variant="outline" onClick={() => router.push('/postcode')} className="w-full mt-4">
             <PlusCircle className="mr-2 h-4 w-4" /> Add New Address
           </Button>
        </div>

        <Separator /> {/* Separator */}

        {/* Notifications Section */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
             <BellRing className="h-5 w-5 text-accent" /> Notifications
           </h2>
          {/* Minimal card: no border/shadow on light, subtle border on dark */}
          <Card className="border-transparent dark:border shadow-none bg-card">
             <CardContent className="space-y-4 pt-6">
               <div className="flex items-center justify-between">
                 <Label htmlFor="notifications-enabled" className="text-sm md:text-base flex-grow mr-4 cursor-pointer">
                   Enable Reminders
                   <p className="text-xs md:text-sm text-muted-foreground font-normal mt-1">Receive a notification the day before collection.</p>
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
                 <Separator className="my-3" />
                 <div className="space-y-2 animate-fade-in"> {/* Fade in time selection */}
                   <Label htmlFor="notification-time" className="text-sm md:text-base">Reminder Time</Label>
                   <Select
                     value={String(notificationTime)}
                     onValueChange={handleTimeChange}
                     disabled={!notificationsEnabled}
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
                   <p className="text-xs md:text-sm text-muted-foreground pt-1">
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
