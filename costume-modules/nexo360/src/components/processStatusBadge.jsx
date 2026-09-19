import "./processStatusBadge.css";

const statusTone = (status = "") => {
    const normalized = status.toLowerCase();
    if (normalized.includes("vencido") || normalized.includes("rechazado")) return "danger";
    if (normalized.includes("aprobado") || normalized.includes("terminado") || normalized.includes("entregado")) return "success";
    if (normalized.includes("producción") || normalized.includes("proceso")) return "info";
    if (normalized.includes("bloqueado") || normalized.includes("pendiente")) return "warning";
    return "neutral";
};

export function ProcessStatusBadge({ status }) {
    return <span className={`processStatusBadge processStatusBadge${statusTone(status)}`}>{status || "Sin estado"}</span>;
}
