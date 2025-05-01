

// Import necessary functions and types if using a testing framework like Vitest or Jest
// Example using basic console logging if no test runner is set up.

import { getAddressesByPostcode, type Address } from '@/services/cornwall-council-api';

// Helper function for Title Case, splitting by space (Copied from postcode/page.tsx)
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


// Function to format address display (Copied from postcode/page.tsx)
// Example Target: Flat 1, Lower Budock Mill, Hill Head, Penryn
const formatDisplayAddress = (fullAddressString: string | undefined, postcode: string | undefined): string => {
    if (!fullAddressString || typeof fullAddressString !== 'string') return 'Invalid Address';

    let addressPart = fullAddressString;

    // 1. Remove Postcode (if provided and found at the end) - More robust regex
    if (postcode) {
        // Match optional comma, optional space, postcode (with optional internal space), optional space, $END
        const postcodeRegexEnd = new RegExp(`\\s*,?\\s*${postcode.slice(0, -3)}\\s?${postcode.slice(-3)}\\s*$`, 'i');
        addressPart = addressPart.replace(postcodeRegexEnd, '').trim();
    }

     // 2. Remove common county names (case-insensitive, whole word, preceded by comma and space, at the end)
     const counties = ['Cornwall', 'Devon']; // Add more if needed
     counties.forEach(county => {
       // Match specifically ", county" or ", COUNTY" at the end
       const countyRegex = new RegExp(`,\\s*\\b${county}\\b\\s*$`, 'gi');
       addressPart = addressPart.replace(countyRegex, '').trim();
     });


    // 3. Remove UPRN if present (assuming it's numeric, 10-12 digits, preceded by comma and space, at the end)
    addressPart = addressPart.replace(/,\s*\d{10,12}\s*$/, '').trim();

    // 4. Remove any remaining trailing commas and whitespace
    addressPart = addressPart.replace(/,\s*$/, '').trim();

    // 5. Apply Title Case (using the space-based title case function)
    // Then, ensure commas are followed by a space for consistent formatting.
    return titleCase(addressPart).replace(/,(?=\S)/g, ', '); // Add space after comma if missing
};


