// Constants for KDF (PBKDF2)
const SALT_LEN = 16;
const ITERATIONS = 100000;
const HASH_ALGO = 'SHA-256';
const KEY_LEN = 256; // bits for AES-256

// Constants for AES-GCM
const IV_LEN = 12;
const ALGORITHM = 'AES-GCM';

// --- Utils ---

function getRandomBytes(len: number): Uint8Array {
    const bytes = new Uint8Array(len);
    crypto.getRandomValues(bytes);
    return bytes;
}

// Convert Uint8Array to Base64
export function toBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
}

// Convert Base64 to Uint8Array
export function fromBase64(str: string): Uint8Array {
    return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

// --- Key Derivation (PBKDF2) ---

export async function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
    const textEncoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        textEncoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );

    // Derive the key used for AES-GCM
    // We derive a raw key directly or derive bits and import.
    // Let's derive a CryptoKey for AES-GCM directly if possible, or usually we just derive bits for portability.
    // For consistency with previous API returning Uint8Array:

    // Check TS lib: deriveBits returns ArrayBuffer
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt as any,
            iterations: ITERATIONS,
            hash: HASH_ALGO
        },
        keyMaterial,
        KEY_LEN
    );

    return new Uint8Array(derivedBits);
}

export function generateSalt(): Uint8Array {
    return getRandomBytes(SALT_LEN);
}

// --- Encryption / Decryption (AES-GCM) ---

async function importKey(rawKey: Uint8Array): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
        'raw',
        rawKey as any, // Using rawKey directly, casting if needed by TS in some envs, but normally Uint8Array is BufferSource
        ALGORITHM,
        false,
        ['encrypt', 'decrypt']
    );
}

export async function encryptData(data: string, keyBytes: Uint8Array): Promise<{ ciphertext: string; iv: string }> {
    const key = await importKey(keyBytes);
    const iv = getRandomBytes(IV_LEN);
    const encodedData = new TextEncoder().encode(data);

    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv: iv as any },
        key,
        encodedData as any
    );

    return {
        ciphertext: toBase64(new Uint8Array(encryptedBuffer)),
        iv: toBase64(iv)
    };
}

export async function decryptData(ciphertextB64: string, ivB64: string, keyBytes: Uint8Array): Promise<string> {
    const key = await importKey(keyBytes);
    const iv = fromBase64(ivB64);
    const ciphertext = fromBase64(ciphertextB64);

    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv: iv as any },
        key,
        ciphertext as any
    );

    return new TextDecoder().decode(decryptedBuffer);
}
