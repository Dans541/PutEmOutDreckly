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

const titleCase = (str: string): string => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => {
    if (word.length === 0) return '';
    if (word.startsWith('(') && word.endsWith(')')) {
      const inner = word.slice(1, -1);
      return inner ? `(${titleCase(inner)})` : '()';
    }
    if (/^\d+$/.test(word)) return word; // 3 -> 3

    if (/^\d+[a-zA-Z]+$/.test(word)) { // 1a -> 1A, 1ab -> 1AB
        const numPart = word.match(/^\d+/)?.[0] || '';
        const letterPart = word.substring(numPart.length);
        return numPart + letterPart.toUpperCase();
    }
     // Flat1a -> Flat1A, Complex2b -> Complex2B
    if (/^[a-zA-Z]+\d+[a-zA-Z]+$/.test(word) || /^[a-zA-Z]+\d+$/.test(word)) {
        let result = '';
        let prevCharIsLetter = false;
        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            if (i === 0) {
                result += char.toUpperCase();
                prevCharIsLetter = !/\d/.test(char);
            } else if (/\d/.test(char)) {
                result += char;
                prevCharIsLetter = false;
            } else { // char is a letter
                if (prevCharIsLetter) {
                    result += char.toLowerCase();
                } else { // previous char was a digit or start of word part
                    result += char.toUpperCase();
                }
                prevCharIsLetter = true;
            }
        }
        return result;
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};

const formatDisplayAddress = (fullAddressString: string | undefined, postcode: string | undefined): string => {
  if (!fullAddressString || typeof fullAddressString !== 'string') return 'Invalid Address';
  let addressPart = fullAddressString;

  // 1. Remove postcode (if present from the end, case-insensitive, flexible spacing)
  if (postcode) {
    const normalizedPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    const postcodeRegexEnd = new RegExp(`(?:\\s*,\\s*|\\s+)${normalizedPostcode.slice(0, -3)}\\s?${normalizedPostcode.slice(-3)}\\s*$`, 'gi');
    addressPart = addressPart.replace(postcodeRegexEnd, '').trim();
  }

  // 2. Remove county names (e.g. Cornwall, Devon) from the end
  const counties = ['Cornwall', 'Devon'];
  counties.forEach(county => {
    const countyRegexEnd = new RegExp(`(?:\\s*,\\s*|\\s+)\\b${county}\\b\\s*$`, 'gi');
    addressPart = addressPart.replace(countyRegexEnd, '').trim();
  });

  // 3. Remove UPRN (numeric, 10-12 digits, typically at the end)
  addressPart = addressPart.replace(/(?:\s*,\s*|\s+)\d{10,12}\s*$/, '').trim();

  // 4. Clean up string:
  addressPart = addressPart.replace(/\s+/g, ' ').trim(); // Multiple spaces to single
  addressPart = addressPart.replace(/\s*,\s*/g, ',').trim(); // Normalize space around commas
  addressPart = addressPart.replace(/^,+|,+$/g, '').trim(); // Remove leading/trailing commas
  addressPart = addressPart.replace(/,{2,}/g, ',').trim(); // Multiple commas to single

  // 5. Split into main components by the cleaned comma
  let components = addressPart.split(',')
    .map(comp => comp.trim())
    .filter(Boolean);

  components = components.map(comp => titleCase(comp));

  // 6. Limit to 4 parts and join with ', '
  return components.slice(0, 4).join(', ');
};


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
                              {formatDisplayAddress(fav.address, fav.postcode)} {/* Use updated formatter */}
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
                <Button variant="ghost" onClick={() => {
                  setAddress(null); // Clear current selection to force postcode page
                  router.push('/postcode');
                  }} className="w-full justify-start text-primary font-semibold">
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
