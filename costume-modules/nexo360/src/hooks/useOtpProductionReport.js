import { useEffect, useState } from 'react';
import { getOtpProductionReport, getSupplierOtpProductionReport } from '../services/nexoProcessApi';
import { normalizeOtpResponse } from '../data/otpReport.mjs';
import { useRealtime } from '../../utils/useRealTime';

export function useOtpProductionReport(companyId, { minDate, maxDate }, showClient = true, showParentStage = false, supplierAccess) {
    const { companyKey, accessKey, apiBaseUrl } = supplierAccess ?? {};
    const isSupplier = Boolean(supplierAccess);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [version, setVersion] = useState(0);
    const retry = () => setVersion(current => current + 1);
    useRealtime(isSupplier ? null : companyId, payload => {
        if (['process_instance', 'documents', 'ordersDelegation', 'docs_instances', 'documents_group'].includes(payload?.table)) {
            setVersion(current => current + 1);
        }
    });
    useEffect(() => {
        const controller = new AbortController();
        setRows([]);
        setError('');
        if (!companyId || (isSupplier && (!companyKey || !accessKey || !apiBaseUrl))) { setLoading(false); return () => controller.abort(); }
        setLoading(true);
        const request = isSupplier
            ? getSupplierOtpProductionReport({ companyKey, accessKey, apiBaseUrl }, { minDate, maxDate }, controller.signal)
            : getOtpProductionReport(companyId, { minDate, maxDate, showClient, showParentStage }, controller.signal);
        request
            .then(response => { if (!controller.signal.aborted) setRows(normalizeOtpResponse(response)); })
            .catch(() => { if (!controller.signal.aborted) setError('No fue posible cargar el informe de OTP. Intenta nuevamente.'); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [companyId, minDate, maxDate, showClient, showParentStage, version, isSupplier, companyKey, accessKey, apiBaseUrl]);
    return { rows, loading, error, retry };
}
