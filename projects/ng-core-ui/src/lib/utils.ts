/**
 * Decrypts a hex-encoded token using an AppID as the key.
 * Matches the Go implementation using AES-GCM and SHA-256 for key derivation.
 *
 * @param ciphertextHex The hex-encoded encrypted string (nonce + ciphertext + tag)
 * @param appID The AppID used as the encryption key
 * @returns The decrypted payload as a string
 */
export async function decrypt(ciphertextHex: string, appID: string): Promise<string> {
  // 1. Convert hex string to Uint8Array
  if (!ciphertextHex || ciphertextHex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(ciphertextHex)) {
    throw new Error('Invalid hex ciphertext');
  }
  const len = ciphertextHex.length;
  const encryptedData = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    encryptedData[i >> 1] = parseInt(ciphertextHex.substring(i, i + 2), 16);
  }

  // 2. Derive the 32-byte key from AppID using SHA-256
  const appIDBuffer = new TextEncoder().encode(appID);
  const keyHash = await crypto.subtle.digest('SHA-256', appIDBuffer);

  // 3. Import the hash as an AES-GCM key
  const key = await crypto.subtle.importKey(
    'raw',
    keyHash,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // 4. Extract the 12-byte nonce and the ciphertext
  const nonceSize = 12; // Standard GCM nonce size
  if (encryptedData.length < nonceSize) {
    throw new Error('Ciphertext too short');
  }

  const nonce = encryptedData.slice(0, nonceSize);
  const ciphertext = encryptedData.slice(nonceSize);
  // 5. Decrypt using AES-GCM
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: nonce
    },
    key,
    ciphertext
  );

  // 6. Decode the result to a string
  return new TextDecoder().decode(decryptedBuffer);
}

// Example usage:
// (async () => {
//     try {
//         const appID = "test-app-id";
//         const token = "460a36e6..."; // The hex string from /api/token
//         const json = await decrypt(token, appID);
//         console.log('Decrypted JSON:', JSON.parse(json));
//     } catch (err) {
//         console.error('Decryption failed:', err);
//     }
// })();

/**
 * Costruisce un path API concatenando i segmenti non vuoti con '/'.
 *
 * @example
 * buildApiPath('/api', 'opem', 'v1', 'persons') // '/api/opem/v1/persons'
 * buildApiPath('/api', '',     'v1', 'persons') // '/api/v1/persons'
 */
export function buildApiPath(...segments: string[]): string {
  return segments.filter(Boolean).join('/');
}
