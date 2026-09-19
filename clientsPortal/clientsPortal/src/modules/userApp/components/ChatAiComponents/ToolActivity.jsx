import './ToolActivity.css';

// Etiquetas por nombre de función de tool, tal como las expone el backend en
// los eventos `tool` / `tool_result` del stream.
const TOOL_LABELS = Object.freeze({
    get_facturation_sell_invoices: { text: 'facturas de venta', icon: 'fa-file-invoice-dollar' },
    get_facturation_purchases: { text: 'documentos de compra', icon: 'fa-cart-shopping' },
    get_facturation_accountability: { text: 'balance contable', icon: 'fa-scale-balanced' },
    get_process_process_instances: { text: 'procesos', icon: 'fa-diagram-project' },
    get_documents: { text: 'documentos', icon: 'fa-folder-open' }
});

const describe = name => TOOL_LABELS[name] || { text: name, icon: 'fa-gear' };

export function ToolActivity({ activities = [] }) {
    if (!activities.length) return null;

    return (
        <div className="ToolActivity">
            {activities.map(activity => {
                const { text, icon } = describe(activity.name);
                const done = activity.status === 'done';
                return (
                    <span
                        key={activity.id}
                        className={`toolChip ${done ? 'toolChipDone' : 'toolChipRunning'}`}
                    >
                        <i className={`fa-solid ${done ? 'fa-check' : icon}`} />
                        {done
                            ? `${text} · ${activity.total_count ?? 0} registro${activity.total_count === 1 ? '' : 's'}`
                            : `Consultando ${text}…`}
                    </span>
                );
            })}
        </div>
    );
}

export function TypingIndicator() {
    return (
        <div className="TypingIndicator" role="status" aria-label="El asistente está escribiendo">
            <span /><span /><span />
        </div>
    );
}
