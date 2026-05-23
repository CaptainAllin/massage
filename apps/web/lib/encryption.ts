import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY environment variable is not set');
  const buf = Buffer.from(key, 'hex');
  if (buf.length !== KEY_LENGTH) throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  return buf;
}

/** Encrypt a string. Returns "iv:authTag:ciphertext" (hex-encoded). */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/** Decrypt a string previously encrypted with `encrypt`. */
export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 3) throw new Error('Invalid ciphertext format');
  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const key = getKey();
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}

/** Encrypt if a value is present; returns null otherwise. */
export function encryptIfPresent(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  return encrypt(value);
}

/**
 * Decrypt if a value looks like an encrypted payload; returns the value as-is
 * if it's not in the expected format (handles legacy plaintext values gracefully).
 */
export function decryptIfPresent(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  // Encrypted values have exactly 2 colon separators
  if ((value.match(/:/g) || []).length !== 2) return value;
  try {
    return decrypt(value);
  } catch {
    return value;
  }
}
