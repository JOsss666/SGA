import "./processMetricFilter.css";

const metrics = [
    ["all", "Ordenes activas", "total", "Mostrar todas"],
    ["unassigned", "Por asignar", "unassigned", "Requieren gestión"],
    ["active", "En producción", "active", "Con proveedor activo"],
    ["approval", "Por aprobar", "approval", "Terminadas por proveedor"],
    ["overdue", "Vencidas", "overdue", "Fuera del compromiso"]
];

export function ProcessMetricFilter({ FormButton, totals, value, onChange }) {
    return <section className="processMetricFilter" aria-label="Filtros rápidos del proceso">
        {metrics.map(([key, label, totalKey, description]) => <FormButton
            key={key}
            text={label}
            className={value === key ? "processMetricFilterActive" : ""}
            onClick={() => onChange(key)}
        ><strong>{totals[totalKey]}</strong><small>{description}</small></FormButton>)}
    </section>;
}
