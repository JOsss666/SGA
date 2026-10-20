import { useCallback, useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { useAppInfo } from '../../../context/context';
import { moneyFormat, parseToXlsx, postInfo } from '../../../utils/functions';
import { BoldTitle } from '../components/BoldTitle';
import { DescriptionSpan } from '../components/DescriptionSpan';
import { PathLocation } from '../components/PathLocation';
import { SearchBar } from '../components/SearchBar';
import { UniversalTable } from './universalTable';
import './ThirdPartyReceivables.css';

const columns = [
    { key: 'process_code', label: 'Proceso', minWidth: '8rem' },
    { key: 'instance_serial', label: 'N.º instancia', minWidth: '9rem' },
    { key: 'ownSerial', label: 'Documento', minWidth: '9rem' },
    { key: 'doc_type', label: 'Tipo', minWidth: '8rem' },
    { key: 'store_name', label: 'Bodega', minWidth: '9rem' },
    { key: 'thirdParty_id', label: 'ID tercero', minWidth: '8rem' },
    { key: 'created_at', label: 'Fecha de creación', minWidth: '10rem' },
    { key: 'due_date', label: 'Vencimiento', minWidth: '9rem' },
    { key: 'total', label: 'Total', minWidth: '9rem' },
    { key: 'paid_amount', label: 'Pagado', minWidth: '9rem' },
    { key: 'pending_amount', label: 'Pendiente', minWidth: '9rem' }
];

const exportColumns = [
    { key: 'process_code', header: 'Proceso', width: 18 },
    { key: 'instance_serial', header: 'N.º instancia', width: 18 },
    { key: 'ownSerial', header: 'Documento', width: 18 },
    { key: 'doc_type', header: 'Tipo', width: 16 },
    { key: 'store_name', header: 'Bodega', width: 20 },
    { key: 'thirdParty_id', header: 'ID tercero', width: 18 },
    { key: 'created_at', header: 'Fecha de creación', width: 20 },
    { key: 'due_date', header: 'Vencimiento', width: 18 },
    { key: 'total', header: 'Total', type: 'number', numFmt: '#,##0.00', width: 16 },
    { key: 'paid_amount', header: 'Pagado', type: 'number', numFmt: '#,##0.00', width: 16 },
    { key: 'pending_amount', header: 'Pendiente', type: 'number', numFmt: '#,##0.00', width: 16 }
];

const parseAmount = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
};

const formatCurrency = (value) =>
    `$ ${moneyFormat(parseAmount(value).toFixed(2))}`;

const formatDate = (value) => {
    if (!value) return '—';

    const text = String(value);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
        ? new Date(`${text}T00:00:00`)
        : new Date(text);

    if (Number.isNaN(date.getTime())) return text;
    return date.toLocaleDateString('es-CO');
};

const CurrencyCell = ({ value }) => <span>{formatCurrency(value)}</span>;
const DateCell = ({ value }) => <span>{formatDate(value)}</span>;

const rowRenderers = {
    total: CurrencyCell,
    paid_amount: CurrencyCell,
    pending_amount: CurrencyCell,
    created_at: DateCell,
    due_date: DateCell
};

const getExportRows = (rows) =>
    rows.map((row) => ({
        ...row,
        created_at: formatDate(row.created_at),
        due_date: formatDate(row.due_date)
    }));

