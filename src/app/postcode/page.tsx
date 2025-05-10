
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
  FormMessage,
} from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, MapPin, Check, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PostcodeIllustration } from '@/components/postcode-illustration';
import { formatDisplayAddress } from '@/lib/address-utils'; // Import centralized formatter

const postcodeSchema = z.object({
  postcode: z
    .string()
    .min(5, 'Postcode must be at least 5 characters')
    .max(8, 'Postcode cannot be more than 8 characters')
    .regex(
      /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i,
      'Invalid UK postcode format'
    )
    .transform(val => val.toUpperCase().replace(/\s+/g, '')),
});

type PostcodeFormData = z.infer<typeof postcodeSchema>;

// titleCase function is now in address-utils.ts and used by formatDisplayAddress

export default function PostcodePage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressInternal, setSelectedAddressInternal] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddressList, setShowAddressList] = useState(false);
  const [lastSearchedPostcode, setLastSearchedPostcode] = useState<string>('');
  const { setAddress, addFavourite, favourites, loading: addressLoading, selectedAddress } = useAddress();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<PostcodeFormData>({
    resolver: zodResolver(postcodeSchema),
    defaultValues: {
      postcode: '',
    },
  });

   useEffect(() => {
     const currentPath = window.location.pathname;
     if (!addressLoading && selectedAddress && currentPath !== '/postcode' && !showAddressList) {
       router.replace('/dashboard');
     }
   }, [addressLoading, selectedAddress, showAddressList, router]);


  const onSubmit: SubmitHandler<PostcodeFormData> = async (data) => {
    const searchPostcode = data.postcode;
    const normalizedPostcode = searchPostcode.toUpperCase().replace(/\s+/g, '');
    setLastSearchedPostcode(normalizedPostcode);
    setIsLoading(true);
    setShowAddressList(false);
    setSelectedAddressInternal(null);
    setAddresses([]);

    try {
      const fetchedAddressesRaw = await getAddressesByPostcode(normalizedPostcode);
      const fetchedAddresses = fetchedAddressesRaw.map(addr => ({
          ...addr,
          postcode: normalizedPostcode
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
        setShowAddressList(false);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast({
        title: 'API Error',
        description: error instanceof Error ? error.message : 'Failed to fetch addresses. Please try again later.',
        variant: 'destructive',
      });
      setShowAddressList(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSelection = () => {
     setIsSubmitting(true);
     if (selectedAddressInternal) {
        setAddress(selectedAddressInternal);
        addFavourite(selectedAddressInternal);
        setTimeout(() => {
            router.push('/dashboard');
        }, 300);
    } else {
      setIsSubmitting(false);
      toast({
        title: 'Selection Incomplete',
        description: 'Please select an address first.',
        variant: 'destructive',
      });
    }
  };

   const formatPostcodeForDisplay = (postcode: string): string => {
    if (!postcode || typeof postcode !== 'string' || postcode.length < 4) return postcode;
    const cleanedPostcode = postcode.toUpperCase().replace(/\s/g, '');
    const outward = cleanedPostcode.slice(0, -3);
    const inward = cleanedPostcode.slice(-3);
    return `${outward} ${inward}`;
   };


  return (
    <div className="flex flex-col h-full bg-background p-4 pt-8 md:pt-12">
      {!showAddressList ? (
        <div className="flex flex-col flex-grow justify-between items-center text-center animate-fade-in">
          <div className="w-full max-w-xs mx-auto">
             <PostcodeIllustration className="w-full h-auto mb-6" data-ai-hint="location map" />
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
                         <div className="relative">
                           <Input
                             id="postcode"
                             placeholder="Postcode"
                             {...field}
                             value={field.value || ''}
                             onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                             className="h-12 text-center text-lg border-2 focus:border-primary focus:ring-0"
                             aria-label="Postcode"
                             aria-describedby="postcode-error"
                             aria-invalid={!!form.formState.errors.postcode}
                             autoCapitalize="characters"
                             inputMode="text"
                             autoComplete="postal-code"
                             disabled={isLoading}
                           />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              ) : (
                                <Search className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                         </div>
                      </FormControl>
                      <FormMessage id="postcode-error" className="text-center" />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !form.formState.isValid || form.getValues('postcode').length === 0}
                  className="w-full h-12 text-lg font-semibold"
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </Button>
              </form>
            </Form>
             {!addressLoading && favourites.length > 0 && (
                <Button variant="link" onClick={() => router.push('/settings')} className="mt-4 text-sm text-primary">
                View Saved Addresses
                </Button>
             )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-grow h-full animate-fade-in">
          <div className="relative mb-4">
            <Input
                type="text"
                value={`Addresses for ${formatPostcodeForDisplay(lastSearchedPostcode)}`}
                readOnly
                className="h-11 text-sm border bg-secondary text-muted-foreground pl-4 pr-10"
                aria-label="Searched Postcode"
            />
             <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                    setShowAddressList(false);
                    setSelectedAddressInternal(null);
                    form.reset({ postcode: formatPostcodeForDisplay(lastSearchedPostcode) });
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
                aria-label="Search again"
              >
                 <Search className="h-4 w-4" />
               </Button>
          </div>

          <ScrollArea className="flex-grow mb-4 border-t border-b -mx-4 px-4">
            <div className="py-2">
              {addresses.map((addr) => (
                <button
                  key={addr.uprn}
                  className={`w-full text-left py-3 px-1 flex items-center gap-3 border-b last:border-b-0 ${
                    selectedAddressInternal?.uprn === addr.uprn ? 'font-semibold text-primary' : 'text-foreground hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedAddressInternal(addr)}
                  aria-pressed={selectedAddressInternal?.uprn === addr.uprn}
                >
                  <MapPin className={`h-5 w-5 shrink-0 ${selectedAddressInternal?.uprn === addr.uprn ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="flex-grow">{formatDisplayAddress(addr.address, addr.postcode)}</span>
                  {selectedAddressInternal?.uprn === addr.uprn && (
                    <span className="text-primary text-sm ml-auto mr-1 flex items-center gap-1">
                      <Check className="h-4 w-4" /> Selected
                    </span>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>

          <div className="mt-auto mb-4">
             <Button
               onClick={handleConfirmSelection}
               disabled={!selectedAddressInternal || isSubmitting}
               className="w-full h-12 text-lg font-semibold"
             >
               {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Selection'}
             </Button>
           </div>
        </div>
      )}
    </div>
  );
}
