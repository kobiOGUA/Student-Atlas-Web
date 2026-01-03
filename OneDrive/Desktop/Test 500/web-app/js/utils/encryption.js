// PIN Encryption using CryptoJS
export function hashPINWithSalt(pin, salt) {
    return CryptoJS.SHA256(pin + salt).toString();
}

export function generateSalt() {
    return CryptoJS.lib.WordArray.random(128 / 8).toString();
}
