import { useMemo } from 'react';
import './TableCashBoxClose.css';
import { UserCard } from '../components/UserCard';
import { formatDate, moneyFormat } from '../../../utils/functions';
import { useAlert } from '../../../context/context';
import { CashRegisterReport } from './reports/CashRegisterReport';
import { UniversalTable } from './universalTable';

const cashCloseColumns = [
    { key: 'responsable', label: 'Responsable', minWidth: '12rem' },
    { key: 'cashBox_name', label: 'Caja' },
    { key: 'initialBalance', label: 'Saldo inicial' },
    { key: 'actual_balance', label: 'Saldo actual' },
    { key: 'expectedBalance', label: 'Saldo final' },
    { key: 'opening_time', label: 'Fecha de inicio', minWidth: '11rem' },
    { key: 'closing_time', label: 'Fecha de cierre', minWidth: '11rem' },
    { key: 'status', label: 'Estado' }
];

const renderMoney = ({ value }) => <span className="cashCloseAmount">{moneyFormat(value)}</span>;
const renderDate = ({ value }) => <span>{value ? formatDate(value, !String(value).includes('T')) : '—'}</span>;

function CashCloseResponsable({ value, info }) {
    const { popInAlert } = useAlert();
    const openReport = (event) => {
        event.stopPropagation();
        popInAlert(<CashRegisterReport shift_id={info.id} />);
    };
    return (
        <span
            className="cashCloseDetail"
            role="button"
            tabIndex={0}
            aria-label={`Ver cierre de ${value || 'responsable'} en ${info.cashBox_name || 'caja'}`}
            onClick={openReport}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openReport(event);
                }
            }}
        >
            <UserCard name={value} imgSrc={info.user_img} />
        </span>
    );
}

const renderers = {
    responsable: CashCloseResponsable,
    initialBalance: renderMoney,
    actual_balance: renderMoney,
    expectedBalance: renderMoney,
    opening_time: renderDate,
    closing_time: renderDate
};

export function TableCashBoxClose({ columns, info = [], searchValue = '', loading = false, onResultsChange }) {
    const { popInAlert } = useAlert();
    const visibleColumns = useMemo(() => columns
        ? cashCloseColumns.filter((column) => columns.includes(column.label))
        : cashCloseColumns, [columns]);
    const filteredInfo = useMemo(() => {
        const search = searchValue.trim().toLowerCase();
        return Array.isArray(info) ? info.filter((row) => !search || Object.values(row).some((value) => (
            String(value ?? '').toLowerCase().includes(search)
        ))) : [];
    }, [info, searchValue]);

    return (
        <div className="TableCashBoxClose sgaTreasury">
            <UniversalTable
                columns={visibleColumns}
                results={filteredInfo}
                loading={loading}
                height="100%"
                getRowKey={(row) => row.id}
                onResultsChange={onResultsChange}
                rowProps={{
                    renderers,
                    onRowClick: (row) => popInAlert(<CashRegisterReport shift_id={row.id} />)
                }}
                emptyMessage="No hay cierres de caja para mostrar"
            />
        </div>
    );
}
