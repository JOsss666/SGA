// Script independiente para listar y eliminar TODAS las facturas pendientes en Factus.
// Uso:  node scripts/clearPendingBills.js          -> solo lista
//       node scripts/clearPendingBills.js --delete  -> lista y elimina todas las pendientes
import dotenv from 'dotenv';
dotenv.config();

const urlSer = process.env.FACTUS_API_LINK;
const DO_DELETE = process.argv.includes('--delete');

async function getToken() {
    const res = await fetch(urlSer + '/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
            grant_type: 'password',
            client_id: process.env.FACTUS_CLIENT_ID,
            client_secret: process.env.FACTUS_CLIENT_SECRET,
            username: process.env.FACTUS_USERNAME,
            password: process.env.FACTUS_PASSWORD,
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error('No se pudo autenticar: ' + JSON.stringify(data));
    return data.access_token;
}

async function listPending(token) {
    const res = await fetch(urlSer + '/v1/bills', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    const data = await res.json();
    // Factus envuelve en data.data.data; dejamos fallback por si cambia
    const all = data?.data?.data ?? data?.data ?? [];
    // status 0 = pendiente de enviar a la DIAN (bloquea el canal).
    // status 1 = validada/aceptada por la DIAN -> NUNCA se debe borrar.
    return all.filter((b) => String(b.status) === '0');
}

async function deleteByReference(token, reference) {
    const res = await fetch(urlSer + `/v1/bills/destroy/reference/${reference}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, body };
}

(async () => {
    try {
        const token = await getToken();
        console.log('🔐 Token obtenido.\n');

        const pending = await listPending(token);
        if (!pending.length) {
            console.log('✅ No hay facturas pendientes. El canal está libre.');
            return;
        }

        console.log(`⚠️  ${pending.length} factura(s) pendiente(s):`);
        pending.forEach((b) =>
            console.log(`   - ref: ${b.reference_code}  number: ${b.number}  status: ${b.status}`)
        );
        console.log('');

        if (!DO_DELETE) {
            console.log('ℹ️  Modo solo-lectura. Ejecuta con --delete para eliminarlas.');
            return;
        }

        for (const b of pending) {
            const ref = b.reference_code;
            const r = await deleteByReference(token, ref);
            console.log(`${r.ok ? '🗑️  Eliminada' : '❌ Falló'} ${ref} (HTTP ${r.status})`,
                r.ok ? '' : JSON.stringify(r.body));
        }
        console.log('\n✅ Proceso terminado.');
    } catch (err) {
        console.error('💥 Error:', err.message);
        process.exit(1);
    }
})();