export function ThirdPartyReceivables() {
    const { appInfo } = useAppInfo();
    const [rows, setRows] = useState([]);
    const [filteredRows, setFilteredRows] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);

    const loadReceivables = useCallback(async () => {
        const companyId = appInfo?.company_id;

        if (!companyId) {
            setRows([]);
            setLoading(false);
            setError('No se encontró la empresa de la sesión.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await postInfo('/treasury/getThirdPartyPortfolio', {
                company_id: companyId
            });

            if (!Array.isArray(response)) {
                throw new Error('La respuesta del servidor no tiene el formato esperado.');
            }

            setRows(Array.isArray(response[1]) ? response[1] : []);
        } catch (loadError) {
            console.error('Error al cargar cuentas por cobrar:', loadError);
            setRows([]);
            setError('No pudimos cargar las cuentas por cobrar. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    }, [appInfo?.company_id]);

    useEffect(() => {
        loadReceivables();
    }, [loadReceivables]);

    const downloadXlsx = async () => {
        await parseToXlsx(
            getExportRows(filteredRows),
            true,
            exportColumns,
            'Cuentas_por_cobrar',
            { reportName: 'Cuentas por cobrar' }
        );
    };

    const downloadPdf = () => {
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        const margin = 10;
        const rowHeight = 8;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const columnWidth = (pageWidth - margin * 2) / exportColumns.length;

        const fitText = (value, maxWidth) => {
            let text = String(value ?? '—').replace(/\s+/g, ' ');

            while (text.length > 1 && pdf.getTextWidth(text) > maxWidth) {
                text = `${text.slice(0, -2)}…`;
            }

            return text;
        };

        const drawHeader = () => {
            let y = margin;

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(13);
            pdf.text('Cuentas por cobrar', margin, y);
            y += 7;

            pdf.setFontSize(6);
            pdf.setFillColor(38, 38, 38);
            pdf.setTextColor(255, 255, 255);

            exportColumns.forEach((column, index) => {
                const x = margin + index * columnWidth;
                pdf.rect(x, y, columnWidth, rowHeight, 'F');
                pdf.text(
                    fitText(column.header, columnWidth - 3),
                    x + 1.5,
                    y + 5.2
                );
            });

            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'normal');
            return y + rowHeight;
        };

        let y = drawHeader();

        getExportRows(filteredRows).forEach((row) => {
            if (y + rowHeight > pageHeight - margin) {
                pdf.addPage();
                y = drawHeader();
            }

            exportColumns.forEach((column, index) => {
                const x = margin + index * columnWidth;
                const value = [
                    'total',
                    'paid_amount',
                    'pending_amount'
                ].includes(column.key)
                    ? formatCurrency(row[column.key])
                    : row[column.key];

                pdf.setDrawColor(210, 215, 220);
                pdf.rect(x, y, columnWidth, rowHeight);
                pdf.text(
                    fitText(value, columnWidth - 3),
                    x + 1.5,
                    y + 5.2
                );
            });

            y += rowHeight;
        });

        pdf.save('Cuentas_por_cobrar.pdf');
    };

    return (
        <section className="thirdPartyReceivables">
            <PathLocation />

            <header className="thirdPartyReceivablesHeader">
                <div>
                    <BoldTitle text="Cuentas por cobrar" />
                    <DescriptionSpan text="Consulta las obligaciones pendientes registradas para la empresa." />
                </div>

                <span className="thirdPartyReceivablesCount">
                    {rows.length} registros
                </span>
            </header>

            <div className="thirdPartyReceivablesToolbar">
                <SearchBar
                    placeholder="Buscar en el informe"
                    value={searchValue}
                    action={setSearchValue}
                />

                <div className="thirdPartyReceivablesDownload">
                    <button
                        type="button"
                        className="thirdPartyReceivablesDownloadButton"
                        aria-expanded={showDownloadMenu}
                        onClick={() => setShowDownloadMenu((current) => !current)}
                    >
                        Descargar
                        <i className="fa-solid fa-arrow-down" aria-hidden="true" />
                    </button>

                    {showDownloadMenu && (
                        <div className="thirdPartyReceivablesDownloadMenu">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDownloadMenu(false);
                                    downloadXlsx();
                                }}
                            >
                                <i className="fa-regular fa-file-excel" aria-hidden="true" />
                                XLSX
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowDownloadMenu(false);
                                    downloadPdf();
                                }}
                            >
                                <i className="fa-regular fa-file-pdf" aria-hidden="true" />
                                PDF
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="thirdPartyReceivablesError" role="alert">
                    <span>{error}</span>
                    <button type="button" onClick={loadReceivables}>
                        Reintentar
                    </button>
                </div>
            )}

            <div className="thirdPartyReceivablesTable">
                <UniversalTable
                    columns={columns}
                    results={rows}
                    searchValue={searchValue}
                    loading={loading}
                    disabled={loading}
                    getRowKey={(row, index) =>
                        row.id ?? row.document_id ?? `${row.thirdParty_id}-${index}`
                    }
                    rowProps={{ renderers: rowRenderers }}
                    onFilteredResultsChange={setFilteredRows}
                    emptyMessage="No hay cuentas por cobrar para mostrar"
                />
            </div>
        </section>
    );
}