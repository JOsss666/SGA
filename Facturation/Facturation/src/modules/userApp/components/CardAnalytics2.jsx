import './CardAnalytics2.css';

export const reportTypeConfig = {
    documentos: {
        icon: "fa-regular fa-file-lines",
        bgColor: "#E3F0FF",
        iconColor: "#2C7BE5"
    },
    transacciones: {
        icon: "fa-solid fa-arrow-right-arrow-left",
        bgColor: "#FFF3E0",
        iconColor: "#E67E22"
    },
    inventarios: {
        icon: "fa-solid fa-boxes",
        bgColor: "#E8F5E9",
        iconColor: "#2E7D32"
    },
    contabilidad: {
        icon: "fa-solid fa-file-invoice-dollar",
        bgColor: "#E0F7E9",
        iconColor: "#00A86B"
    },
    procesos: {
        icon: "fa-solid fa-diagram-project",
        bgColor: "#F3E5F5",
        iconColor: "#7B1FA2"
    },
    usuarios: {
        icon: "fa-solid fa-users",
        bgColor: "#FBE9E7",
        iconColor: "#D84315"
    },
    caja: {
        icon: "fa-solid fa-cash-register",
        bgColor: "#E0F2FE",
        iconColor: "#0369A1"
    },
    ventas: {
        icon: "fa-solid fa-chart-line",
        bgColor: "#FEF3C7",
        iconColor: "#B45309"
    }
};

export function CardAnalytics2({ title, description, reportsCount, onClick, type, loading = false }) {
    const normalizedType = type.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const { icon, bgColor, iconColor } = reportTypeConfig[normalizedType] || reportTypeConfig.documentos;

    const formatReports = (count) => {
        if (count === 1) return "1 reporte";
        return `${count} reportes`;
    };

    return (
        <div className="CardAnalytics2" onClick={onClick}>
            <div className="card-header">
                <div className="card-icon" style={{ backgroundColor: bgColor }}>
                    <i className={icon} style={{ color: iconColor }}></i>
                </div>
                <h3 className="card-title">{title}</h3>
            </div>
            <p className="card-description">{description}</p>
            <div className="card-footer">
                <span className="reports-count">
                    {loading ? "Cargando..." : formatReports(reportsCount)}
                </span>
                <button className="go-button">
                    Ir ahora <i className="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </div>
    );
}