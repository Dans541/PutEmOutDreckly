
// src/lib/address-utils.ts

export const titleCase = (str: string): string => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => {
    if (word.length === 0) return '';
    // Preserve content within parentheses, and title case it if it's not already.
    if (word.startsWith('(') && word.endsWith(')')) {
      const inner = word.slice(1, -1);
      // Check if inner content is already title-cased or a known acronym
      if (inner === inner.toUpperCase() || inner === 'Part Of') { // Add other known acronyms if needed
        return `(${inner})`;
      }
      return inner ? `(${titleCase(inner)})` : '()';
    }
    // Handle alphanumeric like 1A, 10B, Flat1A etc.
    // Case 1: Number followed by letter(s) e.g., 1a -> 1A, 22b -> 22B
    if (/^\d+[a-zA-Z]+$/.test(word)) {
        const numPart = word.match(/^\d+/)?.[0] || '';
        const letterPart = word.substring(numPart.length);
        return numPart + letterPart.toUpperCase();
    }
    // Case 2: Word-Number-Letter or Word-Number e.g. Flat1a -> Flat1A, Block2 -> Block2
    // This needs to correctly capitalize the first letter of the word part,
    // and then the letter part if it exists after a number.
    if (/^[a-zA-Z]+\d+[a-zA-Z]*$/.test(word)) {
        let result = '';
        let i = 0;
        // Capitalize the initial letter part
        while (i < word.length && /[a-zA-Z]/.test(word[i])) {
            result += (result.length === 0) ? word[i].toUpperCase() : word[i].toLowerCase();
            i++;
        }
        // Append numbers
        while (i < word.length && /\d/.test(word[i])) {
            result += word[i];
            i++;
        }
        // Append and capitalize the final letter part (if any)
        while (i < word.length && /[a-zA-Z]/.test(word[i])) {
            result += word[i].toUpperCase();
            i++;
        }
        return result;
    }
    // Default: capitalize first letter of the word
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};

export const formatDisplayAddress = (fullAddressString: string | undefined, postcode: string | undefined): string => {
  if (!fullAddressString || typeof fullAddressString !== 'string') return 'Invalid Address';

  let addressPart = fullAddressString;

  // 1. Remove Postcode (if provided and found at the end, case-insensitive, flexible spacing)
  if (postcode) {
    const normalizedPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    // Regex to match postcode at the end of the string, possibly preceded by a comma and/or spaces
    const postcodeRegexEnd = new RegExp(`(?:\\s*,\\s*|\\s+)${normalizedPostcode.slice(0, -3)}\\s?${normalizedPostcode.slice(-3)}\\s*$`, 'gi');
    addressPart = addressPart.replace(postcodeRegexEnd, '').trim();
  }


  // 2. Remove county names (e.g. Cornwall, Devon) from the end
  const counties = ['Cornwall', 'Devon'];
  counties.forEach(county => {
    // Regex to match county at the end, preceded by a comma and/or spaces, as a whole word
    const countyRegexEnd = new RegExp(`(?:\\s*,\\s*|\\s+)\\b${county}\\b\\s*$`, 'gi');
    addressPart = addressPart.replace(countyRegexEnd, '').trim();
  });

  // 3. Remove UPRN (numeric, 10-12 digits, typically at the end, preceded by comma/space)
  addressPart = addressPart.replace(/(?:\s*,\s*|\s+)\d{10,12}\s*$/, '').trim();

  // 4. Pre-processing: Replace newlines with commas. This helps if newlines were used as delimiters.
  addressPart = addressPart.replace(/[\r\n]+/g, ',');

  // 5. Clean up string: multiple spaces to single, normalize space around commas, remove leading/trailing commas, multiple commas to single
  addressPart = addressPart.replace(/\s+/g, ' ').trim(); // multiple spaces to single
  addressPart = addressPart.replace(/\s*,\s*/g, ',').trim(); // normalize space around commas ' , ' -> ','
  addressPart = addressPart.replace(/^,+|,+$/g, '').trim(); // remove leading/trailing commas
  addressPart = addressPart.replace(/,{2,}/g, ',').trim(); // multiple commas to single ',,' -> ','


  // 6. Split into main components by the cleaned comma
  let components = addressPart.split(',')
    .map(comp => comp.trim())
    .filter(Boolean); // Filter out truly empty strings after trimming and splitting


  // 7. Apply title casing to each component
  components = components.map(comp => titleCase(comp));

  // 8. Limit to 4 elements and join with ', '
  return components.slice(0, 4).join(', ');
};
