import { Routes, Route } from "react-router-dom"
import './PreviewNavigarionPanel.css'
import { RedirectPanelSec } from "./RedirectPanelSec"

export function PreviewNavigarionPanel({path,setVisiblePanel}) {

    // Inventory
    const inventoryRoutes = [
        {title: 'Vista general del módulo de inventarios', elements:[
            { type:'main', text: 'Que ofrece el modulo de inventarios?', path: '/inventarios/about' },
            { type:'main', text: 'Como puedo pasar de mi sistema actual a SGA?', path: '/inventarios/migrate' },
            { type:'main', text: 'Como puedo empezar a utilizar SGA - Inventarios?', path: '/inventarios/usage' },
            { type:'main', text: 'Como conectarme a  la API de SGA - Inventarios?', path: '/inventarios/api' },
            { type:'sub', text: 'Como conectarme a  la API de SGA - Inventarios?', path: '/inventarios/api' },
        ]},
        {title: 'Vista general del módulo de inventarios', elements:[
            { type:'sub', text: 'Que ofrece el modulo de inventarios?', path: '/inventarios/about' },
            { type:'sub', text: 'Como puedo pasar de mi sistema actual a SGA?', path: '/inventarios/migrate' },
            { type:'sub', text: 'Como puedo empezar a utilizar SGA - Inventarios?', path: '/inventarios/usage' }
        ]},
    ]

    // Processes
    const processesRoutes = [
        {
            title: 'Gestión de Tareas y Flujos', 
            elements: [
                { type: 'main', text: '¿Cómo registrar y organizar nuevos servicios?', path: '/operaciones/registro' },
                { type: 'main', text: 'Control de estados: ¿En qué etapa está el trabajo?', path: '/operaciones/monitoreo' },
                { type: 'main', text: 'Asignación de responsables y metas diarias', path: '/operaciones/equipo' },
                { type: 'sub', text: 'Historial de actividades y cumplimiento', path: '/operaciones/historial' }
            ]
        },
        {
            title: 'Planeación Estratégica', 
            elements: [
                { type: 'sub', text: 'Configuración personalizada de flujos de trabajo', path: '/operaciones/configurar' },
                { type: 'sub', text: 'Análisis de cumplimiento y fechas de entrega', path: '/operaciones/rendimiento' }
            ]
        }
    ];

    // Facturation
    const sellsRoutes = [
        {
            title: 'Ventas y Atención al Cliente', 
            elements: [
                { type: 'main', text: 'Emisión de comprobantes y recibos de venta', path: '/comercial/comprobantes' },
                { type: 'main', text: 'Catálogo de servicios y productos ofrecidos', path: '/comercial/portafolio' },
                { type: 'main', text: 'Directorio inteligente de clientes y empresas', path: '/comercial/directorio' },
                { type: 'sub', text: 'Búsqueda avanzada de transacciones anteriores', path: '/comercial/buscar' }
            ]
        },
        {
            title: 'Control de Ingresos', 
            elements: [
                { type: 'sub', text: 'Seguimiento de cobros y saldos pendientes', path: '/comercial/cartera' },
                { type: 'sub', text: 'Reportes de ventas por periodo y categoría', path: '/comercial/reportes' }
            ]
        }
    ];

    // Treasury
    const treasuryRoutes = [
        {
            title: 'Administración de Recursos', 
            elements: [
                { type: 'main', text: 'Control de pagos electrónicos y transferencias', path: '/finanzas/pagos' },
                { type: 'main', text: 'Facturación electrónica', path: '/finanzas/cierre' },
                { type: 'main', text: 'Servicios de tesorería', path: '/finanzas/auditoria' },
                { type: 'sub', text: 'Informes, Estadisticas y mucho más', path: '/finanzas/movimientos' }
            ]
        },
        {
            title: 'Informes de Gestión', 
            elements: [
                { type: 'sub', text: 'Exportación de balances a hojas de cálculo', path: '/finanzas/exportar' },
                { type: 'sub', text: 'Resumen de utilidades por medio de pago', path: '/finanzas/metodos' }
            ]
        }
    ];

    // Treasury
    const tecnicSupportRoutes = [
        {
            title: 'Ayuda y Soporte', 
            elements: [
                { type: 'main', text: 'Centro de ayuda', path: '/finanzas/pagos' },
                { type: 'main', text: 'Solución de dudas', path: '/finanzas/cierre' },
                { type: 'main', text: 'Tutoriales', path: '/finanzas/auditoria' },
                { type: 'sub', text: 'support@sga360.com', path: '/finanzas/movimientos' }
            ]
        },
        {
            title: 'Otras ayudas', 
            elements: [
                { type: 'sub', text: 'Ultimas noticias', path: '/finanzas/exportar' },
                { type: 'sub', text: 'Foro comunidad SGA 360°', path: '/finanzas/metodos' }
            ]
        }
    ];


    // Contact
    const contactRoutes = [
        {
            title: 'Comunicate con nosotros', 
            elements: [
                { type: 'sub', text: 'contacto@sga360.com', path: '' },
                { type: 'sub', text: '+57 302 603 4563', path: '' },
            ]
        },
        {
            title: 'Soporte Técnico', 
            elements: [
                { type: 'sub', text: 'support@sga360.com', path: '/finanzas/exportar' },
                { type: 'sub', text: 'Agente AI SGA 360°', path: '/finanzas/exportar' },
            ]
        }
    ];

    return(
        <div className="PreviewNavigarionPanel">
            <div className="spacePreview" 
                onMouseOver={()=>{
                    setVisiblePanel(true)
                }}
                onMouseLeave={()=>{
                    setVisiblePanel(false);
                }}>
                {path == '/inventarios' && inventoryRoutes.map((route,index) => (
                    <RedirectPanelSec key={index} title={route.title} elements={route.elements}/>
                ))}
                {path == '/procesos' && processesRoutes.map((route,index) => (
                    <RedirectPanelSec key={index} title={route.title} elements={route.elements}/>
                ))}
                {path == '/facturacion-y-ventas' && sellsRoutes.map((route,index) => (
                    <RedirectPanelSec key={index} title={route.title} elements={route.elements}/>
                ))}
                {path == '/tesoreria' && treasuryRoutes.map((route,index) => (
                    <RedirectPanelSec key={index} title={route.title} elements={route.elements}/>
                ))}
                {path == '/tecnicSupport' && tecnicSupportRoutes.map((route,index) => (
                    <RedirectPanelSec key={index} title={route.title} elements={route.elements}/>
                ))}
                {path == '/contacto' && contactRoutes.map((route,index) => (
                    <RedirectPanelSec key={index} title={route.title} elements={route.elements}/>
                ))}
            </div>
        </div>
    )
}