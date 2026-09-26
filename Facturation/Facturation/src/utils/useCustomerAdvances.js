import { useEffect, useState } from 'react';
import { postInfo } from './functions';

export function useCustomerAdvances(companyId, thirdPartyId, paymentMethods) {
    const enabled = paymentMethods.some(method => method.for_balance);
    const scope = `${companyId}:${thirdPartyId}`;
    const [result, setResult] = useState({ scope: '', advances: [], loading: false, error: '' });
    const [revision, setRevision] = useState(0);
    useEffect(() => {
        let cancelled = false;
        if (!enabled || !companyId || !thirdPartyId) return;
        setResult({ scope, advances: [], loading: true, error: '' });
        let timeout;
        const request = postInfo('/treasury/getThirdPartyAdvances', { company_id: companyId, thirdParty_id: thirdPartyId });
        const deadline = new Promise((_, reject) => {
            timeout = setTimeout(() => reject(new Error('La consulta tardó demasiado. Actualice el saldo para reintentar.')), 15000);
        });
        Promise.race([request, deadline])
            .then(response => {
                if (response?.status !== 'OK') throw new Error(response?.message || 'No se pudo consultar el saldo a favor.');
                if (!cancelled) setResult({ scope, advances: response.advances, loading: false, error: '' });
            })
            .catch(error => {
                if (!cancelled) setResult({ scope, advances: [], loading: false, error: error.message || 'No se pudo consultar el saldo a favor.' });
            })
            .finally(() => clearTimeout(timeout));
        return () => { cancelled = true; clearTimeout(timeout); };
    }, [companyId, thirdPartyId, enabled, scope, revision]);
    const advancesFor = method => result.scope === scope ? result.advances.filter(advance =>
        String(advance.account_id) === String(method.account_id) && advance.currency === method.currency) : [];
    const availableFor = method => advancesFor(method).reduce((sum, advance) => sum + Number(advance.available_amount), 0);
    const requestedFor = method => paymentMethods.filter(item => item.for_balance &&
        String(item.account_id) === String(method.account_id) && item.currency === method.currency)
        .reduce((sum, item) => sum + Number(item.value || 0), 0);
    let error = '';
    if (enabled) {
        if (!thirdPartyId) error = 'Seleccione el tercero para consultar sus anticipos.';
        else if (result.scope !== scope || result.loading) error = 'Consultando saldo a favor…';
        else if (result.error) error = result.error;
        else if (paymentMethods.some(method => method.for_balance && availableFor(method) <= 0)) error = 'No hay anticipos disponibles para la cuenta y moneda seleccionadas.';
        else if (paymentMethods.some(method => method.for_balance &&
            (!Number.isFinite(Number(method.value)) || Number(method.value || 0) <= 0))) error = 'Ingrese el importe de saldo a favor que desea aplicar.';
        else if (paymentMethods.some(method => method.for_balance && Math.round(requestedFor(method) * 1e6) > Math.round(availableFor(method) * 1e6))) error = 'El importe supera el saldo a favor disponible.';
    }
    return { availableFor, advancesFor, requestedFor, error, loading: result.loading,
        refresh: () => setRevision(value => value + 1) };
}
