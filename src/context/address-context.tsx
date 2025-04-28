'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type Address } from '@/services/cornwall-council-api';
// Removed useRouter import as initial redirect logic is moved

interface AddressContextType {
  selectedAddress: Address | null; // Now includes postcode
  favourites: Address[]; // Now includes postcode
  loading: boolean;
  notificationTime: number;
  notificationsEnabled: boolean;
  setAddress: (address: Address | null) => void;
  addFavourite: (address: Address) => void;
  removeFavourite: (uprn: string) => void;
  setNotificationTime: (time: number) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

// Constants for localStorage keys
const SELECTED_ADDRESS_KEY = 'putEmOut_selectedAddress_v2'; // Renamed key to avoid conflicts with old format
const FAVOURITES_KEY = 'putEmOut_favourites_v2'; // Renamed key
const NOTIFICATION_TIME_KEY = 'putEmOut_notificationTime';
const NOTIFICATIONS_ENABLED_KEY = 'putEmOut_notificationsEnabled';

// Helper function to safely parse JSON from localStorage
function safeJsonParse<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      // Add basic validation if needed (e.g., check if parsed object has expected properties)
      const parsed = JSON.parse(item);
       // Example validation for Address: check for uprn, address, postcode
      if (key === SELECTED_ADDRESS_KEY && parsed && typeof parsed.uprn === 'string' && typeof parsed.address === 'string' && typeof parsed.postcode === 'string') {
        return parsed as T;
      }
      // Example validation for Favourites: check if it's an array and items are valid Addresses
      if (key === FAVOURITES_KEY && Array.isArray(parsed)) {
         const validFavourites = parsed.filter(fav => fav && typeof fav.uprn === 'string' && typeof fav.address === 'string' && typeof fav.postcode === 'string');
         // Only return if the structure matches, otherwise default
         if (validFavourites.length === parsed.length) {
            return validFavourites as T;
         } else {
            console.warn(`Invalid items found in stored favourites for key ${key}. Resetting.`);
            localStorage.removeItem(key); // Remove invalid data
            return defaultValue;
         }
      }
      // Basic validation for number/boolean
       if (key === NOTIFICATION_TIME_KEY && typeof parsed === 'number') return parsed as T;
       if (key === NOTIFICATIONS_ENABLED_KEY && typeof parsed === 'boolean') return parsed as T;

       // If structure doesn't match expected, return default and remove invalid item
       console.warn(`Invalid data structure found in localStorage for key ${key}. Resetting.`);
       localStorage.removeItem(key);
       return defaultValue;
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error parsing localStorage key "${key}":`, error);
    localStorage.removeItem(key); // Remove potentially corrupt item
    return defaultValue;
  }
}

// Helper function to safely set JSON in localStorage
function safeJsonSet(key: string, value: unknown): void {
    try {
        if (value === null || value === undefined) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }
    } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
        // Handle potential storage full errors, etc.
        // Optionally, show a user notification
    }
}

export function AddressProvider({ children }: { children: ReactNode }) {
  const [selectedAddress, setSelectedAddressState] = useState<Address | null>(null);
  const [favourites, setFavouritesState] = useState<Address[]>([]);
  const [notificationTime, setNotificationTimeState] = useState<number>(18); // Default: 6 PM
  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  // Load initial state from localStorage safely
  useEffect(() => {
    setLoading(true);
    const initialAddress = safeJsonParse<Address | null>(SELECTED_ADDRESS_KEY, null);
    const initialFavourites = safeJsonParse<Address[]>(FAVOURITES_KEY, []);
    const initialTime = safeJsonParse<number>(NOTIFICATION_TIME_KEY, 18);
    const initialEnabled = safeJsonParse<boolean>(NOTIFICATIONS_ENABLED_KEY, true);

    setSelectedAddressState(initialAddress);
    setFavouritesState(initialFavourites);
    setNotificationTimeState(initialTime);
    setNotificationsEnabledState(initialEnabled);

    // Set defaults in storage if they were missing
    if (localStorage.getItem(NOTIFICATION_TIME_KEY) === null) {
        safeJsonSet(NOTIFICATION_TIME_KEY, 18);
    }
    if (localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) === null) {
        safeJsonSet(NOTIFICATIONS_ENABLED_KEY, true);
    }


    setLoading(false); // Finished loading
    // Initial redirect logic is now handled by SplashScreen and PostcodePage
  }, []);

  // Update localStorage whenever state changes, only after initial load
  useEffect(() => {
    if (!loading) {
      safeJsonSet(SELECTED_ADDRESS_KEY, selectedAddress);
    }
  }, [selectedAddress, loading]);

  useEffect(() => {
    if (!loading) {
       safeJsonSet(FAVOURITES_KEY, favourites);
    }
  }, [favourites, loading]);

  useEffect(() => {
    if (!loading) {
      safeJsonSet(NOTIFICATION_TIME_KEY, notificationTime);
    }
  }, [notificationTime, loading]);

   useEffect(() => {
     if (!loading) {
       safeJsonSet(NOTIFICATIONS_ENABLED_KEY, notificationsEnabled);
     }
   }, [notificationsEnabled, loading]);


  const setAddress = (address: Address | null) => {
    setSelectedAddressState(address);
    // No direct storage update here, handled by useEffect
  };

  const addFavourite = (address: Address) => {
     // Ensure address has postcode before adding
     if (!address.postcode) {
         console.error("Attempted to add favourite without a postcode:", address);
         // Optionally show a toast to the user
         return;
     }
    setFavouritesState((prev) => {
      if (prev.some(fav => fav.uprn === address.uprn)) {
        return prev; // Already favourited
      }
      const updatedFavourites = [...prev, address];
      // No direct storage update here, handled by useEffect
      return updatedFavourites;
    });
  };

  const removeFavourite = (uprn: string) => {
     let wasSelected = false;
     setFavouritesState((prev) => {
       const updatedFavourites = prev.filter(fav => fav.uprn !== uprn);
       // No direct storage update here, handled by useEffect
       return updatedFavourites;
     });

     // If the removed favourite was the currently selected address, clear selection
     setSelectedAddressState(prevSelected => {
        if (prevSelected?.uprn === uprn) {
            wasSelected = true;
            // No direct storage update here, handled by useEffect
            return null;
        }
        return prevSelected;
     });
   };


  const setNotificationTime = (time: number) => {
     if (time >= 0 && time <= 23) {
       setNotificationTimeState(time);
       // No direct storage update here, handled by useEffect
     } else {
       console.warn(`Invalid notification time set: ${time}`);
     }
   };

   const setNotificationsEnabled = (enabled: boolean) => {
     setNotificationsEnabledState(enabled);
     // No direct storage update here, handled by useEffect
   };

  return (
    <AddressContext.Provider value={{
      selectedAddress,
      favourites,
      loading,
      notificationTime,
      notificationsEnabled,
      setAddress,
      addFavourite,
      removeFavourite,
      setNotificationTime,
      setNotificationsEnabled,
     }}>
      {children}
    </AddressContext.Provider>
  );
}

export function useAddress(): AddressContextType {
  const context = useContext(AddressContext);
  if (context === undefined) {
    throw new Error('useAddress must be used within an AddressProvider');
  }
  return context;
}
