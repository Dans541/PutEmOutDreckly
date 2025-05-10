
// src/lib/address-format-test.ts

import { getAddressesByPostcode } from '@/services/cornwall-council-api';
import { formatDisplayAddress } from '@/lib/address-utils'; // Import centralized formatter

// --- Test Function ---
export async function runAddressFormattingTest(postcodeToTest: string) {
    console.log(`\n--- TESTING ADDRESS FORMATTING for ${postcodeToTest} ---`);
    let success = true;
    const normalizedPostcodeForApi = postcodeToTest.replace(/\s+/g, '').toUpperCase();

    try {
        const addressesRaw = await getAddressesByPostcode(normalizedPostcodeForApi);
        const addressesWithPostcode = addressesRaw.map(addr => ({ ...addr, postcode: normalizedPostcodeForApi }));

        console.log("\nRaw Addresses Received from API:");
        addressesRaw.forEach(addr => console.log(`  UPRN: ${addr.uprn}, Raw Address: "${addr.address}"`));

        console.log("\nFormatted Addresses (and validation):");
        addressesWithPostcode.forEach(addr => {
            const formatted = formatDisplayAddress(addr.address, addr.postcode);
            console.log(`  UPRN: ${addr.uprn}, Formatted: "${formatted}"`);

            // Basic Validation
            if (addr.postcode && formatted.toLowerCase().includes(addr.postcode.replace(/\s+/g, '').toLowerCase())) {
                 console.error(`   [FAIL] UPRN ${addr.uprn}: Formatted address "${formatted}" still contains postcode "${addr.postcode}"`);
                 success = false;
            }
            const countiesLower = ['cornwall', 'devon'];
            countiesLower.forEach(county => {
                 const countyRegex = new RegExp(`\\b${county}\\b`, 'i');
                 if (countyRegex.test(formatted.toLowerCase())) {
                     console.error(`   [FAIL] UPRN ${addr.uprn}: Formatted address "${formatted}" might still contain county "${county}"`);
                     success = false;
                 }
            });
            if (formatted.endsWith(',') || formatted.startsWith(',')) {
                 console.error(`   [FAIL] UPRN ${addr.uprn}: Formatted address "${formatted}" has leading/trailing comma`);
                 success = false;
            }
            if (formatted.includes(',,')) {
                  console.error(`   [FAIL] UPRN ${addr.uprn}: Formatted address "${formatted}" contains double commas`);
                  success = false;
            }
             const formattedComponents = formatted.split(',').map(s => s.trim());

             if (formattedComponents.length > 4) {
                console.error(`   [FAIL] UPRN ${addr.uprn}: Formatted address "${formatted}" has more than 4 parts`);
                success = false;
             }
        });

        if (normalizedPostcodeForApi === 'TR108JT') {
            console.log("\n--- Specific Checks for TR10 8JT ---");
            const testCases: { [uprn: string]: { raw?: string, expected: string } } = {
              '100040012454': { raw: "FLAT 1, LOWER BUDOCK MILL, HILL HEAD, PENRYN, CORNWALL, TR10 8JT, 100040012454", expected: 'Flat 1, Lower Budock Mill, Hill Head, Penryn'},
              '100040012457': { raw: "HILL HEAD, LOWER BUDOCK, PENRYN, CORNWALL, TR10 8JT, 100040012457", expected: 'Hill Head, Lower Budock, Penryn'},
              '100041078821': { raw: "FLAT 3, THE OLD BLACKSMITHS SHOP, 3 HILL HEAD, PENRYN, CORNWALL, TR10 8JT, 100041078821", expected: 'Flat 3, The Old Blacksmiths Shop, 3 Hill Head, Penryn'},
              '100040012455' : { raw: "FLAT 2, (PART OF), LOWER BUDOCK MILL, HILL HEAD, PENRYN, CORNWALL, TR10 8JT, 100040012455", expected: "Flat 2, (Part Of), Lower Budock Mill, Hill Head"}
            };

            Object.entries(testCases).forEach(([uprn, data]) => {
               const addressData = addressesWithPostcode.find(a => a.uprn === uprn);
               const sourceAddress = addressData ? addressData.address : data.raw;
               if (!sourceAddress) {
                   console.warn(`   [WARN] UPRN ${uprn} not found in API results for specific test, and no raw data provided.`);
                   return;
               }
               const actualOutput = formatDisplayAddress(sourceAddress, normalizedPostcodeForApi);
               console.log(`  Check UPRN ${uprn} (Source: "${sourceAddress}"):`);
               console.log(`    Expected: "${data.expected}"`);
               console.log(`    Actual:   "${actualOutput}"`);
               if (actualOutput !== data.expected) {
                     console.error("    [FAIL] Specific check failed.");
                     success = false;
               } else {
                     console.log("    [PASS] Specific check passed.");
               }
            });
        }

    } catch (error) {
        console.error("Error during address formatting test:", error);
        success = false;
    } finally {
        console.log(`--- Test Result for ${postcodeToTest}: ${success ? 'PASS' : 'FAIL'} ---`);
    }
    return success;
}

// To run tests:
// Call runAddressFormattingTest with different postcodes.
// Ensure the Glitch API is running.
// (async () => {
//   await runAddressFormattingTest('TR10 8JT');
//   // await runAddressFormattingTest('TR11 2NG');
//   // await runAddressFormattingTest('PL31 2DQ');
//   // await runAddressFormattingTest('TR1 1XU');
//   // await runAddressFormattingTest('TR18 2GT');
// })();
