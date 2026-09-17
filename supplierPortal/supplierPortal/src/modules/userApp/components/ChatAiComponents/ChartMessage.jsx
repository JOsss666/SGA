import { useState } from 'react';
import {
    ResponsiveContainer,
    BarChart, Bar,
    LineChart, Line,
    AreaChart, Area,
    CartesianGrid, XAxis, YAxis, Tooltip
} from 'recharts';
import './ChartMessage.css';

// Ocho ranuras categóricas fijas. El color sigue a la serie por su posición en
// el spec, nunca por su valor: filtrar o reordenar no debe repintar nada.
const SERIES_SLOTS = 8;
const slotColor = index => `var(--chartSeries${(index % SERIES_SLOTS) + 1})`;

const compact = new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 });
const plain = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

const formatValue = (value, unit) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
    const number = Number(value);
    if (unit === 'money') return `$ ${plain.format(number)}`;
    if (unit === 'percent') return `${plain.format(number)} %`;
    return plain.format(number);
};

const formatAxis = (value, unit) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return '';
    if (unit === 'percent') return `${compact.format(number)}%`;
    return compact.format(number);
};

function ChartTooltip({ active, payload, label, unit }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="chartTooltip">
            <strong>{label}</strong>
            {payload.map(entry => (
                <span key={entry.dataKey}>
                    {/* La identidad la carga el punto de color, no el texto:
                        un amarillo o un aqua son ilegibles como texto. */}
                    <i style={{ backgroundColor: entry.color }} />
                    <em>{entry.name}</em>
                    <b>{formatValue(entry.value, unit)}</b>
                </span>
            ))}
        </div>
    );
}

function ChartLegend({ series }) {
    return (
        <ul className="chartLegend">
            {series.map((entry, index) => (
                <li key={entry.key}>
                    <i style={{ backgroundColor: slotColor(index) }} />
                    {entry.name || entry.key}
                </li>
            ))}
        </ul>
    );
}

function DataTable({ spec, series }) {
    return (
        <div className="chartTableWrap">
            <table>
                <thead>
                    <tr>
                        <th>{spec.xLabel || spec.xKey}</th>
                        {series.map(entry => <th key={entry.key}>{entry.name || entry.key}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {spec.data.map((row, index) => (
                        <tr key={index}>
                            <td>{row[spec.xKey]}</td>
                            {series.map(entry => (
                                <td key={entry.key}>{formatValue(row[entry.key], spec.unit)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function StatTile({ spec }) {
    const direction = spec.delta?.direction;
    return (
        <figure className="ChartMessage statTile">
            <figcaption>{spec.title}</figcaption>
            <strong>{formatValue(spec.value, spec.unit)}</strong>
            {spec.delta && (
                <span className={`statDelta ${direction === 'down' ? 'statDown' : 'statUp'}`}>
                    <i className={`fa-solid fa-arrow-${direction === 'down' ? 'down' : 'up'}`}/>
                    {formatValue(spec.delta.value, spec.delta.unit || 'percent')}
                    {spec.delta.label && <em>{spec.delta.label}</em>}
                </span>
            )}
        </figure>
    );
}

/**
 * Renderiza una gráfica a partir del bloque ```chart que emite el agente.
 * Toda gráfica trae su vista de tabla: es el equivalente accesible y la única
 * forma garantizada de leer un valor exacto.
 */
export function ChartMessage({ spec }) {
    const [showTable, setShowTable] = useState(false);

    if (spec?.type === 'stat') return <StatTile spec={spec}/>;

    const series = (spec.series || []).slice(0, SERIES_SLOTS);
    const data = Array.isArray(spec.data) ? spec.data : [];
    if (!series.length || !data.length) return null;

    const axisProps = {
        tickLine: false,
        tick: { fill: 'var(--chartInkMuted)', fontSize: 12 },
        axisLine: { stroke: 'var(--chartAxis)' }
    };

    const renderChart = () => {
        if (spec.type === 'line' || spec.type === 'area') {
            const ChartRoot = spec.type === 'area' ? AreaChart : LineChart;
            const Mark = spec.type === 'area' ? Area : Line;
            return (
                <ChartRoot data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke="var(--chartGrid)" vertical={false}/>
                    <XAxis dataKey={spec.xKey} {...axisProps}/>
                    <YAxis {...axisProps} tickFormatter={value => formatAxis(value, spec.unit)} width={56}/>
                    <Tooltip
                        cursor={{ stroke: 'var(--chartAxis)' }}
                        content={<ChartTooltip unit={spec.unit}/>}
                    />
                    {series.map((entry, index) => (
                        <Mark
                            key={entry.key}
                            type="monotone"
                            dataKey={entry.key}
                            name={entry.name || entry.key}
                            stroke={slotColor(index)}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            {...(spec.type === 'area'
                                ? { fill: slotColor(index), fillOpacity: 0.1 }
                                : {})}
                            dot={false}
                            // Anillo de 2px en el color de la superficie para que
                            // el punto activo se lea al cruzarse con la línea.
                            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--chartSurface)' }}
                        />
                    ))}
                </ChartRoot>
            );
        }

        return (
            <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="var(--chartGrid)" vertical={false}/>
                <XAxis dataKey={spec.xKey} {...axisProps}/>
                <YAxis {...axisProps} tickFormatter={value => formatAxis(value, spec.unit)} width={56}/>
                <Tooltip
                    cursor={{ fill: 'var(--chartHover)' }}
                    content={<ChartTooltip unit={spec.unit}/>}
                />
                {series.map((entry, index) => (
                    <Bar
                        key={entry.key}
                        dataKey={entry.key}
                        name={entry.name || entry.key}
                        fill={slotColor(index)}
                        maxBarSize={24}
                        // Extremo redondeado en la punta, recto en la línea base.
                        radius={index === series.length - 1 ? [4, 4, 0, 0] : 0}
                        {...(spec.stacked
                            ? {
                                stackId: 'stack',
                                // El separador es la propia superficie, no un
                                // borde de color: 2px entre segmentos.
                                stroke: 'var(--chartSurface)',
                                strokeWidth: 2
                            }
                            : {})}
                    />
                ))}
            </BarChart>
        );
    };

    return (
        <figure className="ChartMessage">
            <figcaption>
                {spec.title}
                <button type="button" onClick={()=>setShowTable(!showTable)}>
                    <i className={`fa-solid ${showTable? 'fa-chart-column':'fa-table-list'}`}/>
                    {showTable? 'Ver gráfica':'Ver datos'}
                </button>
            </figcaption>
            {showTable
                ? <DataTable spec={spec} series={series}/>
                : (
                    <>
                        <div className="chartCanvas">
                            <ResponsiveContainer width="100%" height="100%">
                                {renderChart()}
                            </ResponsiveContainer>
                        </div>
                        {/* Con una sola serie el título ya dice qué se grafica:
                            una leyenda de un solo color solo gasta espacio. */}
                        {series.length > 1 && <ChartLegend series={series}/>}
                    </>
                )
            }
        </figure>
    );
}
