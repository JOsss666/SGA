// Migración de datos: URLs de Cloudinary → Cloudflare R2 (Etapa 5).
//
// Uso:
//   node db/scripts/migrate-cloudinary-to-r2.mjs            → DRY RUN (no descarga, no escribe)
//   node db/scripts/migrate-cloudinary-to-r2.mjs --execute  → migración real
//
// Seguridad:
//   - Aditivo: NO borra nada de Cloudinary (queda como respaldo).
//   - Backup: escribe db/backups/r2-migration-backup-<ts>.json con todos los valores
//     viejos ANTES de cualquier UPDATE.
//   - Idempotente: solo toca filas cuyo valor aún es de res.cloudinary.com.
//   - Fases separadas: lee (BD) → transfiere (sin BD) → escribe (BD) para no
//     mantener la conexión abierta durante las descargas largas (cortes de Render).

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import dotenv from "dotenv";
import pg from "pg";
import sharp from "sharp";
import storage from "../../api/services/storage.service.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "../..");
const EXECUTE = process.argv.includes("--execute");
// --only=<label> limita la migración a una tabla (attached|thirdparties|products|categories|bussines|taxInfo)
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").split("=")[1] || null;

// Mapeo de estáticos ya migrados en Etapa 4 (oldCloudinaryUrl -> newR2Url) para
// reusar placeholders sin re-descargar. Si no existe, se ignora.
const SP = "/private/tmp/claude-501/-Users-joss66-trabajo-SGA/b42633b4-fc5e-4faf-9f21-e6f0a3bd0816/scratchpad";
let staticMapping = {};
try { staticMapping = JSON.parse(fs.readFileSync(path.join(SP, "static_mapping.json"), "utf8")); } catch {}

const CONVERTIBLE = new Set(["png", "jpg", "jpeg", "tiff", "bmp", "webp"]);
const isCloudinary = (v) => typeof v === "string" && v.includes("res.cloudinary.com");

const client = new pg.Client({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT,
    keepAlive: true,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 60000,
});

// ---- helpers ----
function extFromUrl(u) {
    return (decodeURIComponent(u.split("?")[0]).match(/\.([a-zA-Z0-9]+)$/) || [, ""])[1].toLowerCase();
}

const uploadCache = new Map(); // oldUrl -> {newUrl, contentType, ext, converted}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Descarga con reintentos + backoff (Cloudinary hace rate-limit con 401/429 en ráfagas).
async function fetchWithRetry(url, tries = 6) {
    let lastErr;
    for (let i = 0; i < tries; i++) {
        try {
            const res = await fetch(url);
            if (res.ok) return res;
            // Solo reintentar errores TRANSITORIOS. 401/403 = bloqueo de entrega
            // (PDF/ZIP restringidos en Cloudinary) → fallar rápido, no gastar backoff.
            if ([429, 500, 502, 503, 504].includes(res.status)) {
                lastErr = new Error(`fetch ${res.status}`);
                await sleep(Math.min(15000, 800 * 2 ** i));
                continue;
            }
            throw new Error(`fetch ${res.status}`); // 401/403/404: no reintentar
        } catch (e) {
            lastErr = e;
            await sleep(Math.min(15000, 800 * 2 ** i));
        }
    }
    throw lastErr;
}

// Descarga de Cloudinary, convierte a webp si es imagen raster, sube a R2.
// En DRY RUN no hace red: devuelve un plan estimado.
async function transfer(oldUrl, storageKey, folder) {
    if (uploadCache.has(oldUrl)) return uploadCache.get(oldUrl);

    // Placeholder ya migrado en Etapa 4 → reusar URL estática compartida.
    if (staticMapping[oldUrl]) {
        const r = { newUrl: staticMapping[oldUrl], reused: true };
        uploadCache.set(oldUrl, r);
        return r;
    }

    const ext = extFromUrl(oldUrl);
    const willConvert = CONVERTIBLE.has(ext);

    if (!EXECUTE) {
        const r = { newUrl: `${storageKey}/${folder}/<hash>.${willConvert ? "webp" : ext || "bin"}`, plan: true, willConvert };
        uploadCache.set(oldUrl, r);
        return r;
    }

    await sleep(150); // throttle suave entre requests para no gatillar el rate-limit
    const res = await fetchWithRetry(oldUrl);
    let buf = Buffer.from(await res.arrayBuffer());
    let outExt = ext || "bin";
    let ct = res.headers.get("content-type") || "application/octet-stream";
    let converted = false;

    if (willConvert) {
        try {
            buf = await sharp(buf).rotate().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
            outExt = "webp"; ct = "image/webp"; converted = true;
        } catch (e) {
            // si sharp falla, sube el original
            converted = false; outExt = ext || "bin";
        }
    }

    const hash = crypto.createHash("sha256").update(buf).digest("hex");
    const key = `${storageKey}/${folder}/${hash}.${outExt}`;
    const { url: newUrl } = await storage.uploadBuffer(buf, key, ct);
    const r = { newUrl, key, contentType: ct, ext: outExt, converted, size: buf.length };
    uploadCache.set(oldUrl, r);
    return r;
}

