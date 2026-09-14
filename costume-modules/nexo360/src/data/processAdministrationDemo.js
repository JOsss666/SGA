export const processAdministrationDemo = [
    {
        id: "CLI-001-000001",
        instanceId: "NEXO-DEMO-001",
        clientCode: "CLI-001",
        clientName: "Cliente demostración",
        store: "PRUEBA 1",
        city: "Bogotá",
        product: "Aviso / Caja luz",
        reference: "134143431/BOGOTA/2026-09-06/CAJA LUZ/PRUEBA 1",
        createdAt: "2026-09-06T20:31:13-05:00",
        promisedAt: "2026-09-18T17:00:00-05:00",
        status: "En producción",
        priority: "En tiempo",
        clientStage: "Orden recibida y arte validado",
        administrationStage: "Seguimiento de producción",
        providerStage: "2 de 3 procesos en ejecución",
        components: [
            { id: "CMP-001-10", name: "Impresión", provider: "Proveedor Gráfico 01", workOrder: "OT-2026-000001", dueDate: "2026-09-12", status: "Terminado", progress: 100 },
            { id: "CMP-001-20", name: "Estructura", provider: "Proveedor Metálico 02", workOrder: "OT-2026-000002", dueDate: "2026-09-14", status: "En producción", progress: 65 },
            { id: "CMP-001-30", name: "Armado", provider: "Proveedor Gráfico 01", workOrder: "OT-2026-000003", dueDate: "2026-09-17", status: "Bloqueado por dependencias", progress: 0 }
        ],
        history: [
            { actor: "Cliente", action: "Creó la orden y adjuntó el arte", date: "2026-09-06T20:31:13-05:00" },
            { actor: "Administración", action: "Validó la ficha y asignó los procesos", date: "2026-09-07T09:18:00-05:00" },
            { actor: "Proveedor", action: "Reportó terminada la impresión", date: "2026-09-11T15:42:00-05:00" }
        ]
    },
    {
        id: "CLI-001-000002",
        instanceId: "NEXO-DEMO-001",
        clientCode: "CLI-001",
        clientName: "Cliente demostración",
        store: "LA ESPERANZA",
        city: "Sincelejo",
        product: "Botón",
        reference: "1202537311/SINCELEJO/2026-09-03/BOTÓN/LA ESPERANZA",
        createdAt: "2026-09-03T14:05:06-05:00",
        promisedAt: "2026-09-12T17:00:00-05:00",
        status: "Pendiente de aprobación",
        priority: "Vencido",
        clientStage: "Orden confirmada",
        administrationStage: "Calidad pendiente",
        providerStage: "Producción terminada",
        components: [
            { id: "CMP-002-10", name: "Impresión", provider: "Proveedor Integral 03", workOrder: "OT-2026-000004", dueDate: "2026-09-09", status: "Pendiente de aprobación", progress: 100 },
            { id: "CMP-002-20", name: "Estructura", provider: "Proveedor Integral 03", workOrder: "OT-2026-000004", dueDate: "2026-09-09", status: "Aprobado", progress: 100 },
            { id: "CMP-002-30", name: "Armado", provider: "Proveedor Integral 03", workOrder: "OT-2026-000004", dueDate: "2026-09-11", status: "Terminado", progress: 100 }
        ],
        history: [
            { actor: "Cliente", action: "Creó la orden", date: "2026-09-03T14:05:06-05:00" },
            { actor: "Administración", action: "Asignó la orden completa", date: "2026-09-04T08:30:00-05:00" },
            { actor: "Proveedor", action: "Cerró los tres procesos", date: "2026-09-11T11:20:00-05:00" }
        ]
    },
    {
        id: "CLI-002-000003",
        instanceId: "NEXO-DEMO-002",
        clientCode: "CLI-002",
        clientName: "Cliente nacional",
        store: "CENTRO 12",
        city: "Medellín",
        product: "Carpa",
        reference: "CENTRO12/MEDELLIN/CARPA/3X3",
        createdAt: "2026-09-12T10:20:00-05:00",
        promisedAt: "2026-09-24T17:00:00-05:00",
        status: "Por asignar",
        priority: "En tiempo",
        clientStage: "Ficha recibida",
        administrationStage: "Pendiente de asignación",
        providerStage: "Sin proveedor",
        components: [
            { id: "CMP-003-10", name: "Impresión", provider: "Sin asignar", workOrder: "—", dueDate: "—", status: "Por asignar", progress: 0 },
            { id: "CMP-003-20", name: "Estructura", provider: "Sin asignar", workOrder: "—", dueDate: "—", status: "Por asignar", progress: 0 },
            { id: "CMP-003-30", name: "Armado", provider: "Sin asignar", workOrder: "—", dueDate: "—", status: "Por asignar", progress: 0 }
        ],
        history: [
            { actor: "Cliente", action: "Creó la orden y adjuntó la ficha", date: "2026-09-12T10:20:00-05:00" }
        ]
    }
];
