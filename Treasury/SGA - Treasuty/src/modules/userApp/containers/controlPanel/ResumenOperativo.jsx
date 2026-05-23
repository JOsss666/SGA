import { useEffect, useMemo, useState } from 'react'
import { useAppInfo } from '../../../../context/context'
import { moneyFormat, postInfo } from '../../../../utils/functions'
import { BoldTitle } from '../../components/BoldTitle'
import { DescriptionSpan } from '../../components/DescriptionSpan'
import { KpiCard } from '../../components/KpiCard'
import { PathLocation } from '../../components/PathLocation'
import { TagIndicator } from '../../components/TagIndicator'
import { LoadingSpace } from '../LoadingSpace'
import './ResumenOperativo.css'

// ── Flag de integración (cambiar a true cuando el backend esté listo) ─────────
const USE_BACKEND = false

// ── Mock data para desarrollo ─────────────────────────────────────────────────
const MOCK_CARTERA = [
    { id: 1, document_name: 'Factura FV-001', third_party_name: 'Cliente A', due_date: '2026-05-24T00:00:00', balance: 3_500_000, type: 'entrada' },
    { id: 2, document_name: 'Factura FV-002', third_party_name: 'Cliente B', due_date: '2026-05-25T00:00:00', balance: 1_200_000, type: 'entrada' },
    { id: 3, document_name: 'Nota Débito ND-005', third_party_name: 'Proveedor X', due_date: '2026-05-22T00:00:00', balance: 800_000, type: 'salida' },
    { id: 4, document_name: 'Factura FV-010', third_party_name: 'Cliente C', due_date: '2026-06-01T00:00:00', balance: 5_000_000, type: 'entrada' },
    { id: 5, document_name: 'Recibo RC-030', third_party_name: 'Cliente D', due_date: '2026-05-28T00:00:00', balance: 950_000, type: 'entrada' },
]