async function main() {
    if (!storage.isR2Configured()) { console.error("❌ R2 no configurado (.env)"); process.exit(1); }
    console.log(`\n=== Migración Cloudinary → R2 · modo: ${EXECUTE ? "EXECUTE (escribe)" : "DRY RUN (solo lectura)"} ===\n`);

    await client.connect();

    // Mapa company_id -> storageKey
    const companies = (await client.query(`SELECT company_id, "storageKey" FROM "Ecosystem".companies`)).rows;
    const skById = new Map(companies.map((c) => [String(c.company_id), c.storageKey]));
    const skFor = (companyId) => skById.get(String(companyId)) || `migrated/no-company`;

    if (ONLY) console.log(`(filtrado a --only=${ONLY})\n`);

    // ---- FASE A: leer ----
    const attached = (ONLY && ONLY !== "attached") ? [] : (await client.query(
        `SELECT id, url, name, type, category, company_id FROM "Ecosystem".attached WHERE url LIKE '%res.cloudinary.com%'`
    )).rows;

    const NONATTACHED = [
        { label: "thirdparties", schema: "Ecosystem", table: "thirdparties", col: "img", folder: "assets" },
        { label: "products", schema: "Inventory", table: "products&services", col: "img", folder: "assets" },
        { label: "categories", schema: "Inventory", table: "categories", col: "img", folder: "assets" },
        { label: "bussines", schema: "Ecosystem", table: "bussines", col: "img", folder: "assets" },
        { label: "taxInfo", schema: "Ecosystem", table: "thirdPartyTaxInfo", col: "attachedRut", folder: "thirdPartiesDocs" },
    ].filter((t) => !ONLY || ONLY === t.label);
    for (const t of NONATTACHED) {
        t.rows = (await client.query(
            `SELECT DISTINCT "${t.col}" AS url, min(company_id) AS company_id
             FROM "${t.schema}"."${t.table}" WHERE "${t.col}" LIKE '%res.cloudinary.com%' GROUP BY "${t.col}"`
        )).rows;
    }
    await client.end();

    console.log(`Fase A (lectura): attached=${attached.length} filas`);
    for (const t of NONATTACHED) console.log(`  ${t.label}: ${t.rows.length} URLs distintas`);

    // ---- FASE B: transferir (descargar+subir) ----
    const backup = [];
    const updates = { attached: [], nonattached: [] };
    let ok = 0, reused = 0, failed = 0;

    let done = 0;
    for (const r of attached) {
        try {
            const sk = skFor(r.company_id);
            const info = await transfer(r.url, sk, "files");
            updates.attached.push({ id: r.id, oldUrl: r.url, info, oldName: r.name, oldType: r.type, oldCategory: r.category });
            info.reused ? reused++ : ok++;
        } catch (e) { failed++; console.warn(`  ✗ attached#${r.id}: ${e.message}`); }
        if (EXECUTE && ++done % 50 === 0) console.error(`  … attached ${done}/${attached.length} (ok=${ok} reused=${reused} fail=${failed})`);
    }
    for (const t of NONATTACHED) {
        for (const row of t.rows) {
            try {
                const sk = skFor(row.company_id);
                const info = await transfer(row.url, sk, t.folder);
                updates.nonattached.push({ table: t, oldUrl: row.url, info });
                info.reused ? reused++ : ok++;
            } catch (e) { failed++; console.warn(`  ✗ ${t.label}: ${e.message} (${row.url.slice(0, 60)})`); }
        }
    }

    console.error(`\nFase B (transferencia): subidos=${ok} · reusados(placeholder)=${reused} · fallidos=${failed}`);

    if (!EXECUTE) {
        console.log("\n— DRY RUN — no se descargó ni escribió nada.");
        console.log("Ejemplos de destino:");
        updates.attached.slice(0, 2).forEach((u) => console.log(`  attached#${u.id}: ${u.info.newUrl}`));
        updates.nonattached.slice(0, 5).forEach((u) => console.log(`  ${u.table.label}: ${u.oldUrl.slice(0, 55)}… → ${u.info.newUrl}`));
        console.log(`\nTotal a migrar: ${updates.attached.length} attached + ${updates.nonattached.length} url-grupos no-attached`);
        return;
    }

    // ---- FASE C: escribir (con backup previo) ----
    const backupPath = path.join(REPO, "db/backups", `r2-migration-backup-${Date.now()}.json`);
    for (const u of updates.attached) backup.push({ table: "Ecosystem.attached", by: "id", key: u.id, col: "url", oldValue: u.oldUrl, newValue: u.info.newUrl });
    for (const u of updates.nonattached) backup.push({ table: `${u.table.schema}.${u.table.table}`, by: "col", col: u.table.col, oldValue: u.oldUrl, newValue: u.info.newUrl });
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.error(`\n🗄  Backup escrito: ${backupPath} (${backup.length} entradas)`);

    const w = new pg.Client({
        host: process.env.MYSQL_HOST, user: process.env.MYSQL_USER, password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE, port: process.env.MYSQL_PORT, keepAlive: true,
        ssl: { rejectUnauthorized: false }, statement_timeout: 60000,
    });
    await w.connect();
    let wrote = 0;

    for (const u of updates.attached) {
        const conv = u.info.converted;
        const newName = conv ? u.oldName.replace(/\.[^.]+$/, "") + ".webp" : u.oldName;
        const newType = conv ? "image/webp" : u.oldType;
        await w.query(
            `UPDATE "Ecosystem".attached
             SET url=$1, storage_provider='r2', storage_key=$2, category=COALESCE(category,'files'), type=$3, name=$4, updated_at=now()
             WHERE id=$5 AND url LIKE '%res.cloudinary.com%'`,
            [u.info.newUrl, u.info.key ?? null, newType, newName, u.id]
        );
        wrote++;
    }
    for (const u of updates.nonattached) {
        await w.query(
            `UPDATE "${u.table.schema}"."${u.table.table}" SET "${u.table.col}"=$1 WHERE "${u.table.col}"=$2`,
            [u.info.newUrl, u.oldUrl]
        );
        wrote++;
    }
    await w.end();
    console.error(`\n✅ Fase C: ${wrote} updates aplicados. Backup en ${backupPath}`);
}

main().catch((e) => { console.error("❌ Error fatal:", e); process.exit(1); });
