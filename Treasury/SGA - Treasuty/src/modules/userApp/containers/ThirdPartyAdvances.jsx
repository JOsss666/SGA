import { useCallback, useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import { useAppInfo } from '../../../context/context';
import { moneyFormat, parseToXlsx, postInfo } from '../../../utils/functions';
import { BoldTitle } from '../components/BoldTitle';
import { DescriptionSpan } from '../components/DescriptionSpan';
import { PathLocation } from '../components/PathLocation';
import { SearchBar } from '../components/SearchBar';
import { UniversalTable } from './universalTable';
import './ThirdPartyAdvances.css';

const columns = [
    { key: 'names', label: 'Tercero', minWidth: '14rem', flex: '1.6 1 14rem', order: 'ASC' },
    { key: 'identification_number', label: 'Identificación', minWidth: '11rem' },
    { key: 'advances_count', label: 'N.º anticipos', minWidth: '9rem' },
    { key: 'total_amount', label: 'Total recibido', minWidth: '11rem' },
    { key: 'used_amount', label: 'Aplicado', minWidth: '10rem' },
    { key: 'available_amount', label: 'Saldo a favor', minWidth: '11rem' }
];

const exportColumns = [
    { key: 'names', header: 'Tercero', width: 28 },
    { key: 'identification_number', header: 'Identificación', width: 20 },
    { key: 'advances_count', header: 'N.º anticipos', type: 'number', width: 16 },
    { key: 'total_amount', header: 'Total recibido', type: 'number', numFmt: '#,##0.00', width: 18 },
    { key: 'used_amount', header: 'Aplicado', type: 'number', numFmt: '#,##0.00', width: 16 },
    { key: 'available_amount', header: 'Saldo a favor', type: 'number', numFmt: '#,##0.00', width: 18 }
];

const parseAmount = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
};

const formatCurrency = (value) =>
    `$ ${moneyFormat(parseAmount(value).toFixed(2))}`;

const CurrencyCell = ({ value }) => <span>{formatCurrency(value)}</span>;
const CountCell = ({ value }) => <span>{parseAmount(value)}</span>;

const rowRenderers = {
    advances_count: CountCell,
    total_amount: CurrencyCell,
    used_amount: CurrencyCell,
    available_amount: CurrencyCell
};

export function ThirdPartyAdvances() {
    const { appInfo } = useAppInfo();
    const [rows, setRows] = useState([]);
    const [filteredRows, setFilteredRows] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);

    const loadAdvances = useCallback(async () => {
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
            const response = await postInfo('/treasury/getCompanyAdvances', {
                company_id: companyId
            });

            if (response?.status !== 'OK') {
                throw new Error(response?.message || 'La respuesta del servidor no tiene el formato esperado.');
            }

            setRows(Array.isArray(response.summary) ? response.summary : []);
        } catch (loadError) {
            console.error('Error al cargar anticipos y saldos a favor:', loadError);
            setRows([]);
            setError('No pudimos cargar los anticipos y saldos a favor. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    }, [appInfo?.company_id]);

    useEffect(() => {
        loadAdvances();
    }, [loadAdvances]);

    const summary = useMemo(() => filteredRows.reduce((totals, row) => ({
        total: totals.total + parseAmount(row.total_amount),
        used: totals.used + parseAmount(row.used_amount),
        available: totals.available + parseAmount(row.available_amount)
    }), { total: 0, used: 0, available: 0 }), [filteredRows]);

    const downloadXlsx = async () => {
        await parseToXlsx(
            filteredRows,
            true,
            exportColumns,
            'Anticipos_y_saldos_a_favor',
            { reportName: 'Anticipos y saldos a favor' }
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
            pdf.text('Anticipos y saldos a favor', margin, y);
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

        filteredRows.forEach((row) => {
            if (y + rowHeight > pageHeight - margin) {
                pdf.addPage();
                y = drawHeader();
            }

            exportColumns.forEach((column, index) => {
                const x = margin + index * columnWidth;
                const value = [
                    'total_amount',
                    'used_amount',
                    'available_amount'
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

        pdf.save('Anticipos_y_saldos_a_favor.pdf');
    };

    return (
        <section className="thirdPartyAdvances">
            <PathLocation />

            <header className="thirdPartyAdvancesHeader">
                <div>
                    <BoldTitle text="Anticipos y saldos a favor" />
                    <DescriptionSpan text="Consulta el saldo a favor disponible por tercero a partir de los anticipos registrados." />
                </div>

                <span className="thirdPartyAdvancesCount">
                    {rows.length} terceros
                </span>
            </header>

            <div className="thirdPartyAdvancesSummary" aria-label="Resumen de anticipos">
                <div className="thirdPartyAdvancesSummaryCard">
                    <DescriptionSpan text="Total recibido" />
                    <strong>{formatCurrency(summary.total)}</strong>
                </div>
                <div className="thirdPartyAdvancesSummaryCard">
                    <DescriptionSpan text="Aplicado" />
                    <strong>{formatCurrency(summary.used)}</strong>
                </div>
                <div className="thirdPartyAdvancesSummaryCard highlight">
                    <DescriptionSpan text="Saldo a favor disponible" />
                    <strong>{formatCurrency(summary.available)}</strong>
                </div>
            </div>

            <div className="thirdPartyAdvancesToolbar">
                <SearchBar
                    placeholder="Buscar tercero o identificación"
                    value={searchValue}
                    action={setSearchValue}
                />

                <div className="thirdPartyAdvancesDownload">
                    <button
                        type="button"
                        className="thirdPartyAdvancesDownloadButton"
                        aria-expanded={showDownloadMenu}
                        onClick={() => setShowDownloadMenu((current) => !current)}
                    >
                        Descargar
                        <i className="fa-solid fa-arrow-down" aria-hidden="true" />
                    </button>

                    {showDownloadMenu && (
                        <div className="thirdPartyAdvancesDownloadMenu">
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
                <div className="thirdPartyAdvancesError" role="alert">
                    <span>{error}</span>
                    <button type="button" onClick={loadAdvances}>
                        Reintentar
                    </button>
                </div>
            )}

            <div className="thirdPartyAdvancesTable">
                <UniversalTable
                    columns={columns}
                    results={rows}
                    searchValue={searchValue}
                    loading={loading}
                    disabled={loading}
                    getRowKey={(row, index) =>
                        row.thirdParty_id ?? `${row.identification_number}-${index}`
                    }
                    rowProps={{ renderers: rowRenderers }}
                    onFilteredResultsChange={setFilteredRows}
                    emptyMessage="No hay terceros con saldo a favor para mostrar"
                />
            </div>
        </section>
    );
}
