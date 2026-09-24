import { useMemo, useState } from 'react';
import { BoldTitle } from '../../../../Facturation/Facturation/src/modules/userApp/components/BoldTitle';
import { PathLocation } from '../../../../Facturation/Facturation/src/modules/userApp/components/PathLocation';
import { SearchBar } from '../../../../Facturation/Facturation/src/modules/userApp/components/SearchBar';
import { ButtonDownload } from '../../../../Facturation/Facturation/src/modules/userApp/components/ButtonDownload';
import { TagIndicator } from '../../../../Facturation/Facturation/src/modules/userApp/components/TagIndicator';
import { LoadingSpace } from '../../../../Facturation/Facturation/src/modules/userApp/containers/LoadingSpace';
import { DocumentPreview } from '../../../../Facturation/Facturation/src/modules/userApp/containers/Alerts/DocumentPreview';
import { ProcessStatusAlert } from '../../../../Facturation/Facturation/src/modules/userApp/containers/Alerts/ProcessStatusAlert';
import { UniversalTable } from '../../../../Treasury/SGA - Treasuty/src/modules/userApp/containers/universalTable';
import { UniversalRow } from '../../../../Treasury/SGA - Treasuty/src/modules/userApp/components/universalRow';
import { RangeDate } from '../../../../Treasury/SGA - Treasuty/src/modules/userApp/components/RangeDate';
import { useOtpProductionReport } from '../hooks/useOtpProductionReport';
import { getOtpColumns, exportOtpRows, filterOtpRows } from '../data/otpReport.mjs';
import './otpProductionReport.css';

const commitmentTypes = { 'A tiempo': 'active', 'Cerca de vencer': 'suspended', Vencido: 'disabled', 'Sin fecha': 'info' };

export function OtpProductionReport({ appInfo, useAlert, showClient = true }) {
    const { popInAlert } = useAlert();
    const [search, setSearch] = useState('');
    const [filteredRows, setFilteredRows] = useState([]);
    const [dateRange, setDateRange] = useState({ minDate: '', maxDate: '' });
    const columns = useMemo(() => getOtpColumns(showClient), [showClient]);
    const exportColumns = useMemo(() => columns.map(({ label }) => label), [columns]);
    const searchLabel = showClient ? 'Buscar OTP, OP, orden o cliente' : 'Buscar OTP, OP u orden';
    const report = useOtpProductionReport(appInfo?.company_id, dateRange, showClient);
    const visibleRows = useMemo(() => filterOtpRows(report.rows, search, columns), [report.rows, search, columns]);
    const downloadRows = useMemo(() => exportOtpRows(filteredRows, columns), [filteredRows, columns]);
    const processLink = (id, label) => id
        ? <button type="button" className="otpProductionReportLink" onClick={() => popInAlert(<ProcessStatusAlert instance_id={id} />)}>{label || '—'}</button>
        : <span>—</span>;
    const renderers = {
        ...Object.fromEntries(columns.map(({ key }) => [key, ({ value }) => <span title={String(value ?? '')}>{value ?? '—'}</span>])),
        otpIdentifier: ({ info }) => processLink(info.instanceId, info.otpIdentifier),
        parentIdentifier: ({ info }) => processLink(info.parentInstanceId, info.parentIdentifier),
        clientOrder: ({ info }) => info.clientOrderId
            ? <button type="button" className="otpProductionReportLink" onClick={() => popInAlert(<DocumentPreview data={{ doc_id: info.clientOrderId, doc_type: 'Client Order', ownSerial: info.clientOrderSerial }} />)}>{info.clientOrder}</button>
            : <span>Sin orden asociada</span>,
        commitment: ({ value }) => <TagIndicator title={value} type={commitmentTypes[value] || 'info'} icon={null} desc={`Compromiso: ${value}`} />,
        productionStates: ({ value }) => <TagIndicator title={value || 'Sin etapa'} type="info" icon={null} desc={value || 'Sin etapa'} />
    };
    return <main className="otpProductionReport ReportDocument">
        <header>
            <PathLocation />
            <BoldTitle text="Producción de proveedores por OTP" />
            <p className="otpProductionReportNote">Si una OTP agrupa varias órdenes, se muestra una fila por orden con sus medidas. El rango corresponde a la creación de la OTP.</p>
        </header>
        <div className="otpProductionReportTools">
            <label className="otpProductionReportSearch"><span className="otpProductionReportVisuallyHidden">{searchLabel}</span><SearchBar placeholder={searchLabel} value={search} action={setSearch} /></label>
            <div className="sgaTreasury"><RangeDate label="Creación de la OTP" updateRange={setDateRange} align="left" /></div>
            {!report.loading && !report.error && <ButtonDownload info={downloadRows} columns={exportColumns} title="Producción OTP NEXO 360" text="Descargar informe" />}
        </div>
        {report.error && <div role="alert" className="otpProductionReportError">{report.error}<button type="button" onClick={report.retry}>Reintentar</button></div>}
        {report.loading ? <LoadingSpace /> : !report.error && <section className="otpProductionReportTable" aria-label="Informe de producción por OTP">
            <div className="sgaTreasury"><UniversalTable columns={columns} results={visibleRows} onFilteredResultsChange={setFilteredRows} Row={UniversalRow} getRowKey={row => row.id} rowHeight={76} height="min(56vh, 580px)" rowProps={{ renderers }} emptyMessage="No hay OTP para los filtros seleccionados" /></div>
        </section>}
    </main>;
}
