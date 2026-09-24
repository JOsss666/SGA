import { useEffect, useState } from 'react';
import { getOtpProductionReport } from '../services/nexoProcessApi';
import { normalizeOtpResponse } from '../data/otpReport.mjs';
import { useRealtime } from '../../utils/useRealTime';

export function useOtpProductionReport(companyId, { minDate, maxDate }, showClient = true) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [version, setVersion] = useState(0);
    const retry = () => setVersion(current => current + 1);
    useRealtime(companyId, payload => {
        if (['process_instance', 'documents', 'ordersDelegation', 'docs_instances', 'documents_group'].includes(payload?.table)) {
            setVersion(current => current + 1);
        }
    });
    useEffect(() => {
        const controller = new AbortController();
        setRows([]);
        setError('');
        if (!companyId) { setLoading(false); return () => controller.abort(); }
        setLoading(true);
        getOtpProductionReport(companyId, { minDate, maxDate, showClient }, controller.signal)
            .then(response => { if (!controller.signal.aborted) setRows(normalizeOtpResponse(response)); })
            .catch(() => { if (!controller.signal.aborted) setError('No fue posible cargar el informe de OTP. Intenta nuevamente.'); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [companyId, minDate, maxDate, showClient, version]);
    return { rows, loading, error, retry };
}
