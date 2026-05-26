import { Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { BoldTitle } from '../components/BoldTitle'
import { DescriptionSpan } from '../components/DescriptionSpan'
import { PosicionCaja } from './controlPanel/PosicionCaja'
import { ResumenOperativo } from './controlPanel/ResumenOperativo'
import './ControlPanel.css'

// ── Definición de secciones del panel ────────────────────────────────────────
const SECCIONES = [
    {
        id:          'posicion-caja',
        titulo:      'Posición de Caja',
        descripcion: 'Saldos totales, por banco, cuenta, empresa, moneda y sucursal. Alertas de liquidez.',
        icono:       'fa-solid fa-wallet',
        color:       '#057A55',
        colorFondo:  '#B4F9DF',
        etiquetas:   ['Saldo disponible', 'Saldo bancario', 'Alertas'],
    },
    {
        id:          'resumen-operativo',
        titulo:      'Resumen Operativo',
        descripcion: 'Pagos, recaudos, conciliaciones y transferencias pendientes. Flujo del día.',
        icono:       'fa-solid fa-chart-line',
        color:       '#1A56DB',
        colorFondo:  '#B2D4FC',
        etiquetas:   ['Pagos', 'Recaudos', 'Obligaciones'],
    },
]

// ── Tarjeta de navegación de sección ─────────────────────────────────────────
function TarjetaSeccion({ seccion, onClick }) {
    return (
        <button className="TarjetaSeccion" onClick={onClick}>
            <div
                className="TarjetaSeccion__icono"
                style={{ backgroundColor: seccion.colorFondo, color: seccion.color }}
            >
                <i className={seccion.icono} />
            </div>

            <div className="TarjetaSeccion__cuerpo">
                <strong className="TarjetaSeccion__titulo">{seccion.titulo}</strong>
                <span className="TarjetaSeccion__desc">{seccion.descripcion}</span>
                <div className="TarjetaSeccion__etiquetas">
                    {seccion.etiquetas.map(etiqueta => (
                        <span key={etiqueta} className="TarjetaSeccion__etiqueta">
                            {etiqueta}
                        </span>
                    ))}
                </div>
            </div>

            <i className="fa-solid fa-angle-right TarjetaSeccion__flecha" />
        </button>
    )
}

// ── Vista de inicio del panel de control ─────────────────────────────────────
function ControlPanelHome() {
    const navigate = useNavigate()
    const params   = useParams()

    const irA = (id) =>
        navigate(`/SGA_treasury/${params.company_key}/${params.user_key}/mainPanel/${id}`)

    return (
        <div className="ControlPanelHome">
            <div className="ControlPanelHome__head">
                <BoldTitle text="Panel Principal — Tesorería" />
                <DescriptionSpan text="Selecciona una sección para consultar el estado detallado" />
            </div>

            <div className="ControlPanelHome__grid">
                {SECCIONES.map(seccion => (
                    <TarjetaSeccion
                        key={seccion.id}
                        seccion={seccion}
                        onClick={() => irA(seccion.id)}
                    />
                ))}
            </div>
        </div>
    )
}

// ── Contenedor principal del Panel de Control ─────────────────────────────────
export function ControlPanel() {
    return (
        <div className="ControlPanel">
            <Routes>
                <Route path="/"                 element={<ControlPanelHome />}  />
                <Route path="posicion-caja"     element={<PosicionCaja />}      />
                <Route path="resumen-operativo" element={<ResumenOperativo />}  />
            </Routes>
        </div>
    )
}
