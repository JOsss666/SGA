import { useEffect, useMemo, useState } from 'react';
import { useAppInfo } from '../../../../context/context';
import { parseToXlsx } from '../../../../utils/functions';
import { urlSer } from '../../../../App';
import { buildLedgerView, createLedgerPdf, formatLedgerDate, formatLedgerMoney, ledgerExportColumns, ledgerExportRows } from '../../../../utils/auxiliaryLedger';
import { BoldTitle } from '../../components/BoldTitle';
import { DescriptionSpan } from '../../components/DescriptionSpan';
import { FormButton } from '../../components/FormButton';
import { FormInput } from '../../components/FormInput';
import { SelectOptions } from '../../components/SelectOptions';
import { CheckSquare } from '../../components/CheckSquare';
import { LoadingSpace } from '../LoadingSpace';
import { SearchBar } from '../../../../../../../Treasury/SGA - Treasuty/src/modules/userApp/components/SearchBar';
import { SearchinList } from '../../../../../../../Treasury/SGA - Treasuty/src/modules/userApp/components/SearchInList';
import { UniversalRow } from '../../../../../../../Treasury/SGA - Treasuty/src/modules/userApp/components/universalRow';
import { UniversalTable } from '../../../../../../../Treasury/SGA - Treasuty/src/modules/userApp/containers/universalTable';
import './reportAuxiliaryLedger.css';

