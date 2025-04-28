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
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, Home, Trash2 } from 'lucide-react'; // Ensure Trash2 is imported
import { useToast } from '@/hooks/use-toast';

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
// Use Omit because the API returns addresses without postcode, we add it later.
type FetchedAddress = Omit<Address, 'postcode'>;


export default function PostcodePage() {
  const [addresses, setAddresses] = useState<FetchedAddress[]>([]);
   // State to hold the selected address (without postcode initially)
  const [selectedFetchedAddress, setSelectedFetchedAddress] = useState<FetchedAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

   // Redirect logic remains similar, checking context state after loading
   useEffect(() => {
     if (!addressLoading) {
       if (selectedAddress) {
         router.replace('/dashboard');
       } else if (favourites.length > 0 && window.location.pathname !== '/settings') {
         // Only redirect if not already going to settings
         // router.replace('/settings'); - Decided against auto-redirect to settings
       }
     }
   }, [addressLoading, selectedAddress, favourites, router]);


  const onSubmit: SubmitHandler<PostcodeFormData> = async (data) => {
    const searchPostcode = data.postcode; // Normalized postcode from schema transform
    setLastSearchedPostcode(searchPostcode); // Store the postcode used for this search
    setIsLoading(true);
    setShowAddressList(false);
    setSelectedFetchedAddress(null); // Reset selection
    setAddresses([]); // Clear previous results

    try {
      const fetchedAddresses = await getAddressesByPostcode(searchPostcode);

      if (fetchedAddresses.length > 0) {
        setAddresses(fetchedAddresses);
        setShowAddressList(true); // Show list immediately
        // Blur input
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
     if (selectedFetchedAddress && lastSearchedPostcode) {
        // Create the full Address object including the postcode
        const fullAddress: Address = {
            ...selectedFetchedAddress,
            postcode: lastSearchedPostcode,
        };
      setAddress(fullAddress); // Set the complete address in context
      addFavourite(fullAddress); // Favourite the complete address
      router.push('/dashboard');
    } else {
      toast({
        title: 'Selection Incomplete',
        description: 'Please select an address and ensure a postcode was searched.',
        variant: 'destructive',
      });
    }
  };


  return (
    // Use background for the container
    <div className="flex flex-col items-center justify-center p-4 h-full bg-background">
       <div className="flex items-center mb-6 text-center pt-10 animate-fade-in">
         <Trash2 className="h-9 w-9 text-primary mr-2" /> {/* Use a relevant icon */}
         <h1 className="text-2xl md:text-3xl font-bold">Put 'Em Out Dreckly</h1>
       </div>
       {/* Minimal card: no border/shadow on light, subtle border on dark */}
      <Card className="w-full max-w-md border-none shadow-none bg-transparent md:bg-card md:dark:border animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl text-center">Find Your Collections</CardTitle>
          <CardDescription className="text-center text-sm">
            Enter your Cornwall postcode below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="postcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Postcode</FormLabel> {/* Hide label visually */}
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Input
                          id="postcode"
                          placeholder="Enter postcode..." // Simpler placeholder
                          {...field}
                           // Use field.value which might be different from form.getValues if transform runs late
                          value={field.value || ''} // Controlled component
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())} // Uppercase on input
                          className="flex-grow text-base" // Ensure readable text size
                          aria-label="Postcode" // Add aria-label since visual label is hidden
                          aria-describedby="postcode-error"
                          aria-invalid={!!form.formState.errors.postcode}
                          autoCapitalize="characters"
                          inputMode="text"
                          autoComplete="postal-code"
                        />
                      </FormControl>
                      <Button type="submit" disabled={isLoading} size="icon" aria-label="Search postcode">
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <FormMessage id="postcode-error" />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          {showAddressList && addresses.length > 0 && (
             // Add animation to the address list container
            <div className="mt-5 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-base md:text-lg font-medium mb-2 flex items-center gap-2"> {/* Changed font-semibold to medium */}
                <Home className="h-4 w-4 text-muted-foreground" /> Select Your Address:
              </h3>
               {/* Lighter background for scroll area in light mode */}
              <ScrollArea className="h-52 md:h-60 w-full rounded-md border bg-white dark:bg-background">
                <div className="p-1 space-y-1">
                  {addresses.map((addr) => (
                    <Button
                      key={addr.uprn}
                       // Use primary variant for selected, ghost for others
                      variant={selectedFetchedAddress?.uprn === addr.uprn ? 'default' : 'ghost'}
                      className={`w-full text-left justify-start h-auto py-2.5 px-3 whitespace-normal text-sm leading-snug ${
                        selectedFetchedAddress?.uprn === addr.uprn
                          ? 'bg-primary/10 text-primary font-semibold' // Highlight selected
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedFetchedAddress(addr)} // Select the FetchedAddress
                      aria-pressed={selectedFetchedAddress?.uprn === addr.uprn}
                    >
                      {addr.address}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
              <Button
                onClick={handleConfirmSelection}
                disabled={!selectedFetchedAddress || isLoading}
                 // Use primary variant for confirm button
                className="w-full mt-4"
              >
                Confirm Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
       {/* Link to settings if favourites exist and none selected */}
        {!addressLoading && favourites.length > 0 && !selectedAddress && (
         <Button variant="link" onClick={() => router.push('/settings')} className="mt-5 text-sm animate-fade-in" style={{ animationDelay: '0.4s' }}>
           Go to Favourites
         </Button>
       )}
    </div>
  );
}
