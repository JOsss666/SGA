import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { TransactionsCard } from "../components/TransactionsCard";
import { SearchBar } from '../components/SearchBar';
import { FormInput } from '../components/FormInput';
import { SelectOptions } from '../components/SelectOptions';
import { ButtonMenu } from '../components/ButtonMenu';
import { ButtonDownload } from '../components/ButtonDownload';
import './Transactions.css';

export function Transactions() {
    const navigate = useNavigate();
    const params = useParams();
    
    const [search, setSearch] = useState('');
    const [fechaInicial, setFechaInicial] = useState('');
    const [fechaFinal, setFechaFinal] = useState('');
    const [orden, setOrden] = useState('Ascendente (fecha)');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    const handleViewTransaction = (id) => {
        navigate(`/SGA_management/${params.company_key}/${params.user_key}/transactions/${id}`);
    };

    const columns = [
        { key: "id", label: "ID" },
        { key: "transaction", label: "TRANSACCIÓN" },
        { key: "thirdParty", label: "TERCERO" },
        { key: "category", label: "CATEGORÍA" },
        { key: "responsible", label: "RESPONSABLE" },
        { key: "status", label: "ESTADO" },
        { key: "value", label: "VALOR" }
    ];

    /*hasta aqui solo el ejemplo para prueba*/ 
    const transactions = useMemo(() => {
        const data = [];
        const today = new Date();
        const categories = ["INFRAESTRUCTURA", "SERVICIOS", "RENTA", "VENTAS", "MANTENIMIENTO", "MARKETING", "FINANCIERO"];
        const responsables = ["José Murillo", "Cajero 1", "Maria García", "Juan Pérez", "Carlos Ruiz", "Ana López"];
        const statuses = ["PAGADO", "PENDIENTE", "VENCIDO"];
        const thirdParties = ["CESAR AUGUSTO", "tercero prueba", "José Miguel", "Empresa de Energía", "Cliente XYZ", "Técnico SA", "Medios Digitales", "Consultor ABC", "Banco"];

        for (let i = 0; i < 60; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - Math.floor(Math.random() * 30));
            const fechaStr = date.toISOString().split('T')[0];
            const value = Math.random() > 0.5 
                ? Math.floor(Math.random() * 2000000) + 50000 
                : -Math.floor(Math.random() * 1500000) - 50000;
            data.push({
                id: `OT#${Math.floor(100 + Math.random() * 900)}`,
                fecha: fechaStr,
                transaction: `Transacción ${i}`,
                thirdParty: thirdParties[Math.floor(Math.random() * thirdParties.length)],
                category: categories[Math.floor(Math.random() * categories.length)],
                responsible: responsables[Math.floor(Math.random() * responsables.length)],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                value,
                action: handleViewTransaction
            });
        }
        return data;
    }, []);
    /*hasta aqui solo el ejemplo para prueba*/ 

    const ordenOptions = ['Ascendente (fecha)', 'Descendente (fecha)', 'Ascendente (tercero)', 'Descendente (tercero)'];

    const filteredTransactions = useMemo(() => {
        let datos = [...transactions];
        if (search.trim() !== '') {
            const lowerSearch = search.toLowerCase();
            datos = datos.filter(row => Object.values(row).some(val => String(val).toLowerCase().includes(lowerSearch)));
        }
        if (fechaInicial || fechaFinal) {
            const inicio = fechaInicial ? new Date(fechaInicial) : null;
            const fin = fechaFinal ? new Date(fechaFinal) : null;
            datos = datos.filter(row => {
                const fecha = new Date(row.fecha);
                return (!inicio || fecha >= inicio) && (!fin || fecha <= fin);
            });
        }
        const sortMap = {
            'Ascendente (fecha)': (a, b) => new Date(a.fecha) - new Date(b.fecha),
            'Descendente (fecha)': (a, b) => new Date(b.fecha) - new Date(a.fecha),
            'Ascendente (tercero)': (a, b) => a.thirdParty.localeCompare(b.thirdParty),
            'Descendente (tercero)': (a, b) => b.thirdParty.localeCompare(a.thirdParty),
        };
        return datos.sort(sortMap[orden]);
    }, [transactions, search, fechaInicial, fechaFinal, orden]);

    const { startDate, endDate, previousStartDate, previousEndDate } = useMemo(() => {
        const end = fechaFinal ? new Date(fechaFinal) : new Date();
        const start = fechaInicial ? new Date(fechaInicial) : new Date(new Date().setDate(end.getDate() - 30));
        const duration = end.getTime() - start.getTime();
        const prevEnd = new Date(start.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - duration);
        return { startDate: start, endDate: end, previousStartDate: prevStart, previousEndDate: prevEnd };
    }, [fechaInicial, fechaFinal]);

    const { chartData, totals } = useMemo(() => {
        const dataMap = new Map();
        let curr = new Date(startDate);
        while (curr <= endDate) {
            const s = curr.toISOString().split('T')[0];
            dataMap.set(s, { date: s, ingresos: 0, gastos: 0, balance: 0 });
            curr.setDate(curr.getDate() + 1);
        }

        filteredTransactions.forEach(t => {
            if (dataMap.has(t.fecha)) {
                const d = dataMap.get(t.fecha);
                if (t.value > 0) d.ingresos += t.value;
                else d.gastos += Math.abs(t.value);
                d.balance = d.ingresos - d.gastos;
            }
        });

        const currentPeriod = filteredTransactions;
        const previousPeriod = transactions.filter(t => {
            const f = new Date(t.fecha);
            return f >= previousStartDate && f <= previousEndDate;
        });

        const calc = (list) => ({
            ing: list.filter(t => t.value > 0).reduce((s, t) => s + t.value, 0),
            gas: list.filter(t => t.value < 0).reduce((s, t) => s + Math.abs(t.value), 0)
        });

        const cur = calc(currentPeriod);
        const pre = calc(previousPeriod);
        const diff = (a, b) => b ? ((a - b) / b) * 100 : 0;

        return {
            chartData: Array.from(dataMap.values()),
            totals: {
                ingresos: cur.ing, gastos: cur.gas, balance: cur.ing - cur.gas,
                ingresosChange: diff(cur.ing, pre.ing),
                gastosChange: diff(cur.gas, pre.gas),
                balanceChange: diff(cur.ing - cur.gas, pre.ing - pre.gas)
            }
        };
    }, [filteredTransactions, transactions, startDate, endDate, previousStartDate, previousEndDate]);

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
    const formatCurrency = (v) => new Intl.NumberFormat('es-CO').format(Math.abs(v));

    const MetricCard = ({ label, value, change, dataKey, color, gradientId }) => (
        <div className="metricCard">
            <div className="metricHeader">
                <span className="metricLabel">{label}</span>
                <span className={`metricChange ${change >= 0 ? 'positive' : 'negative'}`}>
                    {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
            </div>
            <span className="metricValue">${formatCurrency(value)}</span>
            <div className="miniChart">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={color} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#${gradientId})`} strokeWidth={2} isAnimationActive={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    return (
        <div className="Transactions">
            <div className="HeadTransactions">
                <BoldTitle text="Informe de Transacciones" />
                <div className="descriptionRow">
                    <DescriptionSpan text="Balance de movimientos contables." />
                </div>
            </div>

            <div className="metricsSection">
                <div className="metricsGrid">
                    <MetricCard label="Ingresos Totales" value={totals.ingresos} change={totals.ingresosChange} dataKey="ingresos" color="#28D97B" gradientId="colorIngresos" />
                    <MetricCard label="Gastos Totales" value={totals.gastos} change={totals.gastosChange} dataKey="gastos" color="#D92828" gradientId="colorGastos" />
                    <MetricCard label="Balance Neto" value={totals.balance} change={totals.balanceChange} dataKey="balance" color="#0066cc" gradientId="colorBalance" />
                </div>
            </div>

            <div className="filtersBar">
                <SearchBar placeholder="Buscar" search={search} setSearch={setSearch} />
                <div className="rangeInput">
                    <FormInput type="date" value={fechaInicial} onChange={(e) => setFechaInicial(e.target.value)} />
                    <span>-</span>
                    <FormInput type="date" value={fechaFinal} onChange={(e) => setFechaFinal(e.target.value)} />
                </div>
                <SelectOptions title="Orden" options={ordenOptions} value={orden} action={setOrden} />
                <div className="filterButtons">
                    <ButtonMenu title="Más Ajustes" noRotate><i className="fa-solid fa-sliders" /></ButtonMenu>
                    <ButtonMenu title="Destacados" noRotate><i className="fa-regular fa-star" /></ButtonMenu>
                    <ButtonDownload />
                </div>
            </div>

            <div className="TableTransactions">
                <div className="headTable">
                    {columns.map(col => <strong key={col.key} className={`TitleColumns col-${col.key}`}>{col.label}</strong>)}
                </div>
                <div className="roundedBottom">
                    {currentTransactions.length > 0 ? (
                        currentTransactions.map((row, index) => (
                            <TransactionsCard key={row.id} row={row} columns={columns} formatCurrency={formatCurrency} isLast={index === currentTransactions.length - 1} />
                        ))
                    ) : (
                        <div className="noResults"><i className="fa-solid fa-receipt" /><p>No hay transacciones disponibles</p></div>
                    )}
                </div>
            </div>
            
            {filteredTransactions.length > 0 && (
                <div className="paginationSection">
                    <div className="paginationWrapper">
                        <span className="showingText">
                            Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTransactions.length)} de {filteredTransactions.length} transacciones
                        </span>
                        {totalPages > 1 && (
                            <div className="paginationControls">
                                <button className="paginationArrow" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><i className="fa-solid fa-chevron-left"/></button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button key={i} className={`paginationNumber ${currentPage === i + 1 ? 'active' : ''}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                                ))}
                                <button className="paginationArrow" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><i className="fa-solid fa-chevron-right"/></button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}