
// src/lib/address-utils.ts

export const titleCase = (str: string): string => {
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

export const formatDisplayAddress = (fullAddressString: string | undefined, postcode: string | undefined): string => {
  if (!fullAddressString || typeof fullAddressString !== 'string') return 'Invalid Address';

  let addressPart = fullAddressString;

  // 1. Remove postcode (if present from the end, case-insensitive, flexible spacing)
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


  // 4. Clean up string: multiple spaces to single, normalize space around commas, remove leading/trailing commas, multiple commas to single
  addressPart = addressPart.replace(/\s+/g, ' ').trim();
  addressPart = addressPart.replace(/\s*,\s*/g, ',').trim();
  addressPart = addressPart.replace(/^,+|,+$/g, '').trim();
  addressPart = addressPart.replace(/,{2,}/g, ',').trim();


  // 5. Split into main components by the cleaned comma
  let components = addressPart.split(',')
    .map(comp => comp.trim())
    .filter(Boolean); // Filter out truly empty strings after trimming and splitting


  // 6. Apply title casing to each component
  components = components.map(comp => titleCase(comp));

  // 7. Limit to 4 elements and join with ', '
  return components.slice(0, 4).join(', ');
};
