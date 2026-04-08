#!/usr/bin/env bun
/**
 * Decifra un token AES-GCM (hex) prodotto dall'endpoint /api/token
 * quando encryptToken: true in environment.json.
 *
 * Utilizzo:
 *   bun scripts/decode-token.ts <hex-token> <appId>
 *   bun scripts/decode-token.ts --url http://localhost:8080/api/token --app-id my-app
 *   bun scripts/decode-token.ts --file token.txt --app-id my-app
 *   echo "<hex>" | bun scripts/decode-token.ts - <appId>
 */

async function decrypt(ciphertextHex: string, appId: string): Promise<string> {
  ciphertextHex = ciphertextHex.trim();
  if (!ciphertextHex || ciphertextHex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(ciphertextHex)) {
    throw new Error('Token non valido: stringa hex non valida');
  }

  const encryptedData = new Uint8Array(
    ciphertextHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16))
  );

  const NONCE_SIZE = 12;
  if (encryptedData.length < NONCE_SIZE + 16) {
    throw new Error(`Token troppo corto (${encryptedData.length} bytes)`);
  }

  const keyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(appId));
  const key = await crypto.subtle.importKey('raw', keyHash, { name: 'AES-GCM' }, false, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: encryptedData.slice(0, NONCE_SIZE) },
    key,
    encryptedData.slice(NONCE_SIZE)
  );
  return new TextDecoder().decode(decrypted);
}

function printHelp() {
  console.log(`
Utilizzo:
  bun scripts/decode-token.ts <hex-token> <appId>
  bun scripts/decode-token.ts --url <url> --app-id <appId>
  bun scripts/decode-token.ts --file <file.txt> --app-id <appId>
  echo <hex> | bun scripts/decode-token.ts - <appId>
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  let hexToken: string | undefined;
  let appId: string | undefined;

  if (args[0] === '--url') {
    const url    = args[1];
    const appIdx = args.indexOf('--app-id');
    appId = appIdx !== -1 ? args[appIdx + 1] : undefined;
    if (!url || !appId) { printHelp(); process.exit(1); }

    console.error(`Fetching token da ${url} con AppId: ${appId}...`);
    const res = await fetch(url, { headers: { AppId: appId } });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    hexToken = await res.text();

  } else if (args[0] === '--file') {
    const file   = args[1];
    const appIdx = args.indexOf('--app-id');
    appId = appIdx !== -1 ? args[appIdx + 1] : undefined;
    if (!file || !appId) { printHelp(); process.exit(1); }

    hexToken = await Bun.file(file).text();

  } else if (args[0] === '-') {
    appId    = args[1];
    if (!appId) { printHelp(); process.exit(1); }
    hexToken = await new Response(Bun.stdin.stream()).text();

  } else {
    hexToken = args[0];
    appId    = args[1];
    if (!hexToken || !appId) { printHelp(); process.exit(1); }
  }

  const json = await decrypt(hexToken!, appId!);

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    console.error('⚠ Payload decifrato non è JSON valido. Output grezzo:');
    console.log(json);
    process.exit(1);
  }

  console.log(JSON.stringify(parsed, null, 2));
}

main().catch(err => {
  console.error('Errore:', err instanceof Error ? err.message : err);
  process.exit(1);
});
