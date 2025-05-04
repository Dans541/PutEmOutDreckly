

// Import necessary functions and types if using a testing framework like Vitest or Jest
// Example using basic console logging if no test runner is set up.

import { getAddressesByPostcode, type Address } from '@/services/cornwall-council-api';

// Function to format address display (Updated implementation as requested)
const formatDisplayAddress = (fullAddressString: string | undefined, postcode: string | undefined): string => {
  if (!fullAddressString || typeof fullAddressString !== 'string') return 'Invalid Address';

  let addressPart = fullAddressString;

   // 1. Remove postcode (if present)
   if (postcode) {
     // Normalize postcode for regex (remove spaces, uppercase)
     const normalizedPostcode = postcode.replace(/\s+/g, '').toUpperCase();
     // Match postcode potentially with space, surrounded by word boundaries or start/end of string/comma
     const postcodeRegex = new RegExp(`(?:^|,|\\s)${normalizedPostcode.slice(0,-3)}\\s?${normalizedPostcode.slice(-3)}(?:$|,|\\s)`, 'gi');
     addressPart = addressPart.replace(postcodeRegex, ' ').trim(); // Replace with space to handle adjacent commas
   }


   // 2. Remove county names (e.g. Cornwall, Devon)
   const counties = ['Cornwall', 'Devon'];
   counties.forEach(county => {
     const countyRegex = new RegExp(`\\b${county}\\b`, 'gi'); // Use 'gi' for global, case-insensitive
     addressPart = addressPart.replace(countyRegex, '').trim();
   });

    // 3. Remove UPRN (assuming numeric, 10-12 digits)
    addressPart = addressPart.replace(/,\s*\d{10,12}\s*$/, '').trim(); // At the end
    addressPart = addressPart.replace(/\b\d{10,12}\b/, '').trim(); // Anywhere else


   // 4. Replace multiple spaces/commas with a single comma and space, clean up ends
   addressPart = addressPart.replace(/[\s,]+/g, ', ').trim(); // Replace separators with ', '
   addressPart = addressPart.replace(/^,\s*|,\s*$/g, '').trim(); // Remove leading/trailing commas


   // 5. Split the address into parts
   let parts = addressPart
     .split(',') // Split by comma
     .map(p => p.trim()) // Trim whitespace
     .filter(Boolean); // Remove empty parts


   // 6. Capitalise each word in each part (title case)
   const titleCase = (str: string): string => {
       if (!str) return '';
       return str.toLowerCase().split(' ').map(word => {
           if (word.length === 0) return '';
           // Handle cases like "(part Of)" -> "(Part Of)"
           if (word.startsWith('(') && word.endsWith(')')) {
               const inner = word.slice(1, -1);
               // Avoid infinite loop on empty inner content like '()'
               return inner ? `(${titleCase(inner)})` : '()';
           }
           // Handle numbers like '3' in '3 Hill Head' - keep them as numbers
           if (/^\d+$/.test(word)) {
               return word;
           }
            // Handle mixed alpha-numeric like 'Flat 1A'
           if (/^[a-zA-Z]+\d+[a-zA-Z]*$/.test(word) || /^\d+[a-zA-Z]+$/.test(word)) {
              // Basic uppercase first letter, rest lower (could be improved for specific cases)
              return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
           }
           return word.charAt(0).toUpperCase() + word.slice(1);
       }).join(' ');
   };


   parts = parts.map(titleCase);

   // 7. Optionally limit to 4 elements: Flat, House, Street, Town
   return parts.slice(0, 4).join(', ');
};


