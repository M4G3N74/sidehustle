const ENC_LABEL = 'hustletrack-enc-v1';

function getSecret(): string {
  // Server: derive from NEXTAUTH_SECRET. Client: use pre-derived public key.
  if (typeof window === 'undefined') {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error('NEXTAUTH_SECRET is not set');
    // Derive the same hex string that was pre-computed for NEXT_PUBLIC_ENC_KEY
    const { createHash } = require('crypto');
    return createHash('sha256').update(secret).digest('hex');
  }
  const key = process.env.NEXT_PUBLIC_ENC_KEY;
  if (!key) throw new Error('NEXT_PUBLIC_ENC_KEY is not set');
  return key;
}

function getSubtle(): SubtleCrypto {
  if (typeof window !== 'undefined') return window.crypto.subtle;
  return (globalThis as any).crypto.subtle;
}

function getRandomValues(arr: Uint8Array): Uint8Array {
  if (typeof window !== 'undefined') return window.crypto.getRandomValues(arr);
  return (globalThis as any).crypto.getRandomValues(arr);
}

async function getKey(): Promise<CryptoKey> {
  const subtle = getSubtle();
  const enc = new TextEncoder();
  const keyMaterial = await subtle.importKey('raw', enc.encode(getSecret()), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode(ENC_LABEL), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptResponse(data: unknown): Promise<string> {
  const subtle = getSubtle();
  const key = await getKey();
  const ivBuf = new ArrayBuffer(12);
  const iv = new Uint8Array(ivBuf);
  getRandomValues(iv);
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv: ivBuf }, key, encoded);
  const combined = new Uint8Array(12 + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), 12);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptResponse<T>(payload: string): Promise<T> {
  const subtle = getSubtle();
  const key = await getKey();
  const bytes = atob(payload);
  const buf = new ArrayBuffer(bytes.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) view[i] = bytes.charCodeAt(i);
  const iv = buf.slice(0, 12);
  const ciphertext = buf.slice(12);
  const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(decrypted));
}
