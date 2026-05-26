import { useEffect, useMemo, useState } from 'react'
import { useAppInfo } from '../../../../context/context'
import { moneyFormat, postInfo } from '../../../../utils/functions'
import { BoldTitle } from '../../components/BoldTitle'
import { DescriptionSpan } from '../../components/DescriptionSpan'
import { KpiCard } from '../../components/KpiCard'
import { PathLocation } from '../../components/PathLocation'
import { TagIndicator } from '../../components/TagIndicator'
import { LoadingSpace } from '../LoadingSpace'
import './PosicionCaja.css'

// ── Umbral de alertas de liquidez ─────────────────────────────────────────────
const UMBRAL_SOBREGIRO  = 0           // saldo < 0        → sobregiro
const UMBRAL_MINIMO     = 500_000     // saldo < 500k     → saldo mínimo
const UMBRAL_OCIOSO     = 50_000_000  // saldo > 50M      → saldo ocioso

// ── Flag de integración (cambiar a true cuando el backend esté listo) ─────────
const USE_BACKEND = false

// ── Mock data para desarrollo ─────────────────────────────────────────────────
const MOCK_CUENTAS = [
    { id: 1, account_name: 'Bancolombia Ahorros',  bank_name: 'Bancolombia', company_name: 'Empresa A', currency: 'COP', store_name: 'Sede Principal', available_balance: 12_500_000, contable_balance: 12_300_000, bank_balance: 12_400_000, projected_balance: 13_000_000 },
    { id: 2, account_name: 'Davivienda Corriente', bank_name: 'Davivienda',  company_name: 'Empresa A', currency: 'COP', store_name: 'Sede Norte',     available_balance: -200_000,  contable_balance: -180_000,  bank_balance: -200_000,  projected_balance: 100_000   },
    { id: 3, account_name: 'BBVA Ahorros',         bank_name: 'BBVA',        company_name: 'Empresa B', currency: 'USD', store_name: 'Sede Sur',       available_balance: 320_000,   contable_balance: 310_000,   bank_balance: 315_000,   projected_balance: 400_000   },
    { id: 4, account_name: 'Nequi Operaciones',    bank_name: 'Bancolombia', company_name: 'Empresa B', currency: 'COP', store_name: 'Sede Principal', available_balance: 75_000_000,contable_balance: 74_000_000,bank_balance: 75_000_000,projected_balance: 74_500_000 },
    { id: 5, account_name: 'Itaú Corriente',       bank_name: 'Itaú',        company_name: 'Empresa A', currency: 'COP', store_name: 'Sede Norte',     available_balance: 180_000,   contable_balance: 175_000,   bank_balance: 180_000,   projected_balance: 200_000   },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Suma un campo numérico de un array de objetos */
const sumarCampo = (arr, campo) =>
    arr.reduce((acc, item) => acc + (parseFloat(item[campo]) || 0), 0)

/** Agrupa un array de objetos por el valor de una clave */
const agruparPor = (arr, clave) =>
    arr.reduce((acc, item) => {
        const grupo = item[clave] || 'Sin definir'
        acc[grupo] = acc[grupo] ? [...acc[grupo], item] : [item]
        return acc
    }, {})

// ── Configuración de filtros de agrupación ────────────────────────────────────
const FILTROS = [
    { id: 'banco',    clave: 'bank_name',    label: 'Banco'    },
    { id: 'cuenta',   clave: 'account_name', label: 'Cuenta'   },
    { id: 'empresa',  clave: 'company_name', label: 'Empresa'  },
    { id: 'moneda',   clave: 'currency',     label: 'Moneda'   },
    { id: 'sucursal', clave: 'store_name',   label: 'Sucursal' },
]

// ── Sub-componente: bloque de alerta de liquidez ──────────────────────────────
function GrupoAlerta({ tipo, titulo, icono, cuentas, mensajeOk }) {
    const tipoTag = { danger: 'disabled', warning: 'suspended', info: 'indicator' }[tipo] ?? 'active'

    return (
        <div className={`GrupoAlerta GrupoAlerta--${tipo}`}>
            <div className="GrupoAlerta__header">
                <i className={icono} />
                <span>{titulo}</span>
                <TagIndicator
                    title={cuentas.length.toString()}
                    type={cuentas.length === 0 ? 'active' : tipoTag}
                />
            </div>

            {cuentas.length > 0 ? (
                <ul className="GrupoAlerta__lista">
                    {cuentas.map((cuenta, i) => (
                        <li key={i} className="GrupoAlerta__item">
                            <span>{cuenta.account_name || 'Cuenta'}</span>
                            <strong className={`GrupoAlerta__monto GrupoAlerta__monto--${tipo}`}>
                                $ {moneyFormat(cuenta.available_balance)}
                            </strong>
                        </li>
                    ))}
                </ul>
            ) : (
                <span className="GrupoAlerta__ok">{mensajeOk}</span>
            )}
        </div>
    )
}

// ── Componente principal ──────────────────────────────────────────────────────
export function PosicionCaja() {
    const { appInfo } = useAppInfo()

    // ── Estado ────────────────────────────────────────────────────────────
    const [cuentas,      setCuentas]      = useState([])
    const [filtroActivo, setFiltroActivo] = useState('banco')
    const [loading,      setLoading]      = useState(false)

    // ── Carga de datos ────────────────────────────────────────────────────
    const fetchCuentas = async () => {
        if (USE_BACKEND) {
            const res = await postInfo('/treasury/getTreasury', { company_id: appInfo.company_id })
            if (res[0]) setCuentas(res[1])
        } else {
            setCuentas(MOCK_CUENTAS)
        }
    }

    const cargarTodo = async () => {
        setLoading(true)
        await fetchCuentas()
        setLoading(false)
    }

    useEffect(() => { cargarTodo() }, [])

    // ── KPIs agregados ────────────────────────────────────────────────────
    const totalDisponible = useMemo(() => sumarCampo(cuentas, 'available_balance'), [cuentas])
    const totalContable   = useMemo(() => sumarCampo(cuentas, 'contable_balance'),  [cuentas])
    const totalBancario   = useMemo(() => sumarCampo(cuentas, 'bank_balance'),      [cuentas])
    const totalProyectado = useMemo(() => sumarCampo(cuentas, 'projected_balance'), [cuentas])

    // ── Alertas de liquidez ───────────────────────────────────────────────
    const cuentasSobregiro = useMemo(
        () => cuentas.filter(c => (parseFloat(c.available_balance) || 0) < UMBRAL_SOBREGIRO),
        [cuentas]
    )
    const cuentasMinimo = useMemo(
        () => cuentas.filter(c => {
            const s = parseFloat(c.available_balance) || 0
            return s >= 0 && s < UMBRAL_MINIMO
        }),
        [cuentas]
    )
    const cuentasOciosas = useMemo(
        () => cuentas.filter(c => (parseFloat(c.available_balance) || 0) > UMBRAL_OCIOSO),
        [cuentas]
    )

    // ── Agrupación dinámica ───────────────────────────────────────────────
    const claveActiva       = FILTROS.find(f => f.id === filtroActivo)?.clave ?? 'bank_name'
    const cuentasAgrupadas  = useMemo(() => agruparPor(cuentas, claveActiva), [cuentas, claveActiva])

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="PosicionCaja">

            {/* ── Encabezado ─────────────────────────────────────────── */}
            <div className="PosicionCaja__head">
                <PathLocation />
                <BoldTitle text="Posición de Caja" />
                <DescriptionSpan text="Resumen consolidado de saldos y alertas de liquidez" />
            </div>

            {loading && (
                <LoadingSpace title="Cargando posición de caja" description="Consultando saldos y cuentas..." />
            )}

            {!loading && (
                <>
                    {/* ── KPIs principales ───────────────────────────────── */}
                    <section className="PosicionCaja__kpis">
                        <KpiCard
                            title="Saldo Disponible"
                            value={`$ ${moneyFormat(totalDisponible)}`}
                            description="Suma de todos los saldos disponibles"
                            type="positive"
                            icon={<i className="fa-solid fa-wallet" />}
                        />
                        <KpiCard
                            title="Saldo Contable"
                            value={`$ ${moneyFormat(totalContable)}`}
                            description="Registrado en contabilidad"
                            type="neutral"
                            icon={<i className="fa-solid fa-book" />}
                        />
                        <KpiCard
                            title="Saldo Bancario"
                            value={`$ ${moneyFormat(totalBancario)}`}
                            description="Confirmado por extracto bancario"
                            type="neutral"
                            icon={<i className="fa-solid fa-building-columns" />}
                        />
                        <KpiCard
                            title="Saldo Proyectado"
                            value={`$ ${moneyFormat(totalProyectado)}`}
                            description="Proyección al cierre del período"
                            type={totalProyectado >= 0 ? 'positive' : 'danger'}
                            icon={<i className="fa-solid fa-chart-line" />}
                        />
                    </section>

                    {/* ── Saldos agrupados ──────────────────────────────── */}
                    <section className="PosicionCaja__agrupados">
                        <div className="PosicionCaja__agrupados-header">
                            <BoldTitle text="Saldos por" />
                            <div className="FiltroTabs">
                                {FILTROS.map(({ id, label }) => (
                                    <button
                                        key={id}
                                        className={`FiltroTabs__tab ${filtroActivo === id ? 'FiltroTabs__tab--active' : ''}`}
                                        onClick={() => setFiltroActivo(id)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="PosicionCaja__grupo-grid">
                            {Object.entries(cuentasAgrupadas).map(([nombre, items]) => {
                                const total = sumarCampo(items, 'available_balance')
                                return (
                                    <div key={nombre} className="GrupoCard">
                                        <span className="GrupoCard__nombre">{nombre}</span>
                                        <strong className={`GrupoCard__total ${total < 0 ? 'GrupoCard__total--negativo' : ''}`}>
                                            $ {moneyFormat(total)}
                                        </strong>
                                        <span className="GrupoCard__cuentas">
                                            {items.length} cuenta{items.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                )
                            })}
                            {Object.keys(cuentasAgrupadas).length === 0 && (
                                <span className="PosicionCaja__vacio">Sin cuentas registradas</span>
                            )}
                        </div>
                    </section>

                    {/* ── Alertas de liquidez ────────────────────────────── */}
                    <section className="PosicionCaja__alertas">
                        <BoldTitle text="Alertas de Liquidez" />
                        <DescriptionSpan text="Cuentas que requieren atención inmediata" />

                        <div className="PosicionCaja__alertas-grid">
                            <GrupoAlerta
                                tipo="danger"
                                titulo="Cuentas con Sobregiro"
                                icono="fa-solid fa-arrow-trend-down"
                                cuentas={cuentasSobregiro}
                                mensajeOk="Sin sobregiros activos"
                            />
                            <GrupoAlerta
                                tipo="warning"
                                titulo="Saldo Mínimo"
                                icono="fa-solid fa-triangle-exclamation"
                                cuentas={cuentasMinimo}
                                mensajeOk="Todas las cuentas sobre el mínimo"
                            />
                            <GrupoAlerta
                                tipo="info"
                                titulo="Saldo Ocioso"
                                icono="fa-solid fa-circle-pause"
                                cuentas={cuentasOciosas}
                                mensajeOk="Sin saldos ociosos detectados"
                            />
                        </div>
                    </section>
                </>
            )}
        </div>
    )
}
