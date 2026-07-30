import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);
const VERSION = 'scrypt-v1';
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const SECRET_BYTES = 32;
const SCRYPT_OPTIONS = Object.freeze({
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024
});

const clientSecretService = {};

clientSecretService.generate = () => crypto.randomBytes(SECRET_BYTES).toString('base64url');

clientSecretService.hash = async (secret) => {
    if (typeof secret !== 'string' || secret.length < 32) {
        throw new Error('El client_secret debe contener al menos 32 caracteres.');
    }

    const salt = crypto.randomBytes(SALT_LENGTH);
    const derivedKey = await scryptAsync(secret, salt, KEY_LENGTH, SCRYPT_OPTIONS);

    return [
        VERSION,
        SCRYPT_OPTIONS.N,
        SCRYPT_OPTIONS.r,
        SCRYPT_OPTIONS.p,
        salt.toString('base64url'),
        derivedKey.toString('base64url')
    ].join('$');
};

clientSecretService.verify = async (secret, encodedHash) => {
    if (typeof secret !== 'string' || typeof encodedHash !== 'string') return false;

    const [version, n, r, p, saltValue, hashValue] = encodedHash.split('$');
    if (version !== VERSION || !saltValue || !hashValue) return false;

    const expected = Buffer.from(hashValue, 'base64url');
    if (expected.length !== KEY_LENGTH) return false;

    try {
        const actual = await scryptAsync(
            secret,
            Buffer.from(saltValue, 'base64url'),
            KEY_LENGTH,
            {
                N: Number(n),
                r: Number(r),
                p: Number(p),
                maxmem: SCRYPT_OPTIONS.maxmem
            }
        );
        return crypto.timingSafeEqual(actual, expected);
    } catch {
        return false;
    }
};

export default clientSecretService;
