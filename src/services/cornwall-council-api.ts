/**
 * @fileoverview Service functions for interacting with the Cornwall Council Bin Collection API (via Glitch proxy).
 */

// Base URL for the custom Glitch API
const API_BASE_URL = 'https://closed-titanium-baboon.glitch.me/api';


/**
 * Represents bin collection dates fetched from the API.
 * Uses null for dates that couldn't be parsed or aren't provided.
 */
export interface BinCollectionData {
  generalWaste: Date | null;
  recycling: Date | null;
  // Garden waste might not be directly provided by the new API structure,
  // The Glitch API returns 'food', 'recycling', 'rubbish'.
  // We'll map 'rubbish' to 'generalWaste'. Assume no separate garden waste for now.
  // If 'food' needs mapping, it could be added or combined.
  foodWaste: Date | null;
}

/**
 * Represents an address returned by the API.
 */
export interface Address {
  address: string;
  uprn: string;
  postcode: string;
}
/**
 * Fetches addresses for a given postcode from the Glitch API.
 * @param postcode The postcode to search for (case-insensitive).
 * @returns A promise that resolves to an array of Address objects, including the postcode.
 * @throws {Error} If the API request fails or returns an error.
 */
export async function getAddressesByPostcode(postcode: string): Promise<{ address: string; uprn: string; postcode: string; }[]> {
  const normalizedPostcode = postcode.trim();
  if (!normalizedPostcode) {
    throw new Error('Postcode cannot be empty.');
  }

  const url = `${API_BASE_URL}/addresses?postcode=${encodeURIComponent(normalizedPostcode)}`;
  console.log(`Fetching addresses from: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      console.error('API Error Response:', errorData);
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData?.error || 'Unknown error'}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.addresses)) {
      console.warn('API response did not contain an addresses array:', data);
      throw new Error('API response did not contain an addresses array');
    }
    
    console.log('Successfully fetched addresses:', data.addresses);
   
    return data.addresses.map((addressData: { address: string, uprn: string }) => { return { ...addressData, postcode: normalizedPostcode }; });
      

  } catch (error) {
    console.error('Error fetching addresses from Glitch API:', error);
    // Re-throw the error to be caught by the calling component
    if (error instanceof Error) {
        throw new Error(`Failed to fetch addresses: ${error.message}`);
    } else {
        throw new Error('An unknown error occurred while fetching addresses.');
    }
  }
}

/**
 * Parses an ISO date string (YYYY-MM-DD) from the API into a Date object.
 * Returns null if the input is invalid or represents an 'Unknown' date.
 * @param isoDateString The date string from the API.
 * @returns A Date object or null.
 */
function parseIsoDate(isoDateString: string | undefined | null): Date | null {
  if (!isoDateString || typeof isoDateString !== 'string' || isoDateString.toLowerCase() === 'unknown') {
    return null;
  }
  try {
    // Dates from the API are YYYY-MM-DD. Add time to avoid timezone issues.
    const date = new Date(`${isoDateString}T00:00:00`);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string received: ${isoDateString}`);
      return null;
    }
    return date;
  } catch (error) {
    console.error(`Error parsing date string "${isoDateString}":`, error);
    return null;
  }
}


/**
 * Fetches bin collection dates for a given address UPRN and postcode from the Glitch API.
 * @param uprn The UPRN of the address.
 * @param postcode The postcode of the address.
 * @returns A promise that resolves to a BinCollectionData object.
 * @throws {Error} If the API request fails or returns an error.
 */
export async function getBinCollectionData(uprn: string, postcode: string): Promise<BinCollectionData> {
   if (!uprn || !postcode) {
     throw new Error('UPRN and postcode are required.');
   }

   const url = `${API_BASE_URL}/collections?uprn=${encodeURIComponent(uprn)}&postcode=${encodeURIComponent(postcode)}`;
   console.log(`Fetching collection data from: ${url}`);

   try {
     const response = await fetch(url, {
       headers: {
         'Accept': 'application/json',
       },
        timeout: 15000, // Add timeout as per backend code
     });

     if (!response.ok) {
       const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
       console.error('API Error Response:', errorData);
       throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData?.error || 'Unknown error'}`);
     }

     const data = await response.json();

     console.log('Successfully fetched collection data:', data);

     // Map API response fields to BinCollectionData interface
     // API provides: food, recycling, rubbish (each with an 'iso' field)
     const binData: BinCollectionData = {
       generalWaste: parseIsoDate(data?.rubbish?.iso),
       recycling: parseIsoDate(data?.recycling?.iso),
       foodWaste: parseIsoDate(data?.food?.iso),
       // Garden waste is not provided by this API endpoint
     };

     console.log("Parsed bin data:", binData);
     return binData;

   } catch (error) {
     console.error('Error fetching collection data from Glitch API:', error);
      // Re-throw the error
      if (error instanceof Error) {
          throw new Error(`Failed to fetch collection data: ${error.message}`);
      } else {
          throw new Error('An unknown error occurred while fetching collection data.');
      }
   }
}
