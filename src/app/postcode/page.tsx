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
import { Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';

const postcodeSchema = z.object({
  postcode: z
    .string()
    .min(5, 'Postcode must be at least 5 characters')
    .max(8, 'Postcode cannot be more than 8 characters')
    .regex(
      /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i,
      'Invalid UK postcode format'
    ),
});

type PostcodeFormData = z.infer<typeof postcodeSchema>;

export default function PostcodePage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddressList, setShowAddressList] = useState(false);
  const { setAddress, addFavourite } = useAddress();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<PostcodeFormData>({
    resolver: zodResolver(postcodeSchema),
    defaultValues: {
      postcode: '',
    },
  });

  const onSubmit: SubmitHandler<PostcodeFormData> = async (data) => {
    setIsLoading(true);
    setShowAddressList(false); // Hide list initially on new search
    setSelectedAddress(null); // Reset selection
    try {
      const fetchedAddresses = await getAddressesByPostcode(data.postcode.toUpperCase());
      if (fetchedAddresses.length > 0) {
        setAddresses(fetchedAddresses);
        setShowAddressList(true); // Show list only if addresses found
        // Blur the input field to hide keyboard
        const postcodeField = document.getElementById('postcode');
        if (postcodeField instanceof HTMLInputElement) {
           postcodeField.blur();
        }
      } else {
        toast({
          title: 'No Addresses Found',
          description: 'Please check the postcode and try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch addresses. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedAddress) {
      setAddress(selectedAddress);
      addFavourite(selectedAddress); // Favourite the address automatically
      router.push('/dashboard');
    } else {
      toast({
        title: 'No Address Selected',
        description: 'Please select an address from the list.',
        variant: 'destructive',
      });
    }
  };

  // Hide address list when input is focused again
  useEffect(() => {
    const postcodeField = document.getElementById('postcode');
    const handleFocus = () => {
        if (showAddressList) {
            setShowAddressList(false);
        }
    };
    if (postcodeField) {
        postcodeField.addEventListener('focus', handleFocus);
    }
    return () => {
        if (postcodeField) {
            postcodeField.removeEventListener('focus', handleFocus);
        }
    };
  }, [showAddressList]);


  return (
    <div className="flex flex-col items-center justify-center p-4 pt-0 h-full bg-secondary dark:bg-secondary/50">
      <Header showBackButton={false} />
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Find Your Address</CardTitle>
          <CardDescription className="text-center">
            Enter your postcode to find your bin collection schedule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="postcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postcode</FormLabel>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Input
                          id="postcode"
                          placeholder="e.g., TR1 1AA"
                          {...field}
                          className="flex-grow"
                          aria-describedby="postcode-error"
                          aria-invalid={!!form.formState.errors.postcode}
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
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Select Your Address:</h3>
              <ScrollArea className="h-60 w-full rounded-md border">
                <div className="p-4 space-y-2">
                  {addresses.map((addr) => (
                    <Button
                      key={addr.uprn}
                      variant={selectedAddress?.uprn === addr.uprn ? 'default' : 'outline'}
                      className={`w-full text-left justify-start h-auto py-2 whitespace-normal ${selectedAddress?.uprn === addr.uprn ? 'bg-primary text-primary-foreground' : ''}`}
                      onClick={() => setSelectedAddress(addr)}
                      aria-pressed={selectedAddress?.uprn === addr.uprn}
                    >
                      {addr.address}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
              <Button
                onClick={handleConfirmSelection}
                disabled={!selectedAddress || isLoading}
                className="w-full mt-4 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Confirm Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
