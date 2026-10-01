import { useEffect, useState } from 'react';
import { useAlert, useAppInfo } from '../../../../context/context';
import { moneyFormat, postInfo } from '../../../../utils/functions';
import { BoldTitle } from '../../components/BoldTitle';
import { ButtonDownload } from '../../components/ButtonDownload';
import { ButtonMenu } from '../../components/ButtonMenu';
import { AiButton } from '../../components/ChatAiComponents/AiButton';
import { DescriptionSpan } from '../../components/DescriptionSpan';
import { PathLocation } from '../../components/PathLocation';
import { SearchBar } from '../../components/SearchBar';
import { DocumentPreview } from '../Alerts/DocumentPreview';
import { ProcessStatusAlert } from '../Alerts/ProcessStatusAlert';
import { UniversalTable } from '../universalTable';
import { RangeDate } from '../../components/RangeDate';
import './SalesReport.css';
import './ReportDocuments.css';

const todayDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const monthStart = () => `${todayDate().slice(0, 7)}-01`;
const numberValue = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const formatMoney = ({ value }) => <span>{moneyFormat(numberValue(value))}</span>;
const totalMoney = (rows) => `$ ${moneyFormat(rows.reduce((total, row) => total + numberValue(row.total), 0))}`;

function InvoiceNumberCell({ value, info }) {
    const { popInAlert } = useAlert();
    return (
        <button
            type="button"
            className="salesReportInvoiceLink"
            aria-label={`Abrir representación gráfica de la factura #${value}`}
            onClick={(event) => {
                event.stopPropagation();
                popInAlert(<DocumentPreview data={{
                    doc_id: info.id,
                    doc_type: 'Sell Invoice',
                    ownSerial: value,
                    created_at: info.created_at
                }} />);
            }}
        >#{value}</button>
    );
}

function ProcessInstanceCell({ value, info }) {
    const { popInAlert } = useAlert();

    if (!info.instance_id || !value) return <span>{value || '—'}</span>;

    return (
        <button
            type="button"
            className="salesReportInvoiceLink"
            aria-label={`Abrir proceso ${value}`}
            onClick={(event) => {
                event.stopPropagation();
                popInAlert(<ProcessStatusAlert instance_id={info.instance_id} />);
            }}
        >{value}</button>
    );
}

const salesColumns = [
    { key: 'ownSerial', label: 'Factura', minWidth: '8rem' },
    { key: 'process_label', label: 'Proceso', minWidth: '9rem' },
    { key: 'electronic_invoice_number', label: 'Factura Electrónica', minWidth: '11rem' },
    { key: 'thirdparty_name', label: 'Tercero', minWidth: '12rem' },
    { key: 'description', label: 'Descripción', minWidth: '14rem' },
    { key: 'total', label: 'Valor', minWidth: '10rem', total: totalMoney },
    { key: 'business_date', label: 'Fecha', minWidth: '9rem' },
    { key: 'store_name', label: 'Tienda', minWidth: '9rem' },
    { key: 'cost_center_name', label: 'Centro de Costo', minWidth: '11rem' },
    { key: 'user_name', label: 'Creado por', minWidth: '10rem' }
];

const salesRenderers = {
    ownSerial: InvoiceNumberCell,
    process_label: ProcessInstanceCell,
    total: formatMoney
};
const exportColumns = salesColumns.map(({ key, label }) => ({ header: label, key }));

export function SalesReport() {
    const { appInfo } = useAppInfo();
    const [info, setInfo] = useState([]);
    const [visibleRows, setVisibleRows] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [startDate, setStartDate] = useState(monthStart);
    const [endDate, setEndDate] = useState(todayDate);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        let active = true;
        const loadSales = async () => {
            setLoading(true);
            setLoadError('');
            try {
                const response = await postInfo('/facturation/getMonthlySalesReport', {
                    company_id: appInfo.company_id,
                    start_date: startDate,
                    end_date: endDate
                });
                if (!response?.[0] || !Array.isArray(response[1])) {
                    throw new Error('Respuesta no válida del informe de ventas');
                }
                if (active) setInfo(response[1]);
            } catch {
                if (active) {
                    setInfo([]);
                    setLoadError('No se pudieron cargar las ventas. Revisa el periodo e inténtalo de nuevo.');
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        if (appInfo?.company_id && startDate && endDate) loadSales();
        return () => { active = false; };
    }, [appInfo?.company_id, startDate, endDate]);

    return (
        <div className="SalesReport ReportDocument sgaTreasury">
            <PathLocation />
            <div className="headReport">
                <BoldTitle text="Informe de ventas" />
                <DescriptionSpan text="Consulta las facturas de venta y el valor vendido durante el periodo seleccionado." />
            </div>

            <div className="settingsReport salesReportSettings">
                <SearchBar placeholder="Buscar factura, tercero u OT" action={setSearchValue} value={searchValue} />
                <RangeDate
                    label="Rango de ventas"
                    value={{ from: startDate, to: endDate }}
                    updateRange={({ minDate, maxDate }) => {
                        setStartDate(minDate);
                        setEndDate(maxDate);
                    }}
                    maxDate={todayDate()}
                    align="left"
                />
                <ButtonMenu title="Agregar a favoritos" children={<i className="fa-regular fa-star" aria-hidden="true" />} noRotate />
                <AiButton
                    attached={visibleRows}
                    sugerence={[
                        { text: '¿Cuánto se vendió en este periodo?', context: 'Facturation - Informe de ventas' },
                        { text: 'Analiza estas facturas de venta', context: 'Facturation - Informe de ventas' }
                    ]}
                />
                <ButtonDownload info={visibleRows} columns={exportColumns} title="Informe_de_ventas" />
            </div>

            {loadError && <p className="salesReportError" role="alert">{loadError}</p>}
            <div className="SpaceReport salesReportTable">
                <UniversalTable
                    columns={salesColumns}
                    results={info}
                    searchValue={searchValue}
                    loading={loading}
                    height={'60vh'}
                    getRowKey={(row) => row.id}
                    onResultsChange={setVisibleRows}
                    rowProps={{ renderers: salesRenderers }}
                    emptyMessage={loadError || 'No hay facturas de venta para el periodo seleccionado'}
                />
            </div>
        </div>
    );
}
