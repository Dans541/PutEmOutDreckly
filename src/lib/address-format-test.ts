

// Import necessary functions and types if using a testing framework like Vitest or Jest
// Example using basic console logging if no test runner is set up.

import { getAddressesByPostcode, type Address } from '@/services/cornwall-council-api';

// Function to format address display (Updated implementation as requested)
const titleCase = (str: string): string => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => {
    if (word.length === 0) return '';
    if (word.startsWith('(') && word.endsWith(')')) {
      const inner = word.slice(1, -1);
      return inner ? `(${titleCase(inner)})` : '()';
    }
    if (/^\d+$/.test(word)) return word; // 3 -> 3

    if (/^\d+[a-zA-Z]+$/.test(word)) { // 1a -> 1A, 1ab -> 1AB
        const numPart = word.match(/^\d+/)?.[0] || '';
        const letterPart = word.substring(numPart.length);
        return numPart + letterPart.toUpperCase();
    }
    // Flat1a -> Flat1A, Complex2b -> Complex2B
    if (/^[a-zA-Z]+\d+[a-zA-Z]+$/.test(word) || /^[a-zA-Z]+\d+$/.test(word)) {
        let result = '';
        let prevCharIsLetter = false;
        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            if (i === 0) {
                result += char.toUpperCase();
                prevCharIsLetter = !/\d/.test(char);
            } else if (/\d/.test(char)) {
                result += char;
                prevCharIsLetter = false;
            } else { // char is a letter
                if (prevCharIsLetter) {
                    result += char.toLowerCase();
                } else { // previous char was a digit or start of word part
                    result += char.toUpperCase();
                }
                prevCharIsLetter = true;
            }
        }
        return result;
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};

const formatDisplayAddress = (fullAddressString: string | undefined, postcode: string | undefined): string => {
  if (!fullAddressString || typeof fullAddressString !== 'string') return 'Invalid Address';
  let addressPart = fullAddressString;

  // 1. Remove postcode (if present from the end, case-insensitive, flexible spacing)
  if (postcode) {
    const normalizedPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    const postcodeRegexEnd = new RegExp(`(?:\\s*,\\s*|\\s+)${normalizedPostcode.slice(0, -3)}\\s?${normalizedPostcode.slice(-3)}\\s*$`, 'gi');
    addressPart = addressPart.replace(postcodeRegexEnd, '').trim();
  }

  // 2. Remove county names (e.g. Cornwall, Devon) from the end
  const counties = ['Cornwall', 'Devon'];
  counties.forEach(county => {
    const countyRegexEnd = new RegExp(`(?:\\s*,\\s*|\\s+)\\b${county}\\b\\s*$`, 'gi');
    addressPart = addressPart.replace(countyRegexEnd, '').trim();
  });

  // 3. Remove UPRN (numeric, 10-12 digits, typically at the end)
  addressPart = addressPart.replace(/(?:\s*,\s*|\s+)\d{10,12}\s*$/, '').trim();

  // 4. Clean up string:
  addressPart = addressPart.replace(/\s+/g, ' ').trim(); // Multiple spaces to single
  addressPart = addressPart.replace(/\s*,\s*/g, ',').trim(); // Normalize space around commas
  addressPart = addressPart.replace(/^,+|,+$/g, '').trim(); // Remove leading/trailing commas
  addressPart = addressPart.replace(/,{2,}/g, ',').trim(); // Multiple commas to single

  // 5. Split into main components by the cleaned comma
  let components = addressPart.split(',')
    .map(comp => comp.trim())
    .filter(Boolean);

  components = components.map(comp => titleCase(comp));

  // 6. Limit to 4 parts and join with ', '
  return components.slice(0, 4).join(', ');
};


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
             // Check for words being split by commas (e.g. "Word1, Word2" instead of "Word1 Word2")
             // This is harder to check generically, but we can look for single words between commas if the original component was multi-word
             const originalComponents = addr.address.split(',').map(s => s.trim());
             const formattedComponents = formatted.split(',').map(s => s.trim());

             if (formattedComponents.some(fc => fc.length > 0 && !fc.includes(' ') && originalComponents.some(oc => oc.toLowerCase().includes(fc.toLowerCase()) && oc.includes(' ') ))) {
                // This is a heuristic: if a formatted component is a single word,
                // and that word was part of a multi-word original component, it might be an error.
                // However, this can have false positives if a component is legitimately a single word.
                // console.warn(`   [WARN] UPRN ${addr.uprn}: Formatted address "${formatted}" might have incorrectly split words with commas.`);
             }


             if (formatted.split(',').length > 4) {
                console.error(`   [FAIL] UPRN ${addr.uprn}: Formatted address "${formatted}" has more than 4 parts`);
                success = false;
             }
        });

        // --- Specific checks for TR10 8JT ---
        if (normalizedPostcodeForApi === 'TR108JT') {
            console.log("\n--- Specific Checks for TR10 8JT ---");
            const testCases: { [uprn: string]: { raw: string, expected: string } } = {
              '100040012454': { raw: "FLAT 1, LOWER BUDOCK MILL, HILL HEAD, PENRYN, CORNWALL, TR10 8JT, 100040012454", expected: 'Flat 1, Lower Budock Mill, Hill Head, Penryn'},
              '100040012457': { raw: "HILL HEAD, LOWER BUDOCK, PENRYN, CORNWALL, TR10 8JT, 100040012457", expected: 'Hill Head, Lower Budock, Penryn'}, // Max 3 parts if source has 3
              '100041078821': { raw: "FLAT 3, THE OLD BLACKSMITHS SHOP, 3 HILL HEAD, PENRYN, CORNWALL, TR10 8JT, 100041078821", expected: 'Flat 3, The Old Blacksmiths Shop, 3 Hill Head, Penryn'},
              // Add a case that might have more than 4 significant parts before cleaning
              '100040012455' : { raw: "FLAT 2, (PART OF), LOWER BUDOCK MILL, HILL HEAD, PENRYN, CORNWALL, TR10 8JT, 100040012455", expected: "Flat 2, (Part Of), Lower Budock Mill, Hill Head"}
            };

            Object.entries(testCases).forEach(([uprn, data]) => {
               const addressData = addressesWithPostcode.find(a => a.uprn === uprn);
               const sourceAddress = addressData ? addressData.address : data.raw; // Use test raw if API didn't find it for some reason
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
//   await runAddressFormattingTest('TR11 2NG');
//   await runAddressFormattingTest('PL31 2DQ');
//   await runAddressFormattingTest('TR1 1XU');
//   await runAddressFormattingTest('TR18 2GT');
// })();
