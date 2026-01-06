import CryptoJS from 'crypto-js';

/**
 * Hash a PIN using SHA256
 * @param pin - The 4-digit PIN to hash
 * @returns The hashed PIN
 */
export function hashPIN(pin: string): string {
    return CryptoJS.SHA256(pin).toString();
}

/**
 * Verify a PIN against a hashed PIN
 * @param pin - The PIN to verify
 * @param hashedPin - The hashed PIN to compare against
 * @returns True if the PIN matches
 */
export function verifyPIN(pin: string, hashedPin: string): boolean {
    return hashPIN(pin) === hashedPin;
}

/**
 * Generate a random salt for additional security
 * @returns A random salt string
 */
export function generateSalt(): string {
    return CryptoJS.lib.WordArray.random(128 / 8).toString();
}

/**
 * Hash a PIN with a salt
 * @param pin - The PIN to hash
 * @param salt - The salt to use
 * @returns The salted and hashed PIN
 */
export function hashPINWithSalt(pin: string, salt: string): string {
    return CryptoJS.SHA256(pin + salt).toString();
}
