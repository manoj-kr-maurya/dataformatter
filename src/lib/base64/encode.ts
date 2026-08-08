export type EncodeResult = { ok: true; value: string } | { ok: false; error: string };

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function encodeBase64(input: string): EncodeResult {
  const bytes = new TextEncoder().encode(input);
  return { ok: true, value: bytesToBase64(bytes) };
}