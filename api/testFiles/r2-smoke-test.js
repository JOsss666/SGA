// Prueba de humo de R2: sube un objeto, lo lee por la URL pública, y lo borra.
// Uso:  node api/testFiles/r2-smoke-test.js
import storage from "../services/storage.service.js";

async function main() {
    console.log("R2 configurado:", storage.isR2Configured());
    if (!storage.isR2Configured()) {
        console.error("❌ Faltan variables R2_* en el .env");
        process.exit(1);
    }

    const fakeStorageKey = "e8119ed2-e1f2-4d12-9722-87e4ec347dac"; // compañía de prueba
    const buffer = Buffer.from(`smoke-test ${new Date().toISOString()}`);

    // 1) key nivel compañía
    const key = storage.buildKey({
        storageKey: fakeStorageKey,
        category: "others",
        filename: "smoke.txt",
        buffer,
    });
    console.log("key generada (compañía):", key);

    // key nivel tienda (solo para ver la ruta)
    const storeKey = storage.buildKey({
        storageKey: fakeStorageKey,
        category: "assets",
        storeId: 7,
        filename: "logo.png",
        buffer,
    });
    console.log("key generada (tienda):  ", storeKey);

    // 2) subir
    const { url } = await storage.uploadBuffer(buffer, key, "text/plain");
    console.log("⬆️  subido:", url);

    // 3) leer por URL pública
    const res = await fetch(url);
    console.log("🌐 GET público:", res.status, res.status === 200 ? "✅" : "❌");
    const body = await res.text();
    const contentOk = body === buffer.toString();
    console.log("   contenido correcto:", contentOk ? "✅" : "❌");

    // 4) keyFromUrl round-trip + ignora Cloudinary
    const rt = storage.keyFromUrl(url);
    console.log("🔁 keyFromUrl round-trip:", rt === key ? "✅" : `❌ (${rt})`);
    const ignoresCloudinary = storage.keyFromUrl(
        "https://res.cloudinary.com/djjxugmni/image/upload/v1/x.png"
    ) === null;
    console.log("   ignora URLs de Cloudinary:", ignoresCloudinary ? "✅" : "❌");

    // 5) borrar y confirmar 404
    await storage.deleteObject(key);
    const after = await fetch(url);
    console.log("🗑️  tras borrar, GET:", after.status, after.status === 404 ? "✅" : "❌");

    const allOk = res.status === 200 && contentOk && rt === key && ignoresCloudinary && after.status === 404;
    console.log(allOk ? "\n🎉 SMOKE TEST OK" : "\n⚠️  Revisar los ❌ de arriba");
    process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
});
