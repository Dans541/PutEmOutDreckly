
'use client';

import { useState, useEffect } from 'react';
import { useAddress } from '@/context/address-context';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, BellRing, PlusCircle, Loader2, MapPin, Check } from 'lucide-react'; // Updated icons
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

   // Redirect if no favourites and no selection after loading
   useEffect(() => {
     // Only redirect if loading is finished AND it's not the initial hydration
     // And not currently on the postcode page trying to get back
     if (isClient && !addressLoading && favourites.length === 0 && !selectedAddress && window.location.pathname !== '/postcode') {
       console.log("Settings: No favourites or selected address, redirecting to postcode.");
       router.replace('/postcode');
     }
   }, [isClient, addressLoading, favourites, selectedAddress, router]);

    // Helper function for Title Case
    const titleCase = (str: string): string => {
        if (!str) return '';
        // Handle potential all-caps input from API by converting to lower first
        return str.toLowerCase()
          .split(' ')
          .map(word => {
            if (word.length > 0) {
              // Capitalize first letter
              return word.charAt(0).toUpperCase() + word.slice(1);
            }
            return '';
          })
          .join(' ');
      };


   // Function to format postcode with a space
   const formatPostcode = (postcode: string): string => {
     if (!postcode || typeof postcode !== 'string' || postcode.length < 4) return postcode;
     // Ensure it's uppercase and remove existing spaces
     const cleanedPostcode = postcode.toUpperCase().replace(/\s/g, '');
     // Insert space before the last 3 characters
     const outward = cleanedPostcode.slice(0, -3);
     const inward = cleanedPostcode.slice(-3);
     return `${outward} ${inward}`;
   };

    // Function to format address display: "Flat/Number, Building Name, Road Name"
    // e.g., "Flat 1, Lower Budock Mill, Hill Head"
    const formatDisplayAddress = (fullAddressString: string | undefined, postcode: string | undefined): string => {
        if (!fullAddressString || typeof fullAddressString !== 'string') return 'Invalid Address';
        if (!postcode || typeof postcode !== 'string') return titleCase(fullAddressString); // Fallback

        // Normalize strings for comparison
        let address = fullAddressString;
        const lowerAddress = address.toLowerCase();
        const lowerPostcodeWithSpace = formatPostcode(postcode).toLowerCase();
        const lowerPostcodeWithoutSpace = postcode.toLowerCase().replace(/\s/g, '');

        // 1. Define terms to remove from the end (order matters)
        const termsToRemove = [
            `, ${lowerPostcodeWithSpace}`, lowerPostcodeWithSpace, // With comma first
            `, ${lowerPostcodeWithoutSpace}`, lowerPostcodeWithoutSpace,
            ', cornwall', ' cornwall',
            // Add common Cornwall towns/areas (lowercase) - add more as needed
            ', penryn', ' penryn',
            ', falmouth', ' falmouth',
            ', truro', ' truro',
            ', camborne', ' camborne',
            ', redruth', ' redruth',
            ', penzance', ' penzance',
            ', st austell', ' st austell',
            ', bodmin', ' bodmin',
            ', newquay', ' newquay',
            ', helston', ' helston',
            ', st ives', ' st ives',
            ', saltash', ' saltash',
            ', liskeard', ' liskeard',
            ', launceston', ' launceston',
            ', hayle', ' hayle',
            ', torpoint', ' torpoint',
            ', wadebridge', ' wadebridge',
            ', st just', ' st just',
            ', bude', ' bude',
            ', callington', ' callington',
            ', padstow', ' padstow',
            ', fowey', ' fowey',
            ', lostwithiel', ' lostwithiel',
            ', perranporth', ' perranporth',
            ', mousehole', ' mousehole',
            ', polzeath', ' polzeath',
        ];

        // Remove UPRN if it's appended (basic check for long number at the end)
        address = address.replace(/,\s*\d{10,}$/, '').trim();
        address = address.replace(/\s+\d{10,}$/, '').trim();


        // 2. Iteratively remove terms from the end of the lowercased string
        let cleanedLowerAddress = lowerAddress;
        termsToRemove.forEach(term => {
            if (cleanedLowerAddress.endsWith(term)) {
                cleanedLowerAddress = cleanedLowerAddress.substring(0, cleanedLowerAddress.length - term.length).trim();
            }
        });

        // 3. Get the corresponding part from the original cased string
        let finalAddress = address.substring(0, cleanedLowerAddress.length).trim();
        finalAddress = finalAddress.replace(/,$/, '').trim(); // Remove trailing comma if any

        // 4. Apply Title Case
        finalAddress = titleCase(finalAddress);

        // 5. Add comma after "Flat X" or "Number X" if needed
        // Looks for "Flat" or "Number" followed by digits, then a space, then a capital letter (start of next part)
        finalAddress = finalAddress.replace(/^(Flat \d+|[A-Z]?\d+[A-Z]?)\s([A-Z])/i, '$1, $2');
        // Add comma after a house name ending in a letter if followed by a number (start of street num) - less common?
        // finalAddress = finalAddress.replace(/([a-zA-Z])\s(\d+[A-Z]?\s[A-Z])/i, '$1, $2');

        // If cleaning resulted in empty string, fallback to first part of original
        if (!finalAddress) {
          return titleCase(fullAddressString.split(',')[0] || fullAddressString);
        }

        return finalAddress;
    };


  const handleSelectFavourite = (fav: Address) => {
    setAddress(fav); // Set the full address object
    toast({
      title: 'Address Selected',
      // description: `Showing collections for ${fav.address}`, // Keep it concise
    });
    router.push('/dashboard'); // Go to dashboard after selecting
  };

  const handleDeleteFavourite = (uprn: string) => {
    removeFavourite(uprn);
    toast({
      title: 'Favourite Removed',
      // description: 'Address removed from your favourites.',
      variant: 'destructive'
    });
     // Context handles clearing selectedAddress if needed.
     // Redirect handled by useEffect if it was the last favourite.
  };

  const handleNotificationToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
     toast({
       title: `Notifications ${enabled ? 'Enabled' : 'Disabled'}`,
       // description: enabled ? `You will be reminded at ${String(notificationTime).padStart(2, '0')}:00.` : '', // Simpler toast
     });
  };

 const handleTimeChange = (time: string) => {
   const newTime = parseInt(time, 10);
   setNotificationTime(newTime);
   if (notificationsEnabled) {
     toast({
       title: 'Reminder Time Updated',
       // description: `Reminder set to ${newTime.toString().padStart(2, '0')}:00.`,
     });
   }
 };


  const availableTimes = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM (21:00)

  if (!isClient || addressLoading) {
     return (
       <div className="flex flex-col h-full bg-background">
         {/* Show header even during load, but with back button */}
         <Header showBackButton={true} backDestination="/dashboard" showAddress={false} />
         <div className="flex-grow p-4 md:p-6 flex items-center justify-center">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
       </div>
     );
   }


  return (
    <div className="flex flex-col h-full bg-background">
       {/* Use Header, back button goes to dashboard */}
      <Header showBackButton={true} backDestination="/dashboard" showAddress={false} />

      <div className="flex-grow p-4 md:p-6 space-y-6 overflow-y-auto">

        {/* Favourite Addresses Section */}
        <div className="animate-fade-in">
          <h2 className="text-base font-semibold mb-3 text-muted-foreground px-1">SAVED ADDRESSES</h2>
          <div className="bg-card rounded-lg border"> {/* Add border and bg for grouping */}
            {favourites.length > 0 ? (
                <ul className="divide-y">
                  {favourites.map((fav) => (
                    <li key={fav.uprn} className="flex items-center justify-between p-3 gap-2 hover:bg-muted/30 transition-colors duration-150">
                       <button
                         className="flex-grow flex items-center gap-3 text-left group"
                         onClick={() => handleSelectFavourite(fav)}
                         aria-label={`Select address: ${formatDisplayAddress(fav.address, fav.postcode)}. ${selectedAddress?.uprn === fav.uprn ? 'Currently selected.' : ''}`}
                       >
                          <MapPin className={`h-5 w-5 shrink-0 ${selectedAddress?.uprn === fav.uprn ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div className="flex-grow min-w-0"> {/* Added min-w-0 for proper truncation */}
                           <span className={`block text-sm truncate ${selectedAddress?.uprn === fav.uprn ? 'font-semibold text-primary' : 'text-foreground'}`}>
                              {formatDisplayAddress(fav.address, fav.postcode)} {/* Use formatted address */}
                           </span>
                           <span className="block text-xs text-muted-foreground">{formatPostcode(fav.postcode)}</span> {/* Use formatted postcode */}
                         </div>
                        </button>
                       {/* Show Check icon if selected */}
                       {selectedAddress?.uprn === fav.uprn && (
                         <Check className="h-5 w-5 text-primary mr-2 shrink-0" />
                       )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleDeleteFavourite(fav.uprn); }}
                        aria-label={`Remove ${formatDisplayAddress(fav.address, fav.postcode)} from favourites`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
            ) : (
              <p className="text-muted-foreground text-sm text-center p-4">
                No saved addresses.
              </p>
            )}
             {/* Add New Address Button */}
             <div className="border-t p-3">
                <Button variant="ghost" onClick={() => router.push('/postcode')} className="w-full justify-start text-primary font-semibold">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Address
                </Button>
              </div>
          </div>
        </div>

        {/* Separator is optional, depends on visual preference */}
        {/* <Separator className="my-4" /> */}

        {/* Notifications Section */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-base font-semibold mb-3 text-muted-foreground px-1">NOTIFICATIONS</h2>
          <div className="bg-card rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="notifications-enabled" className="flex-grow cursor-pointer text-sm">
                Enable Collection Reminders
                {/* <p className="text-xs text-muted-foreground font-normal mt-0.5">Get notified the day before.</p> */}
              </Label>
              <Switch
                id="notifications-enabled"
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
                aria-label="Toggle bin collection reminders"
              />
            </div>

            {notificationsEnabled && (
              <div className="space-y-2 animate-fade-in pt-2 border-t">
                <Label htmlFor="notification-time" className="text-sm">Reminder Time (Day Before)</Label>
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
              </div>
            )}
          </div>
        </div>

        {/* Add other sections like About, Feedback etc. here following the same pattern */}

      </div>
    </div>
  );
}


    
    