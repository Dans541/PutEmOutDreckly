
// Import necessary functions and types if using a testing framework like Vitest or Jest
// Example using basic console logging if no test runner is set up.

import { getAddressesByPostcode, type Address } from '@/services/cornwall-council-api';

// Helper function for Title Case, preserving commas and handling all caps (Copied from postcode/page.tsx)
const titleCase = (str: string): string => {
    if (!str) return '';
    return str
        .split(',')
        .map(part =>
            part
                .trim()
                .toLowerCase()
                .split(' ')
                .map(word => (word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
                .join(' ')
        )
        .filter(part => part.length > 0)
        .join(', ');
};

// Function to format address display (Copied from postcode/page.tsx)
const formatDisplayAddress = (fullAddressString: string | undefined, postcode: string | undefined): string => {
    if (!fullAddressString || typeof fullAddressString !== 'string') return 'Invalid Address';
    let addressPart = fullAddressString;
    if (postcode) {
        const postcodeRegexEnd = new RegExp(`\\s*,?\\s*${postcode.replace(/\s/g, '\\s?')}\\s*$`, 'i');
        addressPart = addressPart.replace(postcodeRegexEnd, '');
    }
    const counties = ['Cornwall', 'Devon'];
     counties.forEach(county => {
       const countyRegex = new RegExp(`(?:,\\s*)?\\b${county}\\b(?:,\\s*)?$`, 'gi');
       addressPart = addressPart.replace(countyRegex, '');
     });
    addressPart = addressPart.replace(/(?:,\s*)?\d{10,12}$/, '').trim();
    addressPart = addressPart.replace(/,\s*$/, '').trim();
    return titleCase(addressPart);
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
                 if (formatted.toLowerCase().includes(`, ${county}`)) {
                     console.error(`   [FAIL] UPRN ${addr.uprn}: Formatted address still contains county "${county}": "${formatted}"`);
                     success = false;
                 }
             });
             // Check for trailing comma
             if (formatted.endsWith(',')) {
                 console.error(`   [FAIL] UPRN ${addr.uprn}: Formatted address ends with a comma: "${formatted}"`);
                 success = false;
             }
        });

        // --- Specific checks based on TR10 8JT example ---
        if (postcode.toUpperCase().replace(' ', '') === 'TR108JT') {
            console.log("\n--- Specific Checks for TR10 8JT ---");
            const flat1 = addressesWithPostcode.find(a => a.uprn === '100040012454'); // Flat 1
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
            const expectedHillHead = "Hill Head, Lower Budock, Penryn"; // Assuming this is the desired format without the mill? Adjust if needed.
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
