
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import {
  getAddressesByPostcode,
  type Address,
} from '@/services/cornwall-council-api';
import { useAddress } from '@/context/address-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage, // Removed FormLabel
} from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, MapPin, Check, Trash2 } from 'lucide-react'; // Import Trash2
import { useToast } from '@/hooks/use-toast';
import { PostcodeIllustration } from '@/components/postcode-illustration'; // Import the illustration

// Adjusted regex for better flexibility with spacing
const postcodeSchema = z.object({
  postcode: z
    .string()
    .min(5, 'Postcode must be at least 5 characters')
    .max(8, 'Postcode cannot be more than 8 characters')
    .regex(
      /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i, // Allow optional space
      'Invalid UK postcode format'
    )
    .transform(val => val.toUpperCase().replace(/\s+/g, '')), // Normalize before validation/use
});

type PostcodeFormData = z.infer<typeof postcodeSchema>;

// Helper function for Title Case, splitting by space
const titleCase = (str: string): string => {
    if (!str) return '';
    // Convert to lower case first to handle ALL CAPS input
    // Split by space, title case each word, rejoin with space
    return str.toLowerCase().split(' ').map(word => {
        if (word.length === 0) return '';
        // Handle cases like "(part Of)" -> "(Part Of)"
        if (word.startsWith('(') && word.endsWith(')')) {
            const inner = word.slice(1, -1);
            return `(${titleCase(inner)})`; // Recursively title case inner part
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
};


// Function to format address display based on the required format
// Updated with user-provided code (2024-07-26)
const formatDisplayAddress = (fullAddressString: string | undefined, postcode: string | undefined): string => {
    if (!fullAddressString || typeof fullAddressString !== 'string') return 'Invalid Address';

    let addressPart = fullAddressString;

    // 1. Remove Postcode (if provided and found at the end)
    if (postcode) {
        // Make regex more robust for postcodes like 'TR108JT' or 'TR10 8JT'
        const pcOut = postcode.slice(0, -3);
        const pcIn = postcode.slice(-3);
        const postcodeRegexEnd = new RegExp(`\\s*,?\\s*${pcOut}\\s?${pcIn}\\s*$`, 'i');
        addressPart = addressPart.replace(postcodeRegexEnd, '').trim();
    }

    // 2. Remove common county names (case-insensitive, whole word, preceded by comma and space, at the end)
    const counties = ['Cornwall', 'Devon']; // Add more if needed
    counties.forEach(county => {
        const countyRegex = new RegExp(`,\\s*\\b${county}\\b\\s*$`, 'gi');
        addressPart = addressPart.replace(countyRegex, '').trim();
    });

    // 3. Remove UPRN if present (assuming it's numeric, 10-12 digits, preceded by comma and space, at the end)
    // The API response should already not have UPRN in the 'address' string itself, but this is a safeguard.
    addressPart = addressPart.replace(/,\s*\d{10,12}\s*$/, '').trim();

    // 4. Remove any remaining trailing commas and whitespace
    addressPart = addressPart.replace(/,\s*$/, '').trim();

    // 5. Split into parts by comma, trim each part, and filter out empty parts.
    let parts = addressPart.split(',')
        .map(p => p.trim()) // Trim whitespace from each part
        .filter(Boolean); // Remove empty strings

    // 6. Limit to the first N relevant parts if needed (e.g., to avoid excessively long strings)
    // Let's keep it reasonably long for now, e.g., 5 parts max. Adjust if needed.
    // parts = parts.slice(0, 5);

    // 7. Apply Title Case to each part
    parts = parts.map(titleCase);

    // 8. Rejoin the parts with a comma and a space.
    return parts.join(', ');
};



export default function PostcodePage() {
  const [addresses, setAddresses] = useState<Address[]>([]); // Store full Address object including postcode
  const [selectedAddressInternal, setSelectedAddressInternal] = useState<Address | null>(null); // Renamed state variable
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // For confirm button loading
  const [showAddressList, setShowAddressList] = useState(false);
  const [lastSearchedPostcode, setLastSearchedPostcode] = useState<string>(''); // Store the searched postcode
  const { setAddress, addFavourite, favourites, loading: addressLoading, selectedAddress } = useAddress();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<PostcodeFormData>({
    resolver: zodResolver(postcodeSchema),
    defaultValues: {
      postcode: '',
    },
  });

   // Effect to check if navigation should happen (e.g., user manually navigated here)
   useEffect(() => {
     // Don't interfere if address context is still loading
     if (addressLoading) return;

     // If user lands here, has a selected address, and IS NOT coming back
     // from settings (which we infer by checking showAddressList state), redirect to dashboard.
     // This prevents redirect loops when clicking "Add New Address" from settings.
     // --- MODIFICATION: Prevent redirect if showAddressList is true ---
     if (selectedAddress && !showAddressList) {
       console.log("PostcodePage: Selected address exists and not currently showing list, redirecting to dashboard.");
       // Use replace to avoid adding postcode page to history unnecessarily
       router.replace('/dashboard');
     }
     // --- END MODIFICATION ---

     // If no selected address, but favourites exist, stay here.
     // If no selected address and no favourites, stay here.

     // The SplashScreen handles the initial routing logic based on stored context.
   }, [addressLoading, selectedAddress, router, showAddressList]); // Added showAddressList dependency

  const onSubmit: SubmitHandler<PostcodeFormData> = async (data) => {
    const searchPostcode = data.postcode;
    setLastSearchedPostcode(searchPostcode); // Store the postcode used for the search
    setIsLoading(true);
    setShowAddressList(false);
    setSelectedAddressInternal(null);
    setAddresses([]);

    try {
      // Fetch addresses - API returns { address: string, uprn: string }[]
      const fetchedAddressesRaw = await getAddressesByPostcode(searchPostcode);

      // Add the searched postcode back to each address object
      const fetchedAddresses = fetchedAddressesRaw.map(addr => ({
          ...addr,
          postcode: searchPostcode // Add the postcode here
      }));


      if (fetchedAddresses.length > 0) {
        setAddresses(fetchedAddresses);
        setShowAddressList(true);
        const postcodeField = document.getElementById('postcode');
        if (postcodeField instanceof HTMLInputElement) {
           postcodeField.blur();
        }
      } else {
        toast({
          title: 'No Addresses Found',
          description: `No addresses found for postcode ${searchPostcode}. Please check and try again.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast({
        title: 'API Error',
        description: error instanceof Error ? error.message : 'Failed to fetch addresses. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSelection = () => {
     setIsSubmitting(true); // Indicate loading on confirm button
     if (selectedAddressInternal) { // Use the renamed state variable
        // The selectedAddressInternal already includes the postcode from the mapping above
        setAddress(selectedAddressInternal);
        addFavourite(selectedAddressInternal);
        // Delay slightly to show loading feedback
        setTimeout(() => {
            router.push('/dashboard');
            // No need to setIsSubmitting(false) as we navigate away
        }, 300);
    } else {
      setIsSubmitting(false); // Stop loading if selection is invalid
      toast({
        title: 'Selection Incomplete',
        description: 'Please select an address first.',
        variant: 'destructive',
      });
    }
  };


  return (
    <div className="flex flex-col h-full bg-background p-4 pt-8 md:pt-12">
      {!showAddressList ? (
        // Initial Postcode Entry View
        <div className="flex flex-col flex-grow justify-between items-center text-center animate-fade-in">
          <div className="w-full max-w-xs mx-auto">
             <PostcodeIllustration className="w-full h-auto mb-6" />
             <h1 className="text-2xl font-semibold mb-2">Where are you?</h1>
             <p className="text-muted-foreground text-sm mb-8">
               Enter your postcode so we can find your collection schedule.
             </p>
           </div>

          <div className="w-full max-w-md mb-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="postcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                         {/* Input styled like BinDays */}
                         <div className="relative">
                           <Input
                             id="postcode"
                             placeholder="Postcode"
                             {...field}
                             value={field.value || ''}
                             onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                             className="h-12 text-center text-lg border-2 focus:border-primary focus:ring-0" // Adjusted styling
                             aria-label="Postcode"
                             aria-describedby="postcode-error"
                             aria-invalid={!!form.formState.errors.postcode}
                             autoCapitalize="characters"
                             inputMode="text"
                             autoComplete="postal-code"
                             disabled={isLoading}
                           />
                            {/* Conditionally render Search or Loader inside input */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              ) : (
                                // Search icon only appears if not loading
                                <Search className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                         </div>

                      </FormControl>
                      <FormMessage id="postcode-error" className="text-center" />
                    </FormItem>
                  )}
                />
                 {/* Button styled like BinDays */}
                <Button
                  type="submit"
                  disabled={isLoading || !form.formState.isValid || form.getValues('postcode').length === 0}
                  className="w-full h-12 text-lg font-semibold rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </Button>
              </form>
            </Form>
             {/* Link to favourites/settings if available */}
             {!addressLoading && favourites.length > 0 && (
                <Button variant="link" onClick={() => router.push('/settings')} className="mt-4 text-sm text-primary">
                View Saved Addresses
                </Button>
             )}
          </div>
        </div>
      ) : (
        // Address Selection View
        <div className="flex flex-col flex-grow h-full animate-fade-in">
           {/* Search Bar imitation */}
          <div className="relative mb-4">
            <Input
                type="text"
                value={`Addresses for ${lastSearchedPostcode}`} // Display searched postcode
                readOnly
                className="h-11 text-sm border bg-secondary text-muted-foreground pl-4 pr-10" // Style like a search bar
                aria-label="Searched Postcode"
            />
             <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                    setShowAddressList(false); // Go back to postcode input
                    setSelectedAddressInternal(null); // Clear selection when going back
                    form.reset({ postcode: lastSearchedPostcode }); // Reset form with last postcode
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
                aria-label="Search again"
              >
                 <Search className="h-4 w-4" /> {/* Or use a Back/Edit icon */}
               </Button>
          </div>


          <ScrollArea className="flex-grow mb-4 border-t border-b -mx-4 px-4"> {/* Make scroll area take space */}
            <div className="py-2">
              {addresses.map((addr) => (
                <button
                  key={addr.uprn}
                  className={`w-full text-left py-3 px-1 flex items-center gap-3 border-b last:border-b-0 ${
                    selectedAddressInternal?.uprn === addr.uprn ? 'font-semibold text-primary' : 'text-foreground hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedAddressInternal(addr)} // Use renamed state setter
                  aria-pressed={selectedAddressInternal?.uprn === addr.uprn}
                >
                   {/* Icon changes color based on selection */}
                  <MapPin className={`h-5 w-5 shrink-0 ${selectedAddressInternal?.uprn === addr.uprn ? 'text-primary' : 'text-muted-foreground'}`} />
                  {/* Display formatted address */}
                  <span className="flex-grow">{formatDisplayAddress(addr.address, addr.postcode)}</span>
                   {/* "Selected" text aligned right */}
                  {selectedAddressInternal?.uprn === addr.uprn && (
                    <span className="text-primary text-sm ml-auto mr-1 flex items-center gap-1">
                      <Check className="h-4 w-4" /> Selected
                    </span>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>

          <div className="mt-auto mb-4"> {/* Button at the bottom */}
             <Button
               onClick={handleConfirmSelection}
               disabled={!selectedAddressInternal || isSubmitting} // Use renamed state variable
               className="w-full h-12 text-lg font-semibold rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
             >
               {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Selection'}
             </Button>
           </div>
        </div>
      )}
    </div>
  );
}
