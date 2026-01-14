import CryptoJS from 'crypto-js';

// PIN Encryption - Exactly as in Android app

export function hashPINWithSalt(pin, salt) {
    return CryptoJS.SHA256(pin + salt).toString();
}

export function generateSalt() {
    return CryptoJS.lib.WordArray.random(128 / 8).toString();
}

export function verifyPIN(inputPin, storedHash, salt) {
    const inputHash = hashPINWithSalt(inputPin, salt);
    return inputHash === storedHash;
}
