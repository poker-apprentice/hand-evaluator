const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const B64_VALUES = (() => {
  const values = new Int8Array(128).fill(-1);
  for (let i = 0; i < B64_ALPHABET.length; i += 1) {
    values[B64_ALPHABET.charCodeAt(i)] = i;
  }
  return values;
})();

/**
 * Decodes a base64 string of little-endian 16-bit integers into an Int16Array.  Implemented
 * inline (rather than via Buffer/atob) so it works identically in any JavaScript environment.
 * @param {string} base64 The base64-encoded table data.
 * @returns {Int16Array} The decoded 16-bit integers.
 */
export const decodeBase64ToInt16 = (base64: string): Int16Array => {
  let length = base64.length;
  while (length > 0 && base64.charCodeAt(length - 1) === 61) {
    length -= 1; // strip '=' padding
  }

  const byteCount = Math.floor((length * 3) / 4);
  const bytes = new Uint8Array(byteCount);
  let byteIndex = 0;
  let buffer = 0;
  let bitCount = 0;
  for (let i = 0; i < length; i += 1) {
    const value = B64_VALUES[base64.charCodeAt(i)];
    if (value < 0) {
      throw new Error(`Invalid base64 character: ${base64[i]}`);
    }
    buffer = (buffer << 6) | value;
    bitCount += 6;
    if (bitCount >= 8) {
      bitCount -= 8;
      bytes[byteIndex] = (buffer >> bitCount) & 0xff;
      byteIndex += 1;
    }
  }

  const result = new Int16Array(byteCount >> 1);
  for (let i = 0; i < result.length; i += 1) {
    result[i] = (((bytes[i * 2 + 1] << 8) | bytes[i * 2]) << 16) >> 16;
  }
  return result;
};
