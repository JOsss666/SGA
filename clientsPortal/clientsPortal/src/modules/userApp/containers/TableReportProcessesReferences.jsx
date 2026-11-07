import { useMemo } from 'react';
import { useAlert } from '../../../context/context';
import { ProgressBar } from '../components/ProgressBar';
import { TagIndicator } from '../components/TagIndicator';
import { ProcessStatusAlert } from './Alerts/ProcessStatusAlert';
import { formatDate } from '../../../utils/functions';
import { UniversalTable } from './universalTable';
import './TableReportProcesses.css';

// Clon de TableReportProcesses con una columna adicional "Referencias" que muestra
// la o las referencias del paramDoc (JSON Parametrization) ligadas al proceso.
// El `key` apunta al valor primitivo de cada fila (para orden/filtro/búsqueda);
// el render visual se resuelve con `renderers`.
const PROCESS_COLUMNS = [
    { key: 'identifier', label: 'ID', flex: '0 0 9rem', minWidth: '8rem' },
    { key: 'name', label: 'Nombre' },
    { key: 'process_name', label: 'Proceso' },
    { key: 'references', label: 'Referencias', minWidth: '12rem' },
    { key: 'storeNames', label: 'Tienda', minWidth: '12rem' },
    { key: 'storeCodes', label: 'Código', minWidth: '10rem' },
    { key: 'cities', label: 'Ciudad', minWidth: '10rem' },
    { key: 'step_name', label: 'Etapa' },
    { key: 'progress', label: 'Avance', minWidth: '9rem' },
    { key: 'delivery_date', label: 'Fecha de entrega' },
    { key: 'updated_at', label: 'Última modificación' },
    { key: 'start_date', label: 'Fecha de inicio' },
    { key: 'status', label: 'Estado' }
];

const statusTagType = (status) => {
    const normalizedStatus = String(status ?? '').trim().toLowerCase();
    if (['active', 'activo', 'open', 'en proceso'].includes(normalizedStatus)) return 'active';
    if (['pending', 'pendiente', 'por asignar'].includes(normalizedStatus)) return 'pending';
    if (['cancelled', 'canceled', 'cancelado'].includes(normalizedStatus)) return 'cancelled';
    if (['completed', 'complete', 'closed', 'cerrado', 'finalizado'].includes(normalizedStatus)) return 'success';
    if (['failed', 'fallido', 'error'].includes(normalizedStatus)) return 'failed';
    if (['disabled', 'inactivo'].includes(normalizedStatus)) return 'disabled';
    if (['expired', 'vencido'].includes(normalizedStatus)) return 'expired';
    return 'info';
};

// Celdas que necesitan un elemento React (el resto usa el render por defecto).
const PROCESS_RENDERERS = {
    progress: ({ value }) => <ProgressBar progress={value} />,
    references: ({ value }) => <span title={value}>{value || '—'}</span>,
    storeNames: ({ value }) => <span title={value}>{value || '—'}</span>,
    storeCodes: ({ value }) => <span title={value}>{value || '—'}</span>,
    cities: ({ value }) => <span title={value}>{value || '—'}</span>,
    delivery_date: ({ value }) => <span>{formatDate(value)}</span>,
    updated_at: ({ value }) => <span>{formatDate(value)}</span>,
    start_date: ({ value }) => <span>{formatDate(value)}</span>,
    status: ({ value }) => <TagIndicator title={value || 'Sin estado'} type={statusTagType(value)} desc={`Estado: ${value || 'Sin estado'}`} />
};

const computeProgress = (instance) => {
    const denominator = Number(instance.total_steps) - 1;
    if (!Number.isFinite(denominator) || denominator <= 0 || instance.current_step_order == null) return 0;
    return Number(((Number(instance.current_step_order) / denominator) * 100).toFixed(1));
};

// Normaliza las referencias del backend a un texto legible.
// El backend entrega `references_text` (string) y `references_list` (array json).
const referencesText = (instance) => {
    if (instance.references_text) return instance.references_text;
    if (Array.isArray(instance.references_list)) {
        return instance.references_list.filter(Boolean).join(', ');
    }
    return '';
};

// Transforma una instancia del backend en una fila lista para la tabla.
const toRow = (instance) => ({
    id: instance.id,
    identifier: `${instance.process_code}#${instance.ownSerial}`,
    name: instance.name ?? '',
    process_name: instance.process_name,
    references: referencesText(instance),
    storeNames: instance.store_names ?? '',
    storeCodes: instance.store_codes ?? '',
    cities: instance.cities ?? '',
    step_name: instance.step_name,
    progress: computeProgress(instance),
    delivery_date: instance.delivery_date,
    updated_at: instance.updated_at,
    start_date: instance.start_date,
    status: instance.status
});

export function TableReportProcessesReferences({ settingsReport, info = [], searchValue = '', loading = false }) {

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
                height={"70vh"}
                emptyMessage="No hay procesos para mostrar"
            />
        </div>
    );
}
