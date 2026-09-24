import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAlert, usePreview } from '../../../context/context';
import { formatDate, moneyFormat } from '../../../utils/functions';
import { UserCard } from '../components/UserCard';
import { DocumentPreview } from './Alerts/DocumentPreview';
import { UniversalTable } from './universalTable';
import './tableReportTransactions.css';

const columns = [
    { key: 'identifier', label: 'ID' },
    { key: 'documentDate', label: 'Fecha Documento' },
    { key: 'doc_type', label: 'Tipo Doc' },
    { key: 'concept', label: 'Concepto' },
    { key: 'subTotal', label: 'Subtotal' },
    { key: 'total', label: 'Valor' },
    { key: 'store_name', label: 'Tienda' },
    { key: 'thirdparty_name', label: 'Tercero' },
    { key: 'bussines_name', label: 'Negocio' },
    { key: 'costcenter_name', label: 'Centro de costo' },
    { key: 'status', label: 'Estado' },
    { key: 'user_name', label: 'Creada por' },
    { key: 'creationDate', label: 'Fecha creación' },
    { key: 'id', label: 'Ver Detalles', sortable: false, filterable: false }
];

const renderMoney = ({ value }) => (
    <span className="transactionAmount">{value == null || value === '' ? '—' : `$ ${moneyFormat(value)}`}</span>
);

export function TableReportTransactions({ info = [], loading = false }) {
    const navigate = useNavigate();
    const { popInAlert } = useAlert();
    const { setPreviewInfo } = usePreview();
    const rows = useMemo(() => info.map((transaction) => ({
        ...transaction,
        identifier: `${transaction.docType ?? ''}# ${transaction.ownSerial ?? transaction.id}`,
        concept: transaction.type === 'payment' ? `Pago ${transaction.payment_name ?? ''}` : transaction.concept_name,
        documentDate: formatDate(transaction.created_at ?? undefined, true),
        creationDate: formatDate(transaction.created_at ?? undefined, true)
    })), [info]);

    const renderers = {
        identifier: ({ value, info: row }) => (
            <button
                type="button"
                className="transactionLink"
                onClick={(event) => {
                    event.stopPropagation();
                    const document = { ...row, type: 'Document' };
                    setPreviewInfo(document);
                    popInAlert(<DocumentPreview data={document} />);
                }}
                aria-label={`Ver documento ${value}`}
            >{value}</button>
        ),
        subTotal: renderMoney,
        total: renderMoney,
        thirdparty_name: ({ value, info: row }) => <UserCard name={value} imgSrc={row.thirdparty_img} />,
        user_name: ({ value, info: row }) => <UserCard name={value} imgSrc={row.user_img} />,
        id: ({ value }) => (
            <Link
                className="transactionLink"
                to={String(value)}
                onClick={(event) => event.stopPropagation()}
                aria-label={`Ver detalles de transacción ${value}`}
            >Ver Detalles</Link>
        )
    };

    return (
        <div className="tableReportTransactions sgaTreasury">
            <UniversalTable
                columns={columns}
                results={rows}
                loading={loading}
                height="100%"
                getRowKey={(row) => row.id}
                rowProps={{ renderers, onRowClick: (row) => navigate(String(row.id)) }}
                emptyMessage="No hay transacciones para mostrar"
            />
        </div>
    );
}
