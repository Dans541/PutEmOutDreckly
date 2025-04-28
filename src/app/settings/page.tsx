'use client';

import { useState, useEffect } from 'react';
import { useAddress } from '@/context/address-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Star, BellRing } from 'lucide-react';
import { Header } from '@/components/header';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { type Address } from '@/services/cornwall-council-api';

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
  } = useAddress();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true); // Ensure component only renders client-side where localStorage is available
  }, []);

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
    });
  };

  const handleNotificationToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
     toast({
       title: `Notifications ${enabled ? 'Enabled' : 'Disabled'}`,
       description: enabled ? `You will be reminded at ${notificationTime}:00 the day before.` : 'You will no longer receive bin reminders.',
     });
  };

 const handleTimeChange = (time: string) => {
   setNotificationTime(parseInt(time, 10));
   if (notificationsEnabled) {
     toast({
       title: 'Reminder Time Updated',
       description: `You will now be reminded at ${time}:00.`,
     });
   }
 };


  const availableTimes = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM (21:00)

  if (!isClient) {
    return null; // Or a loading state
  }

  return (
    <div className="flex flex-col h-full bg-secondary dark:bg-secondary/50">
      <Header showBackButton={true} backDestination="/dashboard" />
      <div className="flex-grow p-4 md:p-6 space-y-6">
        <h1 className="text-3xl font-bold text-center">Settings</h1>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-400"/> Favourite Addresses</CardTitle>
            <CardDescription>Manage your saved addresses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {favourites.length === 0 ? (
              <p className="text-muted-foreground text-sm">No favourite addresses saved yet.</p>
            ) : (
              favourites.map((fav) => (
                <div key={fav.uprn} className="flex items-center justify-between p-2 rounded-md border hover:bg-muted/50">
                  <span
                     className={`flex-grow mr-2 cursor-pointer ${selectedAddress?.uprn === fav.uprn ? 'font-semibold text-primary' : ''}`}
                     onClick={() => handleSelectFavourite(fav)}
                     role="button"
                     tabIndex={0}
                     onKeyDown={(e) => e.key === 'Enter' && handleSelectFavourite(fav)}
                     aria-label={`Select address: ${fav.address}`}
                   >
                    {fav.address}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteFavourite(fav.uprn)}
                    aria-label={`Remove ${fav.address} from favourites`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
             <Button variant="outline" onClick={() => router.push('/postcode')} className="w-full mt-4">
               Add New Address
             </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BellRing className="h-5 w-5 text-accent"/> Notifications</CardTitle>
            <CardDescription>Set reminders for your bin collections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications-enabled" className="text-base">
                Enable Reminders
              </Label>
              <Switch
                id="notifications-enabled"
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
                aria-label="Toggle bin collection reminders"
              />
            </div>
            {notificationsEnabled && (
              <div className="space-y-2">
                <Label htmlFor="notification-time">Reminder Time (Day Before)</Label>
                <Select
                  value={String(notificationTime)}
                  onValueChange={handleTimeChange}
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
                <p className="text-sm text-muted-foreground">
                  You will receive a notification at this time the day before your collection.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
