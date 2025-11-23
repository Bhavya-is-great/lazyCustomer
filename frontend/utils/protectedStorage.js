// utils/protectedStorage.js
// Lightweight protected storage: stores { v: value, s: keyHash } in sessionStorage.
// Not cryptographically secure — prevents casual tampering / accidental edits.

export function tinyHash(str) {
    // simple deterministic 32-bit-ish hash -> returns hex string
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h.toString(16);
}

/**
 * createProtectedStorage(secretKey)
 * returns { protectedSet, protectedGet, protectedRemove }
 * secretKey: any string (kept in memory). Without the correct key, reads return null.
 */
export function createProtectedStorage(secretKey) {
    const keyHash = tinyHash(String(secretKey || ""));

    function protectedSet(key, value) {
        try {
            const payload = { v: value, s: keyHash, t: Date.now() };
            sessionStorage.setItem(key, JSON.stringify(payload));
        } catch (e) {
            // ignore failures
        }
    }

    function protectedGet(key) {
        try {
            const raw = sessionStorage.getItem(key);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || parsed.s !== keyHash) return null;
            return parsed.v;
        } catch (e) {
            return null;
        }
    }

    function protectedRemove(key) {
        try {
            sessionStorage.removeItem(key);
        } catch (e) { }
    }

    return { protectedSet, protectedGet, protectedRemove };
}
