import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { CashHistoryCard } from "../components/CashHistoryCard";
import { SelectOptions } from '../components/SelectOptions';
import './CashHistory.css';

export function CashHistory() {
    const navigate = useNavigate();
    const params = useParams();
    const [search, setSearch] = useState('');
    const [selectedCashier, setSelectedCashier] = useState('Todos los Cajeros');
    const [selectedPeriod, setSelectedPeriod] = useState('Esta Semana');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    const handleViewReport = (id) => {
        navigate(`/SGA_management/${params.company_key}/${params.user_key}/cashBoxes/history/${id}`);
    };

    const columns = [
        { key: "id", label: "ID" },
        { key: "fecha", label: "FECHA / HORA" },
        { key: "cajero", label: "CAJERO RESPONSABLE" },
        { key: "esperado", label: "SALDO ESPERADO" },
        { key: "real", label: "SALDO REAL" },
        { key: "diferencia", label: "DIFERENCIA" },
        { key: "acciones", label: "ACCIONES" }
    ];

    const cierres = [
        { id: "1024", fecha: "2026-02-21T20:15:30", fechaStr: "21 Feb 2026 20:15:30", cajero: { nombre: "Juan Pérez", initials: "JP", color: "blue" }, esperado: 1250.00, real: 1235.00, diferencia: -15.00, action: handleViewReport },
        { id: "1023", fecha: "2026-02-20T19:50:12", fechaStr: "20 Feb 2026 19:50:12", cajero: { nombre: "Maria García", initials: "MG", color: "green" }, esperado: 980.50, real: 980.50, diferencia: 0.00, action: handleViewReport },
        { id: "1022", fecha: "2026-02-19T20:30:45", fechaStr: "19 Feb 2026 20:30:45", cajero: { nombre: "Carlos Ruiz", initials: "CR", color: "purple" }, esperado: 2115.00, real: 2117.50, diferencia: 2.50, action: handleViewReport },
        { id: "1021", fecha: "2026-02-18T18:45:00", fechaStr: "18 Feb 2026 18:45:00", cajero: { nombre: "Juan Pérez", initials: "JP", color: "blue" }, esperado: 1540.00, real: 1535.00, diferencia: -5.00, action: handleViewReport },
        { id: "1020", fecha: "2026-01-20T15:30:00", fechaStr: "20 Ene 2026 15:30:00", cajero: { nombre: "Ana López", initials: "AL", color: "orange" }, esperado: 3420.00, real: 3415.50, diferencia: -4.50, action: handleViewReport },
        { id: "1019", fecha: "2026-01-19T14:20:00", fechaStr: "19 Ene 2026 14:20:00", cajero: { nombre: "Carlos Ruiz", initials: "CR", color: "purple" }, esperado: 1890.00, real: 1892.00, diferencia: 2.00, action: handleViewReport },
        { id: "1018", fecha: "2026-01-18T12:10:00", fechaStr: "18 Ene 2026 12:10:00", cajero: { nombre: "Maria García", initials: "MG", color: "green" }, esperado: 2760.00, real: 2760.00, diferencia: 0.00, action: handleViewReport },
        { id: "1017", fecha: "2026-01-17T10:05:00", fechaStr: "17 Ene 2026 10:05:00", cajero: { nombre: "Juan Pérez", initials: "JP", color: "blue" }, esperado: 3950.00, real: 3940.00, diferencia: -10.00, action: handleViewReport }
    ];

    const cashierOptions = useMemo(() => {
        const names = cierres.map(c => c.cajero.nombre);
        return ['Todos los Cajeros', ...new Set(names)];
    }, [cierres]);

    const periodOptions = ['Esta Semana', 'Este Mes', 'Este Año'];

    const filterByPeriod = (cierres, period) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return cierres.filter(cierre => {
            const cierreDate = new Date(cierre.fecha);
            switch(period) {
                case 'Esta Semana': {
                    const weekAgo = new Date(today);
                    weekAgo.setDate(today.getDate() - 7);
                    return cierreDate >= weekAgo;
                }
                case 'Este Mes': {
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(today.getMonth() - 1);
                    return cierreDate >= monthAgo;
                }
                case 'Este Año': {
                    const yearAgo = new Date(today);
                    yearAgo.setFullYear(today.getFullYear() - 1);
                    return cierreDate >= yearAgo;
                }
                default: return true;
            }
        });
    };

    const filteredCierres = useMemo(() => {
        const filtered = cierres.filter(row => {
            const matchesSearch = search === '' || 
                row.id.toLowerCase().includes(search.toLowerCase()) ||
                row.cajero.nombre.toLowerCase().includes(search.toLowerCase()) ||
                row.esperado.toString().includes(search) ||
                row.real.toString().includes(search);
            const matchesCashier = selectedCashier === 'Todos los Cajeros' || 
                row.cajero.nombre === selectedCashier;
            return matchesSearch && matchesCashier;
        });
        return filterByPeriod(filtered, selectedPeriod);
    }, [cierres, search, selectedCashier, selectedPeriod]);

    const getDynamicDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const day = date.getDate();
            const month = date.toLocaleString('es', { month: 'short' }).replace('.', '');
            dates.push({ day, month, isToday: i === 0 });
        }
        return dates;
    };

    const metrics = useMemo(() => {
        const now = new Date();
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(now.getMonth() - 1);
        const twoMonthsAgo = new Date(now);
        twoMonthsAgo.setMonth(now.getMonth() - 2);

        const currentMonthCierres = filteredCierres.filter(c => new Date(c.fecha) >= oneMonthAgo);
        const previousMonthCierres = filteredCierres.filter(c => {
            const fecha = new Date(c.fecha);
            return fecha >= twoMonthsAgo && fecha < oneMonthAgo;
        });

        const totalRealCurrentMonth = currentMonthCierres.reduce((sum, c) => sum + c.real, 0);
        const totalRealPreviousMonth = previousMonthCierres.reduce((sum, c) => sum + c.real, 0);

        let vsMesAnterior = 0;
        if (totalRealPreviousMonth > 0) {
            vsMesAnterior = ((totalRealCurrentMonth - totalRealPreviousMonth) / totalRealPreviousMonth) * 100;
        }

        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        const twoWeeksAgo = new Date(now);
        twoWeeksAgo.setDate(now.getDate() - 14);

        const currentWeekCierres = filteredCierres.filter(c => new Date(c.fecha) >= weekAgo);
        const previousWeekCierres = filteredCierres.filter(c => {
            const fecha = new Date(c.fecha);
            return fecha >= twoWeeksAgo && fecha < weekAgo;
        });

        const totalCurrentWeek = currentWeekCierres.reduce((sum, c) => sum + c.real, 0);
        const totalPreviousWeek = previousWeekCierres.reduce((sum, c) => sum + c.real, 0);

        let vsSemanaPasada = 0;
        if (totalPreviousWeek > 0) {
            vsSemanaPasada = ((totalCurrentWeek - totalPreviousWeek) / totalPreviousWeek) * 100;
        }

        const totalReal = filteredCierres.reduce((sum, c) => sum + c.real, 0);
        const totalDiferencia = filteredCierres.reduce((sum, c) => sum + c.diferencia, 0);
        const promedioDiferencia = filteredCierres.length > 0 ? totalDiferencia / filteredCierres.length : 0;

        return {
            totalReal,
            promedioDiferencia,
            vsSemanaPasada,
            vsMesAnterior
        };
    }, [filteredCierres]);

    const totalPages = Math.ceil(filteredCierres.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentCierres = filteredCierres.slice(startIndex, startIndex + itemsPerPage);
    const dynamicDates = getDynamicDates();

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    };

    return (
        <div className="CashHistory">
            <div className="HeadCashHistory">
                <BoldTitle text="Historial de Caja" />
                <div className="descriptionRow">
                    <DescriptionSpan text="Visualiza y gestiona los reportes detallados de tus cierres de caja diarios." />
                </div>
            </div>

            <div className="metricsSection">
                <div className="metricsLayout">
                    <div className="metricCard chartCard">
                        <div className="metricContent">
                            {/*FLUJO DE CAJA*/}
                        </div>
                    </div>

                    <div className="kpiColumn">
                        <div className="metricCard kpiCard">
                            <div className="metricContent">
                                <div className="metricRow">
                                    <i className="fa-solid fa-savings metricIcon"></i>
                                    <span className="metricTitle">VENTAS SEMANALES</span>
                                </div>
                                <span className="metricValueLarge">${formatCurrency(metrics.totalReal)}</span>
                                <span className={`metricTrend ${metrics.vsMesAnterior >= 0 ? 'positive' : 'negative'}`}>
                                    <i className={`fa-solid fa-arrow-${metrics.vsMesAnterior >= 0 ? 'up' : 'down'}`}></i> 
                                    {Math.abs(metrics.vsMesAnterior).toFixed(1)}% respecto al mes anterior
                                </span>
                            </div>
                        </div>

                        <div className="metricCard kpiCard">
                            <div className="metricContent">
                                <div className="metricRow">
                                    <i className="fa-solid fa-circle-exclamation metricIcon error"></i>
                                    <span className="metricTitle">DISCREPANCIA PROM.</span>
                                </div>
                                <span className={`metricValueLarge ${metrics.promedioDiferencia < 0 ? 'negative' : ''}`}>
                                    {metrics.promedioDiferencia > 0 ? '+' : ''}{metrics.promedioDiferencia.toFixed(2)}
                                </span>
                                <span className="metricSubtext">Basado en los últimos 20 cierres</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="historyTitle">
                <span className="historyTitleText">Historial de Cierres de Caja</span>
            </div>

            <div className="filtersSection">
                <div className="filterControls">
                    <SelectOptions
                        title="Cajero"
                        options={cashierOptions}
                        value={selectedCashier}
                        action={setSelectedCashier}
                    />
                    <SelectOptions
                        title="Período"
                        options={periodOptions}
                        value={selectedPeriod}
                        action={setSelectedPeriod}
                    />
                </div>
            </div>

            <div className="TableCashHistory">
                <div className="headTable">
                    {columns.map((col, i) => (
                        <strong key={i} className={`TitleColumns col-${col.key}`}>{col.label}</strong>
                    ))}
                </div>
                <div className="roundedBottom">
                    {currentCierres.length > 0 ? (
                        currentCierres.map((row) => (
                            <CashHistoryCard 
                                key={row.id} 
                                row={{
                                    ...row,
                                    fecha: row.fechaStr,
                                    esperado: `$${formatCurrency(row.esperado)}`,
                                    real: `$${formatCurrency(row.real)}`,
                                    diferencia: row.diferencia > 0 
                                        ? `+$${formatCurrency(row.diferencia)}`
                                        : row.diferencia < 0
                                            ? `-$${formatCurrency(Math.abs(row.diferencia))}`
                                            : '$0.00'
                                }} 
                                columns={columns} 
                            />
                        ))
                    ) : (
                        <div className="noResults">
                            <i className="fa-solid fa-receipt"></i>
                            <p>No hay cierres disponibles</p>
                        </div>
                    )}
                </div>
            </div>

            {filteredCierres.length > 0 && (
                <div className="paginationSection">
                    <div className="paginationWrapper">
                        <span className="showingText">
                            Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredCierres.length)} de {filteredCierres.length} cierres
                        </span>
                        {totalPages > 1 && (
                            <div className="paginationControls">
                                <button className="paginationArrow" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>
                                    <i className="fa-solid fa-chevron-left"></i>
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button 
                                        key={i} 
                                        className={`paginationNumber ${currentPage === i + 1 ? 'active' : ''}`} 
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button className="paginationArrow" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>
                                    <i className="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}