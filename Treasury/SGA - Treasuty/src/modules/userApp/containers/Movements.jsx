// Movements.jsx
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { TableDetailTreasury } from '../components/TableDetailTreasury';
import { SearchBar } from '../components/SearchBar';
import { SelectOptions } from '../components/SelectOptions';
import './Movements.css';

export function Movements() {
    const navigate = useNavigate();
    const params = useParams();
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    
    const handleNavigate = (path) => {
        navigate(`/SGA_management/${params.company_key}/${params.user_key}/movements/${path}`);
    };

    const handleViewHistory = () => {
        handleNavigate('details');
    };

    const handleViewStats = () => {
        console.log('Ver todas las estadísticas');
    };

    const handleCopyMovement = (id) => {
        console.log('Copiar movimiento:', id);
    };

    const toggleViewMode = () => {
        setViewMode(viewMode === 'grid' ? 'list' : 'grid');
    };

    const movements = [
        {
            id: 1,
            name: "Caja 1",
            description: "Caja principal",
            type: "Ingreso",
            concepto: "Venta al contado",
            negocio: "Tienda Principal",
            centroCosto: "Caja Central",
            fecha: "06/01/26 3:50 pm",
            monto: "$100.000.000",
            balance: -10000,
            icon: <i className="fa-regular fa-copy" style={{color: "var(--primary)"}}/>,
            action: handleCopyMovement
        },
        {
            id: 2,
            name: "Tienda 1",
            description: "Tienda del norte",
            type: "Gasto",
            concepto: "Compra de insumos",
            negocio: "Tienda Norte",
            centroCosto: "Compras",
            fecha: "06/01/26 3:50 pm",
            monto: "$100.000.000",
            balance: 10000,
            icon: <i className="fa-regular fa-copy" style={{color: "var(--primary)"}}/>,
            action: handleCopyMovement
        },
        {
            id: 3,
            name: "Caja 2",
            description: "Caja secundaria",
            type: "Ingreso",
            concepto: "Pago cliente",
            negocio: "Tienda Sur",
            centroCosto: "Caja Secundaria",
            fecha: "06/01/26 3:50 pm",
            monto: "$100.000.000",
            balance: -10000,
            icon: <i className="fa-regular fa-copy" style={{color: "var(--primary)"}}/>,
            action: handleCopyMovement
        },
        {
            id: 4,
            name: "Caja 1",
            description: "Caja principal",
            type: "Ingreso",
            concepto: "Depósito bancario",
            negocio: "Tienda Principal",
            centroCosto: "Caja Central",
            fecha: "06/01/26 3:50 pm",
            monto: "$100.000.000",
            balance: 10000,
            icon: <i className="fa-regular fa-copy" style={{color: "var(--primary)"}}/>,
            action: handleCopyMovement
        },
    ];

    const columns = [
        {  key: "card" },
        {  key: "type" },
        {  key: "concepto" },
        {  key: "negocio" },
        {  key: "centroCosto" },
        {  key: "fecha" },
        {  key: "monto" },
        { key: "balance" }
    ];

    return (
        <div className="Movements">
            <div className="HeadMovements">
                <BoldTitle text="Movimientos" />
                <div className="descriptionRow">
                    <DescriptionSpan text="Analiza, gestiona y parametriza los módulos de tu empresa" />
                    <div className="viewModeButton" onClick={toggleViewMode} title={`Cambiar a vista ${viewMode === 'grid' ? 'lista' : 'cuadrícula'}`}>
                        <i className={viewMode === 'grid' ? "fa-solid fa-bars" : "fa-solid fa-table-cells-large"} />
                    </div>
                </div>
            </div>

            <div className="TableMovements">
                <TableDetailTreasury
                    data={movements}
                    columns={columns}
                    search={search}
                />
            </div>

            <div className="viewAllLinkContainer">
                <span className="viewAllLink" onClick={handleViewHistory}>
                    Ver todos los movimientos
                    <i className="fa-solid fa-arrow-right arrowIcon"></i>
                </span>
            </div>
            
            {/* Sección de gráficas */}
            <div className="graphsSection">
                
            </div>
            
            <div className="viewStatsLinkContainer">
                <span className="viewStatsLink" onClick={handleViewStats}>
                    Ver todas las estadísticas
                    <i className="fa-solid fa-arrow-right arrowIcon"></i>
                </span>
            </div>
        </div>
    );
}