// --- Test Function ---
export async function runAddressFormattingTest(postcode: string) {
    console.log(`\n--- TESTING ADDRESS FORMATTING for ${postcode} ---`);
    let success = true;
    const normalizedPostcode = postcode.replace(/\s+/g, '').toUpperCase(); // Normalize postcode for API call

    try {
        const addressesRaw = await getAddressesByPostcode(normalizedPostcode);
        // Pass the normalized postcode (no space) to the formatter as this is what's stored/passed
        const addressesWithPostcode = addressesRaw.map(addr => ({ ...addr, postcode: normalizedPostcode }));

        console.log("\nRaw Addresses Received:");
        addressesRaw.forEach(addr => console.log(`  UPRN: ${addr.uprn}, Raw Address: "${addr.address}"`));

        console.log("\nFormatted Addresses:");
        addressesWithPostcode.forEach(addr => {
            const formatted = formatDisplayAddress(addr.address, addr.postcode);
            console.log(`  UPRN: ${addr.uprn}, Formatted: "${formatted}"`);

            // Basic Validation: Check if formatted address contains postcode or county (it shouldn't)
             if (postcode && formatted.toLowerCase().includes(normalizedPostcode.toLowerCase())) { // Check against normalized postcode
                 console.error(`   [FAIL] UPRN ${addr.uprn}: Formatted address still contains postcode: "${formatted}"`);
                 success = false;
             }
             const countiesLower = ['cornwall', 'devon']; // Add more if needed
             countiesLower.forEach(county => {
                 // Use word boundary check to avoid matching parts of names (e.g., "Devonshire")
                 const countyRegex = new RegExp(`\\b${county}\\b`, 'i');
                 if (countyRegex.test(formatted)) {
                     console.error(`   [FAIL] UPRN ${addr.uprn}: Formatted address might still contain county "${county}": "${formatted}"`);
                      success = false; // Re-enable failure check
                 }
             });
             // Check for trailing/leading comma (should be handled by the updated function)
             if (formatted.endsWith(',') || formatted.startsWith(',')) {
                 console.error(`   [FAIL] UPRN ${addr.uprn}: Formatted address has leading/trailing comma: "${formatted}"`);
                 success = false;
             }
              // Check for double commas (should be handled)
             if (formatted.includes(',,')) {
                  console.error(`   [FAIL] UPRN ${addr.uprn}: Formatted address contains double commas: "${formatted}"`);
                  success = false;
             }
             // Check for space before comma (should be handled)
             if (formatted.match(/\s,/)) {
                  console.error(`   [FAIL] UPRN ${addr.uprn}: Formatted address contains space before comma: "${formatted}"`);
                  success = false;
             }
              // Check for missing space after comma (should be handled)
             if (formatted.match(/,[^\s]/)) { // Allow comma directly followed by number (e.g. Flat 1,2 Smith Street - although unlikely)
                  console.error(`   [FAIL] UPRN ${addr.uprn}: Formatted address might be missing space after comma: "${formatted}"`);
                  success = false;
             }
              // Check length limit (max 4 parts)
             if (formatted.split(',').length > 4) {
                console.error(`   [FAIL] UPRN ${addr.uprn}: Formatted address has more than 4 parts: "${formatted}"`);
                success = false;
             }
        });

        // --- Specific checks based on TR10 8JT example ---
        if (normalizedPostcode === 'TR108JT') {
            console.log("\n--- Specific Checks for TR10 8JT ---");

            const testCases: { [uprn: string]: string } = {
              '100040012454': 'Flat 1, Lower Budock Mill, Hill Head, Penryn', // Flat 1
              '100040012457': 'Hill Head, Lower Budock, Penryn',             // Hill Head
              '100041078821': 'Flat 3, The Old Blacksmiths Shop, 3 Hill Head, Penryn', // Flat 3 (Note: Number in name)
            };

            Object.entries(testCases).forEach(([uprn, expectedOutput]) => {
               const addressData = addressesWithPostcode.find(a => a.uprn === uprn);
               if (addressData) {
                    const actualOutput = formatDisplayAddress(addressData.address, addressData.postcode);
                    console.log(`  Check UPRN ${uprn}:`);
                    console.log(`    Expected: "${expectedOutput}"`);
                    console.log(`    Actual:   "${actualOutput}"`);
                    if (actualOutput !== expectedOutput) {
                         console.error("    [FAIL] Specific check failed.");
                         success = false;
                    } else {
                         console.log("    [PASS] Specific check passed.");
                    }
               } else {
                   console.warn(`  Specific Check UPRN ${uprn}: Not found in API results.`);
                   // Mark as fail if a specific test case UPRN is missing? Optional.
                   // success = false;
               }
            });
        }

    } catch (error) {
        console.error("Error during address formatting test:", error);
        success = false;
    } finally {
        console.log(`--- Test Result: ${success ? 'PASS' : 'FAIL'} ---`);
        console.log(`--- END TESTING ADDRESS FORMATTING for ${postcode} ---`);
    }
    return success;
}

// Example of how to run the test (e.g., from a script or dev environment)
// Ensure this line is uncommented if you want the test to run when the file is loaded/imported.
// runAddressFormattingTest('TR10 8JT');
runAddressFormattingTest('TR11 2NG'); // Test another postcode
runAddressFormattingTest('PL31 2DQ'); // Test Bodmin example
runAddressFormattingTest('TR1 1XU'); // Test Truro example
runAddressFormattingTest('TR18 2GT'); // Test Penzance example
