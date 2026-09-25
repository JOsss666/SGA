import { useMemo } from "react";
import { UserCard } from "../components/UserCard";
import { formatDate } from "../../../utils/functions";
import { UniversalTable } from "./universalTable";
import './TableHistorialInstance.css';

const historyColumns = [
    { key: 'process_name', label: 'Proceso' },
    { key: 'identifier', label: 'Instancia', minWidth: '9rem' },
    { key: 'user_name', label: 'Responsable', minWidth: '12rem' },
    { key: 'action', label: 'Accion', minWidth: '16rem' },
    { key: 'description', label: 'Descripción', minWidth: '14rem' },
    { key: 'created_at', label: 'Fecha', minWidth: '11rem' },
    { key: 'status', label: 'Estado' }
];

const renderers = {
    user_name: ({ value, info }) => (
        <div className="historyResponsible" title={value || 'Sin responsable'}>
            <UserCard name={value || '—'} imgSrc={info.user_img} />
        </div>
    ),
    action: ({ value, info }) => (
        <div className="historyTransition" title={value} aria-label={value}>
            <span className="historyStep">{info.prevstep_name || '—'}</span>
            <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            <span className="historyStep historyNextStep">{info.nextstep_name || '—'}</span>
        </div>
    ),
    description: ({ value }) => <span title={value || '---'}>{value || '---'}</span>,
    created_at: ({ value, info }) => <span>{info.created_at_local ? info.created_at_local.replace('T', ' ') : value ? formatDate(value) : '—'}</span>
};

export function TableHistorialInstance({ columns, info = [], searchValue = '', loading = false }) {
    const visibleColumns = useMemo(() => columns
        ? historyColumns.filter((column) => columns.includes(column.label))
        : historyColumns, [columns]);
    const rows = useMemo(() => (Array.isArray(info) ? info.map((entry) => ({
        ...entry,
        identifier: `${entry.process_code ?? ''}#${entry.instance_id ?? ''}`,
        action: `${entry.prevstep_name || '—'} → ${entry.nextstep_name || '—'}`
    })) : []), [info]);

    return (
        <div className="TableHistorialInstance sgaTreasury">
            <UniversalTable
                columns={visibleColumns}
                results={rows}
                searchValue={searchValue}
                loading={loading}
                getRowKey={(row, index) => row.id ?? index}
                rowProps={{ renderers }}
                emptyMessage="No hay acciones de procesos para mostrar"
            />
        </div>
    );
}
