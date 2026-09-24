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

export async function getSupplierOtpProductionReport({ apiBaseUrl, companyKey, accessKey }, { minDate, maxDate }, signal) {
    const response = await fetch(`${apiBaseUrl}/externalAccess/nexo360/getOtpProductionReport`, {
        method: 'POST', credentials: 'include', signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_key: companyKey, access_key: accessKey, minDate, maxDate })
    });
    if (!response.ok) throw new Error('No fue posible cargar las OTP del proveedor.');
    return response.json();
}

export async function getOtpProductionReport(companyId, dateRange, signal) {
    const response = await fetch(`${apiBaseUrl}/nexo360/getOtpProductionReport`, {
        method: 'POST', credentials: 'include', signal,
        headers: { 'Content-Type': 'application/json', 'X-SGA-Company-Id': String(companyId) },
        body: JSON.stringify({ company_id: companyId, ...dateRange })
    });
    if (!response.ok) throw new Error('No fue posible cargar el informe de OTP.');
    return response.json();
}
