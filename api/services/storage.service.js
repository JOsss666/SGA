// Servicio de almacenamiento en Cloudflare R2 (compatible S3).
// Aditivo: si R2 no está configurado, isR2Configured() devuelve false y el
// código que lo use debe caer a Cloudinary como fallback. No toca Cloudinary.

import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
} from "@aws-sdk/client-s3";
import crypto from "crypto";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// --- Config (leída y normalizada desde el .env) ---
const R2_ACCOUNT_ID = (process.env.R2_ACCOUNT_ID ?? "").trim();
const R2_ACCESS_KEY_ID = (process.env.R2_ACCESS_KEY_ID ?? "").trim();
const R2_SECRET_ACCESS_KEY = (process.env.R2_SECRET_ACCESS_KEY ?? "").trim();
const R2_BUCKET = (process.env.R2_BUCKET ?? "").trim();
// Quita el "/" final para poder concatenar la key sin dobles barras.
const R2_PUBLIC_BASE_URL = (process.env.R2_PUBLIC_BASE_URL ?? "").trim().replace(/\/+$/, "");

export function isR2Configured() {
    return Boolean(
        R2_ACCOUNT_ID &&
        R2_ACCESS_KEY_ID &&
        R2_SECRET_ACCESS_KEY &&
        R2_BUCKET &&
        R2_PUBLIC_BASE_URL
    );
}

// Cliente perezoso: solo se construye si hay config (evita romper el arranque
// del servidor cuando aún no se han puesto las vars R2_*).
let _client = null;
function getClient() {
    if (!isR2Configured()) return null;
    if (!_client) {
        _client = new S3Client({
            region: "auto",
            endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: R2_ACCESS_KEY_ID,
                secretAccessKey: R2_SECRET_ACCESS_KEY,
            },
        });
    }
    return _client;
}

// --- Taxonomía de carpetas por compañía ---
// Categorías válidas. Cualquier otra cae a 'others'.
export const STORAGE_CATEGORIES = ["assets", "files", "thirdPartiesDocs", "others"];

function safeCategory(category) {
    return STORAGE_CATEGORIES.includes(category) ? category : "others";
}

// Sanea un segmento de ruta (storageKey/storeId) para que no rompa la key.
function safeSegment(value) {
    return String(value ?? "").trim().replace(/[^a-zA-Z0-9._-]/g, "");
}

/**
 * Construye la key (ruta) del objeto en R2 siguiendo la taxonomía:
 *   compañía: {storageKey}/{category}/{hash}.{ext}
 *   tienda:   {storageKey}/stores/{storeId}/{category}/{hash}.{ext}
 *
 * @param {Object} opts
 * @param {string} opts.storageKey  UUID de "Ecosystem".companies.storageKey
 * @param {string} [opts.category]  assets | files | thirdPartiesDocs | others
 * @param {string|number} [opts.storeId]  si el archivo es de una tienda
 * @param {string} opts.filename    nombre original (para extraer extensión)
 * @param {Buffer} [opts.buffer]    si se pasa, el nombre es el hash del contenido (dedupe)
 * @param {string} [opts.name]      nombre base alternativo si no se quiere hash
 * @returns {string} key
 */
export function buildKey({ storageKey, category, storeId, filename, buffer, name }) {
    const company = safeSegment(storageKey);
    if (!company) throw new Error("buildKey: storageKey requerido");

    const cat = safeCategory(category);
    const ext = (path.extname(filename ?? "") || "").toLowerCase();

    // Nombre del objeto: hash de contenido (dedupe por compañía) o uuid/name.
    let base;
    if (buffer) {
        base = crypto.createHash("sha256").update(buffer).digest("hex");
    } else if (name) {
        base = safeSegment(name);
    } else {
        base = crypto.randomUUID();
    }

    const prefix = storeId != null && String(storeId).length
        ? `${company}/stores/${safeSegment(storeId)}/${cat}`
        : `${company}/${cat}`;

    return `${prefix}/${base}${ext}`;
}

/** URL pública (CDN) para una key dada. */
export function publicUrl(key) {
    return `${R2_PUBLIC_BASE_URL}/${key}`;
}

/**
 * Extrae la key de R2 a partir de una URL pública. Devuelve null si la URL no
 * pertenece a R2 (p. ej. una URL vieja de Cloudinary) → así no se toca.
 */
export function keyFromUrl(url) {
    if (!url || !R2_PUBLIC_BASE_URL) return null;
    const base = `${R2_PUBLIC_BASE_URL}/`;
    if (typeof url === "string" && url.startsWith(base)) {
        return url.slice(base.length);
    }
    return null;
}

/**
 * Sube un buffer a R2.
 * @returns {Promise<{key:string, url:string}>}
 */
export async function uploadBuffer(buffer, key, contentType, { cacheControl } = {}) {
    const client = getClient();
    if (!client) throw new Error("uploadBuffer: R2 no está configurado");

    await client.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType || "application/octet-stream",
        // Las keys llevan hash → el contenido es inmutable; caché agresiva en el CDN.
        CacheControl: cacheControl || "public, max-age=31536000, immutable",
    }));

    return { key, url: publicUrl(key) };
}

/**
 * Borra un objeto de R2. No-op silencioso si R2 no está configurado o la key es
 * nula/ajena (best-effort: nunca debe tumbar la operación principal).
 */
export async function deleteObject(key) {
    if (!key) return false;
    const client = getClient();
    if (!client) return false;
    try {
        await client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
        return true;
    } catch (e) {
        console.warn(`[storage] no se pudo borrar ${key}: ${e.message}`);
        return false;
    }
}

/** Comprueba si un objeto existe (útil para tests/verificación). */
export async function objectExists(key) {
    const client = getClient();
    if (!client) return false;
    try {
        await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
        return true;
    } catch {
        return false;
    }
}

export default {
    isR2Configured,
    STORAGE_CATEGORIES,
    buildKey,
    publicUrl,
    keyFromUrl,
    uploadBuffer,
    deleteObject,
    objectExists,
};
