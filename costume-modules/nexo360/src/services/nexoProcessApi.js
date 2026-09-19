import { urlSer } from '../../utils/functions';

// Fuente única de la URL del backend: se controla desde utils/functions.js (urlSer),
// igual que el resto de llamadas del módulo. No hardcodear otra URL aquí.
const apiBaseUrl = urlSer;

export async function getProcessAdministrationReport(companyId) {
    const response = await fetch(`${apiBaseUrl}/nexo360/getProcessAdministrationReport`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-SGA-Company-Id": String(companyId)
        },
        body: JSON.stringify({ company_id: companyId })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw error;
    }

    return response.json();
}
