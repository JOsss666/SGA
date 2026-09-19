import { useMemo } from 'react';
import { useAlert } from '../../../context/context';
import { ProgressBar } from '../components/ProgressBar';
import { ProcessStatusAlert } from './Alerts/ProcessStatusAlert';
import { formatDate } from '../../../utils/functions';
import { UniversalTable } from './universalTable';
import './TableReportProcesses.css';

// Columnas del informe de procesos para UniversalTable.
// El `key` apunta al valor primitivo de cada fila (para orden/filtro/búsqueda);
// el render visual se resuelve con `renderers`.
const PROCESS_COLUMNS = [
    { key: 'identifier', label: 'ID', flex: '0 0 9rem', minWidth: '8rem' },
    { key: 'process_name', label: 'Proceso' },
    { key: 'thirdParty_name', label: 'Tercero' },
    { key: 'step_name', label: 'Etapa' },
    { key: 'progress', label: 'Avance', minWidth: '9rem' },
    { key: 'delivery_date', label: 'Fecha de entrega' },
    { key: 'updated_at', label: 'Última modificación' },
    { key: 'start_date', label: 'Fecha de inicio' },
    { key: 'status', label: 'Estado' }
];

// Celdas que necesitan un elemento React (el resto usa el render por defecto).
const PROCESS_RENDERERS = {
    progress: ({ value }) => <ProgressBar progress={value} />,
    delivery_date: ({ value }) => <span>{formatDate(value)}</span>,
    updated_at: ({ value }) => <span>{formatDate(value)}</span>,
    start_date: ({ value }) => <span>{formatDate(value)}</span>
};

const computeProgress = (instance) => {
    const denominator = Number(instance.total_steps) - 1;
    if (!Number.isFinite(denominator) || denominator <= 0 || instance.current_step_order == null) return 0;
    return Number(((Number(instance.current_step_order) / denominator) * 100).toFixed(1));
};

// Transforma una instancia del backend en una fila lista para la tabla.
const toRow = (instance) => ({
    id: instance.id,
    identifier: `${instance.process_code}#${instance.ownSerial}`,
    process_name: instance.process_name,
    thirdParty_name: instance.thirdParty_name,
    step_name: instance.step_name,
    progress: computeProgress(instance),
    delivery_date: instance.delivery_date,
    updated_at: instance.updated_at,
    start_date: instance.start_date,
    status: instance.status
});

export function TableReportProcesses({ settingsReport, info = [], searchValue = '', loading = false }) {

    const { popInAlert } = useAlert();

    const rows = useMemo(() => (Array.isArray(info) ? info.map(toRow) : []), [info]);

    const rowProps = useMemo(() => ({
        renderers: PROCESS_RENDERERS,
        onRowClick: (row) => popInAlert(<ProcessStatusAlert instance_id={row.id} />),
        getRowClassName: (row) => (row.status ? `rowStatus_${row.status}` : '')
    }), [popInAlert]);

    return (
        <div className="sgaTreasury TableReportProcesses">
            <UniversalTable
                columns={PROCESS_COLUMNS}
                results={rows}
                searchValue={searchValue}
                loading={loading}
                getRowKey={(row) => row.id}
                rowProps={rowProps}
                emptyMessage="No hay procesos para mostrar"
            />
        </div>
    );
}
