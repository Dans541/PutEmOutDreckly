/**
 * Represents an address.
 */
export interface Address {
  /**
   * The unique ID of the address.
   */
  uprn: string;
  /**
   * The full address string.
   */
  address: string;
}

/**
 * Represents bin collection dates.
 */
export interface BinCollectionData {
  /**
   * Date for general waste bin collection.
   */
  generalWaste: Date | null; // Allow null if API might not return it
  /**
   * Date for recycling bin collection.
   */
  recycling: Date | null; // Allow null
  /**
   * Date for garden waste bin collection. Can be null if not applicable.
   */
  gardenWaste: Date | null;
}

/**
 * Simulates fetching addresses for a given postcode from an API.
 * In a real app, this would make an HTTP request.
 * @param postcode The postcode to search for (case-insensitive).
 * @returns A promise that resolves to an array of Address objects.
 */
export async function getAddressesByPostcode(postcode: string): Promise<Address[]> {
  console.log(`Simulating API call for postcode: ${postcode}`);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Basic validation simulation
  const normalizedPostcode = postcode.toUpperCase().replace(/\s+/g, '');
  if (!/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i.test(normalizedPostcode)) {
      console.warn("Invalid postcode format provided to mock API");
      return []; // Return empty for invalid format
  }


  // Mock data - replace with actual API call
  const mockData: { [key: string]: Address[] } = {
    'TR11AA': [
      { uprn: '10001234567', address: '1, Example Street, Town, TR1 1AA' },
      { uprn: '10001234568', address: 'Flat 2, Example House, Town, TR1 1AA' },
      { uprn: '10001234569', address: '3 Example Street, Town, TR1 1AA' },
    ],
    'PL40AA': [
      { uprn: '20009876543', address: '10 Downing Street, Plymouth, PL4 0AA' },
      { uprn: '20009876544', address: 'The Barbican Flat 1, Plymouth, PL4 0AA' },
    ],
    'SW1A0AA': [], // Example of postcode with no results
  };

  return mockData[normalizedPostcode] || [];
}

/**
 * Simulates fetching bin collection dates for a given address UPRN.
 * In a real app, this would make an HTTP request.
 * @param uprn The UPRN of the address.
 * @returns A promise that resolves to a BinCollectionData object.
 */
export async function getBinCollectionData(uprn: string): Promise<BinCollectionData> {
  console.log(`Simulating API call for UPRN: ${uprn}`);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 700));

  // Mock data based on UPRN - replace with actual API call
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  const getNextDayOfWeek = (dayOfWeek: number): Date => { // 0=Sun, 1=Mon, ..., 6=Sat
      const resultDate = new Date(today.getTime());
      resultDate.setDate(today.getDate() + (dayOfWeek + 7 - today.getDay()) % 7);
      if (resultDate <= today) { // If it's today or past, get next week's day
          resultDate.setDate(resultDate.getDate() + 7);
      }
      return resultDate;
  };


  let data: BinCollectionData;

  // Simple mock logic based on UPRN ending digit
  const lastDigit = parseInt(uprn.slice(-1), 10);

  if (isNaN(lastDigit)) {
     // Default fallback if UPRN doesn't end in a digit
     data = {
        generalWaste: getNextDayOfWeek(2), // Tuesday
        recycling: getNextDayOfWeek(5), // Friday
        gardenWaste: null,
     }
  } else if (lastDigit % 3 === 0) {
     data = {
       generalWaste: getNextDayOfWeek(1), // Monday
       recycling: getNextDayOfWeek(1), // Monday (same day)
       gardenWaste: getNextDayOfWeek(4), // Thursday
     };
   } else if (lastDigit % 3 === 1) {
     data = {
       generalWaste: getNextDayOfWeek(3), // Wednesday
       recycling: getNextDayOfWeek(6), // Saturday
       gardenWaste: null, // No garden waste for this mock group
     };
   } else {
     data = {
       generalWaste: getNextDayOfWeek(5), // Friday
       recycling: getNextDayOfWeek(2), // Tuesday
       gardenWaste: getNextDayOfWeek(5), // Friday (same day as general)
     };
   }

   console.log("Returning mock bin data:", data);
   return data;
}
