import crypto from 'crypto';

const encryptionService = {};

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;

const getEncryptionKey = () => {
    const rawKey = process.env.APP_ENCRYPTION_KEY;

    if (!rawKey) {
        throw new Error('APP_ENCRYPTION_KEY no está configurada.');
    }

    let key;
    try {
        key = Buffer.from(rawKey, 'base64');
    } catch {
        throw new Error('APP_ENCRYPTION_KEY debe estar codificada en base64.');
    }

    if (key.length !== KEY_LENGTH) {
        throw new Error(`APP_ENCRYPTION_KEY debe decodificar a ${KEY_LENGTH} bytes.`);
    }

    return key;
};

const normalizePlainText = (value) => {
    if (value === undefined || value === null) return null;
    return typeof value === 'string' ? value : JSON.stringify(value);
};

const parseEncryptedPayload = (encryptedText) => {
    if (typeof encryptedText !== 'string' || encryptedText.trim() === '') {
        throw new Error('El texto cifrado es requerido.');
    }

    const parts = encryptedText.split(':');
    if (parts.length !== 4 || parts[0] !== VERSION) {
        throw new Error('Formato de texto cifrado inválido.');
    }

    return {
        iv: Buffer.from(parts[1], 'base64'),
        authTag: Buffer.from(parts[2], 'base64'),
        encrypted: Buffer.from(parts[3], 'base64')
    };
};

encryptionService.encrypt = (value) => {
    const plainText = normalizePlainText(value);
    if (plainText === null) return null;

    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH
    });

    const encrypted = Buffer.concat([
        cipher.update(plainText, 'utf8'),
        cipher.final()
    ]);
    const authTag = cipher.getAuthTag();

    return [
        VERSION,
        iv.toString('base64'),
        authTag.toString('base64'),
        encrypted.toString('base64')
    ].join(':');
};

encryptionService.decrypt = (encryptedText) => {
    if (encryptedText === undefined || encryptedText === null) return null;

    const { iv, authTag, encrypted } = parseEncryptedPayload(encryptedText);
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH
    });

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
    ]);

    return decrypted.toString('utf8');
};

encryptionService.encryptFields = (source, fields) => {
    const result = { ...source };

    fields.forEach((field) => {
        if (result[field] !== undefined && result[field] !== null) {
            result[field] = encryptionService.encrypt(result[field]);
        }
    });

    return result;
};

encryptionService.decryptFields = (source, fields) => {
    const result = { ...source };

    fields.forEach((field) => {
        if (result[field] !== undefined && result[field] !== null) {
            result[field] = encryptionService.decrypt(result[field]);
        }
    });

    return result;
};

encryptionService.maskSecret = (value, visibleChars = 4) => {
    if (value === undefined || value === null || value === '') return '';
    const text = String(value);
    if (text.length <= visibleChars) return '*'.repeat(text.length);
    return `${'*'.repeat(Math.max(text.length - visibleChars, 0))}${text.slice(-visibleChars)}`;
};

encryptionService.generateKey = () => crypto.randomBytes(KEY_LENGTH).toString('base64');

export default encryptionService;