export const hasLedgerAccess = (config) => config?.access?.suspended !== true && config?.access?.modules?.management?.use === true && (config?.access?.modules?.contability?.use === true || config?.access?.modules?.treasury?.use === true);
const columns = [
    { key: 'group', label: 'Cuenta / tercero', flex: '0 0 20rem', minWidth: '20rem' },
    { key: 'date', label: 'Fecha documento', flex: '0 0 10rem', minWidth: '10rem', order: 'ASC' },
    { key: 'document', label: 'Documento', flex: '0 0 12rem', minWidth: '12rem' },
    { key: 'concept', label: 'Concepto', flex: '1 1 22rem', minWidth: '18rem' },
    { key: 'debit', label: 'Valor débito', flex: '0 0 11rem', minWidth: '11rem', sortable: false },
    { key: 'credit', label: 'Valor crédito', flex: '0 0 11rem', minWidth: '11rem', sortable: false },
    { key: 'balance', label: 'Saldo acumulado', flex: '0 0 12rem', minWidth: '12rem', sortable: false }
];
const accountOptionLabel = (account) => `${account.code} · ${account.name}`;
const thirdPartyOptionLabel = (third) => `${third.number || 'Sin identificación'} · ${third.names}`;
const postLedger = async (body) => {
    const response = await fetch(`${urlSer}/contability/auxiliary-ledger`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-SGA-Company-Id': String(body.company_id) },
        body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message || payload?.message || 'No fue posible consultar el Libro Auxiliar.');
    return payload;
};
export function ReportAuxiliaryLedger() {
    const { appInfo, userConfig } = useAppInfo();
    if (!hasLedgerAccess(userConfig)) return <section className="reportAuxiliaryLedger"><p className="auxiliaryLedgerNotice" role="alert">Requiere acceso a Administración y Contabilidad o Tesorería.</p></section>;
    return <AuxiliaryLedger companyId={appInfo.company_id}/>;
}
function AuxiliaryLedger({ companyId }) {
    const [catalog, setCatalog] = useState();
    const [query, setQuery] = useState({ start_date: '', end_date: '', grouping: 'account', account_codes: [], third_party_ids: [], cost_center_ids: [], document_types: [], include_zero: false });
    const [report, setReport] = useState(); const [search, setSearch] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
    const change = (key, value) => setQuery(current => ({ ...current, [key]: value }));
    // SearchinList entrega la selección completa al marcar o desmarcar una opción.
    // Se normaliza como lista única para conservar todos los filtros elegidos.
    const applyCumulativeSelection = (key) => (values) => setQuery(current => ({
        ...current,
        [key]: [...new Set((Array.isArray(values) ? values : []).map(String))]
    }));
    const applyAccountSelection = (values) => setQuery(current => {
        const selectedCodes = [...new Set((Array.isArray(values) ? values : []).map(String))]
            .sort((first, second) => first.length - second.length || first.localeCompare(second));
        // Una cuenta padre representa todas sus hijas. Se conservan únicamente
        // los códigos de mayor nivel para evitar filtros redundantes.
        const parentCodes = selectedCodes.filter(code => !selectedCodes.some(parent => parent !== code && code.startsWith(parent)));
        return { ...current, account_codes: parentCodes };
    });
    useEffect(() => { let active = true; postLedger({ company_id: companyId, action: 'options' }).then(response => { if (!active) return; setCatalog(response); const parts = new Intl.DateTimeFormat('en', { timeZone: response.business_time_zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()); const part = (type) => parts.find(item => item.type === type).value; const now = `${part('year')}-${part('month')}-${part('day')}`; setQuery(current => ({ ...current, start_date: `${now.slice(0, 7)}-01`, end_date: now })); }).catch(failure => active && setError(failure?.message || 'No fue posible cargar los filtros.')); return () => { active = false; }; }, [companyId]);
    const accountOptions = useMemo(() => (catalog?.accounts || []).map(account => ({ value: String(account.code), text: accountOptionLabel(account) })), [catalog]);
    const selectableAccountOptions = useMemo(() => accountOptions.filter(({ value }) => !query.account_codes.some(parent => value !== parent && value.startsWith(parent))), [accountOptions, query.account_codes]);
    const thirdPartyOptions = useMemo(() => (catalog?.third_parties || []).map(third => ({ value: String(third.id), text: thirdPartyOptionLabel(third) })), [catalog]);
    const selectedAccounts = useMemo(() => (catalog?.accounts || []).filter(item => query.account_codes.includes(String(item.code))), [catalog, query.account_codes]);
    const selectedThirdParties = useMemo(() => (catalog?.third_parties || []).filter(item => query.third_party_ids.includes(String(item.id))), [catalog, query.third_party_ids]);
    const view = useMemo(() => buildLedgerView(report?.rows || [], report?.filters?.grouping), [report]);
    const filterDescription = useMemo(() => `Cuentas: ${selectedAccounts.length ? selectedAccounts.map(accountOptionLabel).join(', ') : 'todas'} · Terceros: ${selectedThirdParties.length ? selectedThirdParties.map(thirdPartyOptionLabel).join(', ') : 'todos'} · Saldos finales en cero: ${query.include_zero ? 'incluidos' : 'excluidos'}. Los filtros adicionales están disponibles en los encabezados de la tabla.`, [query.include_zero, selectedAccounts, selectedThirdParties]);
    const tableRows = useMemo(() => view.rows.map((row, index) => ({
        ...row,
        id: `${row.kind}-${index}`,
        // La columna conserva cuenta y tercero como valores de filtro, pero las
        // líneas de movimiento no repiten visualmente la jerarquía ya mostrada.
        group: row.kind === 'movement' ? [row.account, row.third] : row.concept,
        date: row.date ? formatLedgerDate(row.date) : '',
        debit: formatLedgerMoney(row.debit), credit: formatLedgerMoney(row.credit), balance: formatLedgerMoney(row.balance)
    })), [view.rows]);
    const generate = async () => { if (!query.start_date || !query.end_date || query.start_date > query.end_date) return setError('Selecciona un rango de fechas válido.'); setLoading(true); setError(''); try { const response = await postLedger({ ...query, company_id: companyId }); setReport({ ...response, time_zone: catalog.business_time_zone, filter_description: filterDescription }); } catch (failure) { setError(failure?.message || 'No fue posible generar el Libro Auxiliar.'); } finally { setLoading(false); } };
    const download = async (format) => { try { if (format === 'xlsx') return parseToXlsx(ledgerExportRows(report, view.rows), true, ledgerExportColumns.map(header => ({ header, key: header })), `Libro_Auxiliar_${query.start_date}`); const { default: Pdf } = await import('jspdf'); createLedgerPdf(Pdf, report, view.rows).save(`Libro_Auxiliar_${query.start_date}_${query.end_date}.pdf`); } catch { setError('No fue posible exportar el informe.'); } };
    const renderers = {
        group: ({ value, info }) => <span className={`auxiliaryLedgerCell auxiliaryLedgerCell-${info.kind}`}>{info.kind === 'movement' ? '—' : value}</span>,
        concept: ({ value, info }) => <span className={`auxiliaryLedgerCell auxiliaryLedgerCell-${info.kind}`}>{['group', 'subgroup'].includes(info.kind) ? '—' : value}</span>,
        debit: ({ value, info }) => <span className={`auxiliaryLedgerAmount auxiliaryLedgerCell-${info.kind}`}>{value}</span>,
        credit: ({ value, info }) => <span className={`auxiliaryLedgerAmount auxiliaryLedgerCell-${info.kind}`}>{value}</span>,
        balance: ({ value, info }) => <span className={`auxiliaryLedgerAmount auxiliaryLedgerCell-${info.kind}`}>{value}</span>
    };
    return <main className="reportAuxiliaryLedger ReportDocument">
        <header className="auxiliaryLedgerHeader"><div><BoldTitle text="Libro Auxiliar"/><DescriptionSpan text="Detalle cronológico por cuenta y tercero con saldo inicial y saldo acumulado."/></div></header>
        {error && <p className="auxiliaryLedgerNotice" role="alert">{error}</p>}
        {!catalog ? <LoadingSpace title="Cargando filtros contables" description="Consultando la compañía activa…"/> : <>
            <section className="auxiliaryLedgerControls" aria-label="Filtros del Libro Auxiliar"><SearchBar placeholder="Buscar en el informe" value={search} action={setSearch}/><div className="auxiliaryLedgerRange"><FormInput type="date" title="Fecha inicial" value={query.start_date} max={query.end_date} action={(value) => change('start_date', value)} disabled={loading}/><FormInput type="date" title="Fecha final" value={query.end_date} min={query.start_date} action={(value) => change('end_date', value)} disabled={loading}/></div><SearchinList title="Cuentas" placeHolder="Buscar y seleccionar cuentas" list={selectableAccountOptions} value={query.account_codes} action={applyAccountSelection} multiple keepOpenOnMultiple canClear/><SearchinList title="Terceros" placeHolder="Buscar y seleccionar terceros" list={thirdPartyOptions} value={query.third_party_ids} action={applyCumulativeSelection('third_party_ids')} multiple keepOpenOnMultiple canClear/><SelectOptions title="Agrupación" defaultValue value={query.grouping === 'account' ? 'Auxiliar por cuenta' : 'Auxiliar por tercero'} options={['Auxiliar por cuenta', 'Auxiliar por tercero']} action={(value) => change('grouping', value === 'Auxiliar por tercero' ? 'third_party' : 'account')}/><FormButton text="Generar informe" onClick={generate} loading={loading} disabled={loading}/></section>
            <section className="auxiliaryLedgerFilters"><CheckSquare title="Incluir saldos finales en cero" checked={query.include_zero} action={(value) => change('include_zero', value)}/></section>
            <p className="auxiliaryLedgerHelp">El rango usa la fecha comercial de la compañía ({catalog.business_time_zone}). Usa el ícono de filtro de cada encabezado para cuentas, terceros y documentos.</p>
            {loading ? <LoadingSpace title="Generando Libro Auxiliar" description="Calculando saldos iniciales, movimientos y acumulados…"/> : report && <><header className="auxiliaryLedgerSummary"><div className="auxiliaryLedgerCompany"><strong>{report.company.name}</strong><span>NIT {report.company.number}</span><span>Período: <b>{formatLedgerDate(query.start_date)} — {formatLedgerDate(query.end_date)}</b></span></div><div className="auxiliaryLedgerActions"><FormButton text="Excel" onClick={() => download('xlsx')} disabled={!tableRows.length}/><FormButton text="PDF" onClick={() => download('pdf')} disabled={!tableRows.length}/></div></header><div className="auxiliaryLedgerMetrics"><span><small>Movimientos</small><b>{view.totals.movements}</b></span><span><small>Auxiliares</small><b>{view.totals.pairs}</b></span><span><small>Débitos</small><b>{formatLedgerMoney(view.totals.debit)}</b></span><span><small>Créditos</small><b>{formatLedgerMoney(view.totals.credit)}</b></span></div><p className="auxiliaryLedgerApplied">{report.filter_description}</p><section className="auxiliaryLedgerTable sgaTreasury"><UniversalTable columns={columns} results={tableRows} searchValue={search} Row={UniversalRow} getRowKey={(row) => row.id} rowHeight={52} height="min(58vh, 640px)" rowProps={{ renderers }} emptyMessage="No hay movimientos para los filtros seleccionados."/></section><footer>Generado por {report.generated_by} · {new Intl.DateTimeFormat('es-CO', { timeZone: report.time_zone, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(report.generated_at))} · {report.time_zone}</footer></>}
        </>}
    </main>;
}
