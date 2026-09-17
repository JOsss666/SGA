import { useState } from "react";
import './CardReportBody.css';

export function CardReportBody({ title, description, type, onClick }) {
    const [isFavorite, setIsFavorite] = useState(false);

    const typeConfig = {
        ventas: {
            icon: "fa-solid fa-chart-line",
            color: "#61ADFF",
            text: "Ventas"
        },
        inventario: {
            icon: "fa-solid fa-boxes-stacked",
            color: "#FF9800",
            text: "Inventario"
        },
        financiero: {
            icon: "fa-solid fa-file-invoice-dollar",
            color: "#05D57E",
            text: "Financiero"
        },
        estadisticas: {
            icon: "fa-solid fa-chart-simple",
            color: "#9C27B0",
            text: "Estadísticas"
        }
    };

    const { icon, color, text } = typeConfig[type] || {
        icon: "fa-regular fa-file",
        color: "#555",
        text: "General"
    };

    const handleFavoriteClick = (e) => {
        e.stopPropagation();
        setIsFavorite(!isFavorite);
    };

    return (
        <div className="CardReportBody" onClick={onClick}>
            <div className="CardReportIcon" style={{ 
                backgroundColor: color,
                boxShadow: `0 0 1dvh ${color}`
            }}>
                <i className={icon}></i>
            </div>
            <div className="CardReportContent">
                <h3 className="CardReportTitle">{title}</h3>
                <p className="CardReportDescription">{description}</p>
                <div className="CardReportFooter">
                    <div className="CardReportActions">
                        <button 
                            className="CardReportActionBtn"
                            onClick={handleFavoriteClick}
                            title="Favorito"
                        >
                            <i className={isFavorite ? "fa-solid fa-star" : "fa-regular fa-star"}/>
                        </button>
                        <button 
                            className="CardReportActionBtn"
                            onClick={(e) => {
                                e.stopPropagation();
                                console.log('Compartir reporte');
                            }}
                            title="Compartir"
                        >
                            <i className="fa-solid fa-arrow-up-from-bracket"/>
                        </button>
                        <button 
                            className="CardReportActionBtn"
                            onClick={(e) => {
                                e.stopPropagation();
                                console.log('Descargar reporte');
                            }}
                            title="Descargar"
                        >
                            <i className="fa-solid fa-download"/>
                        </button>
                        <button 
                            className="CardReportActionBtn"
                            onClick={(e) => {
                                e.stopPropagation();
                                console.log('Comentar reporte');
                            }}
                            title="Comentar"
                        >
                            <i className="fa-regular fa-comment"/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}