// --- Test Function ---
export async function runAddressFormattingTest(postcode: string) {
    console.log(`\n--- TESTING ADDRESS FORMATTING for ${postcode} ---`);
    let success = true;
    try {
        const addressesRaw = await getAddressesByPostcode(postcode);
        const addressesWithPostcode = addressesRaw.map(addr => ({ ...addr, postcode }));

        console.log("\nRaw Addresses Received:");
        addressesRaw.forEach(addr => console.log(`  UPRN: ${addr.uprn}, Raw Address: "${addr.address}"`));

        console.log("\nFormatted Addresses:");
        addressesWithPostcode.forEach(addr => {
            const formatted = formatDisplayAddress(addr.address, addr.postcode);
            console.log(`  UPRN: ${addr.uprn}, Formatted: "${formatted}"`);

            // Basic Validation: Check if formatted address contains postcode or county (it shouldn't)
             if (postcode && formatted.toLowerCase().includes(postcode.toLowerCase())) {
                 console.error(`   [FAIL] UPRN ${addr.uprn}: Formatted address still contains postcode: "${formatted}"`);
                 success = false;
             }
             const countiesLower = ['cornwall', 'devon']; // Add more if needed
             countiesLower.forEach(county => {
                 // Checks for ", county" pattern, which is more likely to be the unwanted part
                 if (formatted.toLowerCase().includes(`, ${county}`)) {
                     console.error(`   [FAIL] UPRN ${addr.uprn}: Formatted address might still contain county "${county}": "${formatted}"`);
                     // Disable failure for now to avoid false positives on street names like "Cornwall Road"
                     // success = false;
                 }
             });
             // Check for trailing comma
             if (formatted.endsWith(',')) {
                 console.error(`   [FAIL] UPRN ${addr.uprn}: Formatted address ends with a comma: "${formatted}"`);
                 success = false;
             }
              // Check for double commas
             if (formatted.includes(',,')) {
                  console.error(`   [FAIL] UPRN ${addr.uprn}: Formatted address contains double commas: "${formatted}"`);
                  success = false;
             }
             // Check for space before comma
              if (formatted.match(/\s,/)) {
                  console.error(`   [FAIL] UPRN ${addr.uprn}: Formatted address contains space before comma: "${formatted}"`);
                  success = false;
             }
              // Check for missing space after comma
             if (formatted.match(/,[^\s]/) && !formatted.match(/,\d/)) { // Allow comma directly followed by number (e.g. Flat 1,2 Smith Street - although unlikely)
                  console.error(`   [FAIL] UPRN ${addr.uprn}: Formatted address might be missing space after comma: "${formatted}"`);
                  success = false;
             }
        });

        // --- Specific checks based on TR10 8JT example ---
        if (postcode.toUpperCase().replace(' ', '') === 'TR108JT') {
            console.log("\n--- Specific Checks for TR10 8JT ---");
            const flat1 = addressesWithPostcode.find(a => a.uprn === '100040012454'); // Flat 1
            // Expected output after correct TitleCase and comma spacing
            const expectedFlat1 = "Flat 1, Lower Budock Mill, Hill Head, Penryn";
            if (flat1) {
                const formattedFlat1 = formatDisplayAddress(flat1.address, flat1.postcode);
                console.log(`  Check (Flat 1):`);
                console.log(`    Expected: "${expectedFlat1}"`);
                console.log(`    Actual:   "${formattedFlat1}"`);
                if (formattedFlat1 !== expectedFlat1) {
                     console.error("    [FAIL] Specific check for Flat 1 failed.");
                     success = false;
                } else {
                     console.log("    [PASS] Specific check for Flat 1 passed.");
                }
            } else {
                console.warn("  Specific Check (Flat 1): UPRN 100040012454 not found.");
            }

            const hillHead = addressesWithPostcode.find(a => a.uprn === '100040012457'); // Hill Head
             // Updated expected based on TitleCase and comma spacing
            const expectedHillHead = "Hill Head, Lower Budock, Penryn";
             if (hillHead) {
                 const formattedHillHead = formatDisplayAddress(hillHead.address, hillHead.postcode);
                 console.log(`  Check (Hill Head):`);
                 console.log(`    Expected: "${expectedHillHead}"`);
                 console.log(`    Actual:   "${formattedHillHead}"`);
                 if (formattedHillHead !== expectedHillHead) {
                      console.error("    [FAIL] Specific check for Hill Head failed.");
                      success = false;
                 } else {
                      console.log("    [PASS] Specific check for Hill Head passed.");
                 }
             } else {
                 console.warn("  Specific Check (Hill Head): UPRN 100040012457 not found.");
             }

              const flat3 = addressesWithPostcode.find(a => a.uprn === '100041078821'); // Flat 3
             const expectedFlat3 = "Flat 3, The Old Blacksmiths Shop, 3 Hill Head, Penryn";
              if (flat3) {
                  const formattedFlat3 = formatDisplayAddress(flat3.address, flat3.postcode);
                  console.log(`  Check (Flat 3):`);
                  console.log(`    Expected: "${expectedFlat3}"`);
                  console.log(`    Actual:   "${formattedFlat3}"`);
                  if (formattedFlat3 !== expectedFlat3) {
                       console.error("    [FAIL] Specific check for Flat 3 failed.");
                       success = false;
                  } else {
                       console.log("    [PASS] Specific check for Flat 3 passed.");
                  }
              } else {
                  console.warn("  Specific Check (Flat 3): UPRN 100041078821 not found.");
              }
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
// runAddressFormattingTest('TR10 8JT');
// runAddressFormattingTest('TR11 2NG'); // Test another postcode
