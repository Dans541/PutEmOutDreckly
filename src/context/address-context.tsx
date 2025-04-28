'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type Address } from '@/services/cornwall-council-api';
import { useRouter } from 'next/navigation'; // Import useRouter

interface AddressContextType {
  selectedAddress: Address | null;
  favourites: Address[];
  loading: boolean; // Indicates if loading from localStorage
  notificationTime: number; // Hour (0-23)
  notificationsEnabled: boolean;
  setAddress: (address: Address | null) => void;
  addFavourite: (address: Address) => void;
  removeFavourite: (uprn: string) => void;
  setNotificationTime: (time: number) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

const SELECTED_ADDRESS_KEY = 'selectedAddress';
const FAVOURITES_KEY = 'favourites';
const NOTIFICATION_TIME_KEY = 'notificationTime';
const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled';

export function AddressProvider({ children }: { children: ReactNode }) {
  const [selectedAddress, setSelectedAddressState] = useState<Address | null>(null);
  const [favourites, setFavouritesState] = useState<Address[]>([]);
  const [notificationTime, setNotificationTimeState] = useState<number>(18); // Default to 6 PM
  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(true); // Default to true
  const [loading, setLoading] = useState(true); // Start loading
  const router = useRouter(); // Initialize router

  // Load initial state from localStorage
  useEffect(() => {
    let initialAddress: Address | null = null;
    let initialFavourites: Address[] = [];

    try {
      const storedAddress = localStorage.getItem(SELECTED_ADDRESS_KEY);
      if (storedAddress) {
        initialAddress = JSON.parse(storedAddress);
        setSelectedAddressState(initialAddress);
      }

      const storedFavourites = localStorage.getItem(FAVOURITES_KEY);
      if (storedFavourites) {
        initialFavourites = JSON.parse(storedFavourites);
        setFavouritesState(initialFavourites);
      }

      const storedTime = localStorage.getItem(NOTIFICATION_TIME_KEY);
       if (storedTime) {
         setNotificationTimeState(parseInt(storedTime, 10));
       } else {
         setNotificationTimeState(18); // Default if not set
         localStorage.setItem(NOTIFICATION_TIME_KEY, '18');
       }

       const storedEnabled = localStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
       if (storedEnabled) {
         setNotificationsEnabledState(JSON.parse(storedEnabled));
       } else {
         setNotificationsEnabledState(true); // Default if not set
         localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, JSON.stringify(true));
       }

    } catch (error) {
      console.error("Error loading state from localStorage:", error);
      // Reset to defaults if localStorage is corrupt or unavailable
      localStorage.removeItem(SELECTED_ADDRESS_KEY);
      localStorage.removeItem(FAVOURITES_KEY);
      localStorage.setItem(NOTIFICATION_TIME_KEY, '18');
      localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, JSON.stringify(true));
      setSelectedAddressState(null);
      setFavouritesState([]);
      setNotificationTimeState(18);
      setNotificationsEnabledState(true);
      initialAddress = null; // Reset initial values too
      initialFavourites = [];
    } finally {
      setLoading(false); // Finished loading
      // --- Initial Redirect Logic ---
      // Check *after* loading is complete and state is set
      // This check needs to happen outside the main flow if possible,
      // perhaps in the SplashScreen or initial page load logic.
      // Keeping it here might cause issues if the component unmounts/remounts.
      // Moved this logic to SplashScreen and PostcodePage useEffects
      // -----------------------------
    }
  }, []); // Run only once on mount


  // Update localStorage whenever state changes
  useEffect(() => {
    if (!loading) { // Only save after initial load
      try {
        if (selectedAddress) {
          localStorage.setItem(SELECTED_ADDRESS_KEY, JSON.stringify(selectedAddress));
        } else {
          localStorage.removeItem(SELECTED_ADDRESS_KEY);
        }
      } catch (error) {
         console.error("Error saving selected address to localStorage:", error);
      }
    }
  }, [selectedAddress, loading]);

  useEffect(() => {
    if (!loading) {
       try {
           localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites));
       } catch (error) {
           console.error("Error saving favourites to localStorage:", error);
       }
    }
  }, [favourites, loading]);

  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(NOTIFICATION_TIME_KEY, String(notificationTime));
      } catch (error) {
         console.error("Error saving notification time to localStorage:", error);
      }
    }
  }, [notificationTime, loading]);

   useEffect(() => {
     if (!loading) {
       try {
         localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, JSON.stringify(notificationsEnabled));
       } catch (error) {
          console.error("Error saving notifications enabled state to localStorage:", error);
       }
     }
   }, [notificationsEnabled, loading]);


  const setAddress = (address: Address | null) => {
    setSelectedAddressState(address);
  };

  const addFavourite = (address: Address) => {
    setFavouritesState((prev) => {
      // Avoid duplicates
      if (prev.some(fav => fav.uprn === address.uprn)) {
        return prev;
      }
      const updatedFavourites = [...prev, address];
       try {
         localStorage.setItem(FAVOURITES_KEY, JSON.stringify(updatedFavourites)); // Also update storage here
       } catch (error) {
           console.error("Error saving favourites to localStorage:", error);
       }
      return updatedFavourites;
    });
  };

  const removeFavourite = (uprn: string) => {
     let wasSelected = false;
     setFavouritesState((prev) => {
       const updatedFavourites = prev.filter(fav => fav.uprn !== uprn);
        try {
          localStorage.setItem(FAVOURITES_KEY, JSON.stringify(updatedFavourites)); // Update storage
        } catch (error) {
            console.error("Error saving favourites to localStorage:", error);
        }
       return updatedFavourites;
     });

     setSelectedAddressState(prevSelected => {
        if (prevSelected?.uprn === uprn) {
            wasSelected = true;
            try {
                localStorage.removeItem(SELECTED_ADDRESS_KEY); // Remove selected from storage
            } catch (error) {
                console.error("Error removing selected address from localStorage:", error);
            }
            return null; // Clear selection
        }
        return prevSelected;
     });
   };


  const setNotificationTime = (time: number) => {
     // Basic validation
     if (time >= 0 && time <= 23) {
       setNotificationTimeState(time);
       try {
         localStorage.setItem(NOTIFICATION_TIME_KEY, String(time)); // Update storage
       } catch (error) {
          console.error("Error saving notification time to localStorage:", error);
       }
     }
   };

   const setNotificationsEnabled = (enabled: boolean) => {
     setNotificationsEnabledState(enabled);
     try {
       localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, JSON.stringify(enabled)); // Update storage
     } catch (error) {
        console.error("Error saving notifications enabled state to localStorage:", error);
     }
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

    