const MOCK_PAGOS_PENDIENTES    = [{ nombre: 'Pago Nómina', monto: 12_000_000 }, { nombre: 'Pago Proveedor Y', monto: 4_500_000 }]
const MOCK_CONCILIACIONES      = [{ nombre: 'Bancolombia Junio', dias: 3 }, { nombre: 'Davivienda Mayo', dias: 8 }]
const MOCK_TRANSFERENCIAS      = [{ nombre: 'Transferencia Sede Norte', monto: 2_000_000 }, { nombre: 'Transferencia Caja Menor', monto: 500_000 }]
const MOCK_PAGOS_RECHAZADOS    = [{ nombre: 'PSE - Factura 334', motivo: 'Fondos insuficientes', fecha: '2026-05-21T14:30:00' }]
const MOCK_MOVIMIENTOS         = [
    { nombre: 'Recaudo FV-001', fecha: '2026-05-22T09:15:00', monto: 3_500_000, tipo: 'entrada' },
    { nombre: 'Pago Proveedor Z', fecha: '2026-05-22T10:45:00', monto: 1_800_000, tipo: 'salida'  },
    { nombre: 'Recaudo FV-009', fecha: '2026-05-21T16:00:00', monto: 650_000,   tipo: 'entrada' },
    { nombre: 'Transferencia interna', fecha: '2026-05-21T11:20:00', monto: 2_000_000, tipo: 'salida'  },
    { nombre: 'Recaudo ND-002', fecha: '2026-05-20T08:30:00', monto: 420_000,   tipo: 'entrada' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Formatea una fecha ISO a "YYYY-MM-DD HH:mm" */
const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '--/--/--'
    const [fecha, hora] = fechaStr.split('T')
    return hora ? `${fecha} ${hora.substring(0, 5)}` : fecha
}

/** Retorna la fecha actual en formato ISO (solo fecha) */
const fechaHoy = () => new Date().toISOString().split('T')[0]

/** Calcula los días restantes hasta una fecha */
const diasHasta = (fechaStr) => {
    if (!fechaStr) return null
    return Math.ceil((new Date(fechaStr) - new Date()) / (1000 * 60 * 60 * 24))
}

// ── Sub-componente: fila de movimiento bancario ───────────────────────────────
function MovimientoItem({ nombre, fecha, monto, tipo = 'entrada' }) {
    return (
        <div className="MovimientoItem">
            <div className={`MovimientoItem__icono MovimientoItem__icono--${tipo}`}>
                <i className={tipo === 'entrada' ? 'fa-solid fa-arrow-down' : 'fa-solid fa-arrow-up'} />
            </div>
            <div className="MovimientoItem__detalle">
                <span className="MovimientoItem__nombre">{nombre}</span>
                <span className="MovimientoItem__fecha">{formatearFecha(fecha)}</span>
            </div>
            <strong className={`MovimientoItem__monto MovimientoItem__monto--${tipo}`}>
                {tipo === 'salida' ? '- ' : '+ '}$ {moneyFormat(monto)}
            </strong>
        </div>
    )
}

// ── Sub-componente: fila de tabla de obligaciones ─────────────────────────────
function FilaObligacion({ doc }) {
    const dias    = diasHasta(doc.due_date)
    const urgente = dias !== null && dias <= 3

    return (
        <div className={`FilaObligacion ${urgente ? 'FilaObligacion--urgente' : ''}`}>
            <span className="col-doc">{doc.document_name || '—'}</span>
            <span className="col-tercero">{doc.third_party_name || '—'}</span>
            <span className="col-vence">
                {formatearFecha(doc.due_date)}
                {dias !== null && (
                    <TagIndicator
                        title={dias === 0 ? 'Hoy' : `${dias}d`}
                        type={urgente ? 'disabled' : 'suspended'}
                    />
                )}
            </span>
            <strong className="col-saldo">$ {moneyFormat(doc.balance)}</strong>
        </div>
    )
}

// ── Sub-componente: fila de pago rechazado ────────────────────────────────────
function FilaRechazado({ pago }) {
    return (
        <div className="FilaRechazado">
            <div className="FilaRechazado__icono">
                <i className="fa-solid fa-xmark" />
            </div>
            <div className="FilaRechazado__detalle">
                <span className="FilaRechazado__nombre">{pago.nombre}</span>
                <span className="FilaRechazado__motivo">{pago.motivo}</span>
            </div>
            <span className="FilaRechazado__fecha">{formatearFecha(pago.fecha)}</span>
        </div>
    )
}

// ── Componente principal ──────────────────────────────────────────────────────
export function ResumenOperativo() {
    const { appInfo } = useAppInfo()

    // ── Estado ────────────────────────────────────────────────────────────
    const [cartera,          setCartera]          = useState([])
    const [pagosPendientes,  setPagosPendientes]  = useState([])
    const [conciliaciones,   setConciliaciones]   = useState([])
    const [transferencias,   setTransferencias]   = useState([])
    const [pagosRechazados,  setPagosRechazados]  = useState([])
    const [movimientos,      setMovimientos]      = useState([])
    const [loading,          setLoading]          = useState(false)

    // ── Carga de datos ────────────────────────────────────────────────────
    const fetchTodo = async () => {
        if (USE_BACKEND) {
            const hoy = fechaHoy()
            const resCartera = await postInfo('/treasury/getThirdPartyPortfolio', {
                company_id: appInfo.company_id,
                start_date: hoy,
                end_date:   hoy,
            })
            if (resCartera[0]) setCartera(resCartera[1])

            // Cuando los endpoints estén listos, añadir las demás llamadas aquí:
            // const resPagos = await postInfo('/treasury/getPendingPayments', { ... })
            // const resConciliaciones = await postInfo('/treasury/getPendingConciliations', { ... })
        } else {
            setCartera(MOCK_CARTERA)
            setPagosPendientes(MOCK_PAGOS_PENDIENTES)
            setConciliaciones(MOCK_CONCILIACIONES)
            setTransferencias(MOCK_TRANSFERENCIAS)
            setPagosRechazados(MOCK_PAGOS_RECHAZADOS)
            setMovimientos(MOCK_MOVIMIENTOS)
        }
    }

    const cargarTodo = async () => {
        setLoading(true)
        await fetchTodo()
        setLoading(false)
    }

    useEffect(() => { cargarTodo() }, [])

    // ── Computed ──────────────────────────────────────────────────────────
    const totalRecaudos = useMemo(
        () => cartera.reduce((acc, item) => acc + (parseFloat(item.balance) || 0), 0),
        [cartera]
    )
    const totalPagos = useMemo(
        () => pagosPendientes.reduce((acc, p) => acc + (parseFloat(p.monto) || 0), 0),
        [pagosPendientes]
    )
    const totalTransferencias = useMemo(
        () => transferencias.reduce((acc, t) => acc + (parseFloat(t.monto) || 0), 0),
        [transferencias]
    )

    const obligacionesProximas = useMemo(
        () => cartera
            .filter(item => { const d = diasHasta(item.due_date); return d !== null && d >= 0 && d <= 7 })
            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date)),
        [cartera]
    )

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="ResumenOperativo">

            {/* ── Encabezado ─────────────────────────────────────────── */}
            <div className="ResumenOperativo__head">
                <PathLocation />
                <BoldTitle text="Resumen Operativo" />
                <DescriptionSpan text="Estado de operaciones del día y obligaciones pendientes" />
            </div>

            {loading && (
                <LoadingSpace title="Cargando resumen operativo" description="Consultando cartera y movimientos..." />
            )}

            {!loading && (
                <>
                    {/* ── KPIs operativos ────────────────────────────────── */}
                    <section className="ResumenOperativo__kpis">
                        <KpiCard
                            title="Recaudos Pendientes"
                            value={`$ ${moneyFormat(totalRecaudos)}`}
                            description={`${cartera.length} documento${cartera.length !== 1 ? 's' : ''} por aplicar`}
                            type={cartera.length > 0 ? 'warning' : 'positive'}
                            icon={<i className="fa-solid fa-hand-holding-dollar" />}
                        />
                        <KpiCard
                            title="Pagos Pendientes"
                            value={`$ ${moneyFormat(totalPagos)}`}
                            description={`${pagosPendientes.length} pago${pagosPendientes.length !== 1 ? 's' : ''} por procesar`}
                            type={pagosPendientes.length > 0 ? 'warning' : 'positive'}
                            icon={<i className="fa-solid fa-clock" />}
                        />
                        <KpiCard
                            title="Conciliaciones Pendientes"
                            value={conciliaciones.length.toString()}
                            description={`${conciliaciones.length} cuenta${conciliaciones.length !== 1 ? 's' : ''} sin conciliar`}
                            type={conciliaciones.length > 0 ? 'warning' : 'positive'}
                            icon={<i className="fa-solid fa-scale-balanced" />}
                        />
                        <KpiCard
                            title="Transferencias Pendientes"
                            value={`$ ${moneyFormat(totalTransferencias)}`}
                            description={`${transferencias.length} transferencia${transferencias.length !== 1 ? 's' : ''} en proceso`}
                            type={transferencias.length > 0 ? 'neutral' : 'positive'}
                            icon={<i className="fa-solid fa-arrows-left-right" />}
                        />
                    </section>

                    {/* ── Flujo de caja del día ──────────────────────────── */}
                    <section className="ResumenOperativo__flujo">
                        <div className="ResumenOperativo__seccion-header">
                            <BoldTitle text="Flujo de Caja del Día" />
                            <TagIndicator title="Hoy" type="indicator" />
                        </div>
                        <DescriptionSpan text="Entradas y salidas registradas durante la jornada actual" />

                        <div className="FlujoDia">
                            {movimientos.filter(m => m.tipo === 'entrada').length > 0 && (
                                <div className="FlujoDia__columna">
                                    <span className="FlujoDia__label FlujoDia__label--entrada">
                                        <i className="fa-solid fa-arrow-down" /> Entradas
                                    </span>
                                    <strong className="FlujoDia__total FlujoDia__total--entrada">
                                        $ {moneyFormat(movimientos.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + m.monto, 0))}
                                    </strong>
                                </div>
                            )}
                            {movimientos.filter(m => m.tipo === 'salida').length > 0 && (
                                <div className="FlujoDia__columna">
                                    <span className="FlujoDia__label FlujoDia__label--salida">
                                        <i className="fa-solid fa-arrow-up" /> Salidas
                                    </span>
                                    <strong className="FlujoDia__total FlujoDia__total--salida">
                                        $ {moneyFormat(movimientos.filter(m => m.tipo === 'salida').reduce((acc, m) => acc + m.monto, 0))}
                                    </strong>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ── Obligaciones próximas a vencer ────────────────── */}
                    <section className="ResumenOperativo__obligaciones">
                        <div className="ResumenOperativo__seccion-header">
                            <BoldTitle text="Obligaciones Próximas a Vencer" />
                            {obligacionesProximas.length > 0 && (
                                <TagIndicator title={`${obligacionesProximas.length} en 7 días`} type="suspended" />
                            )}
                        </div>
                        <DescriptionSpan text="Documentos con vencimiento en los próximos 7 días" />

                        {obligacionesProximas.length > 0 ? (
                            <div className="TablaObligaciones">
                                <div className="TablaObligaciones__head">
                                    <span className="col-doc">Documento</span>
                                    <span className="col-tercero">Tercero</span>
                                    <span className="col-vence">Vencimiento</span>
                                    <span className="col-saldo">Saldo</span>
                                </div>
                                {obligacionesProximas.map((item, i) => (
                                    <FilaObligacion key={i} doc={item} />
                                ))}
                            </div>
                        ) : (
                            <div className="EstadoVacio">
                                <i className="fa-regular fa-circle-check" />
                                <span>Sin obligaciones próximas a vencer</span>
                            </div>
                        )}
                    </section>

                    {/* ── Pagos rechazados ───────────────────────────────── */}
                    <section className="ResumenOperativo__rechazados">
                        <div className="ResumenOperativo__seccion-header">
                            <BoldTitle text="Pagos Rechazados" />
                            {pagosRechazados.length > 0 && (
                                <TagIndicator title={pagosRechazados.length.toString()} type="disabled" />
                            )}
                        </div>
                        <DescriptionSpan text="Transacciones que no pudieron procesarse" />

                        {pagosRechazados.length > 0 ? (
                            <div className="ListaRechazados">
                                {pagosRechazados.map((pago, i) => (
                                    <FilaRechazado key={i} pago={pago} />
                                ))}
                            </div>
                        ) : (
                            <div className="EstadoVacio">
                                <i className="fa-regular fa-circle-check" />
                                <span>Sin pagos rechazados registrados</span>
                            </div>
                        )}
                    </section>

                    {/* ── Movimientos bancarios recientes ───────────────── */}
                    <section className="ResumenOperativo__movimientos">
                        <div className="ResumenOperativo__seccion-header">
                            <BoldTitle text="Movimientos Bancarios Recientes" />
                        </div>
                        <DescriptionSpan text="Últimas transacciones registradas" />

                        {movimientos.length > 0 ? (
                            <div className="ListaMovimientos">
                                {movimientos.map((item, i) => (
                                    <MovimientoItem
                                        key={i}
                                        nombre={item.nombre || item.document_name || 'Movimiento'}
                                        fecha={item.fecha || item.created_at}
                                        monto={item.monto || item.balance}
                                        tipo={item.tipo || 'entrada'}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="EstadoVacio">
                                <i className="fa-solid fa-inbox" />
                                <span>Sin movimientos recientes</span>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    )
}
