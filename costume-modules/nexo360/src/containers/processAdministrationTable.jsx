import "./processAdministrationTable.css";

// Cada fila es una Orden de Cliente. Estado producción y Proveedores son
// multi-valor (arreglos): se muestran como TagIndicators pero conservan sus
// valores para que los filtros de la UniversalTable filtren por cada uno.
// Columnas de ancho FIJO (flex 0 0): no se comprimen al viewport; la tabla hace
// overflow-x cuando la suma excede el ancho disponible, y cada celda recorta con
// ellipsis su propio contenido si es más largo que su columna.
const columns = [
    { key: "select", label: "Seleccionar", flex: "0 0 7rem", minWidth: "7rem", sortable: false, filterable: false },
    { key: "order", label: "Orden de cliente", flex: "0 0 11rem", minWidth: "11rem", filterable: false },
    { key: "clientName", label: "Cliente", flex: "0 0 12rem", minWidth: "12rem" },
    { key: "processIdentifier", label: "Proceso", flex: "0 0 9rem", minWidth: "9rem" },
    { key: "processInstanceName", label: "Nombre del proceso", flex: "0 0 14rem", minWidth: "14rem" },
    { key: "paramDocReference", label: "Referencia", flex: "0 0 18rem", minWidth: "18rem" },
    { key: "processStage", label: "Etapa proceso", flex: "0 0 13rem", minWidth: "13rem" },
    { key: "commitment", label: "Compromiso", flex: "0 0 11rem", minWidth: "11rem" },
    { key: "createdAt", label: "Fecha de creación", flex: "0 0 11rem", minWidth: "11rem" },
    { key: "deliveryAt", label: "Fecha de entrega", flex: "0 0 11rem", minWidth: "11rem" },
    { key: "providers", label: "Proveedores", flex: "0 0 14rem", minWidth: "14rem" },
    { key: "productionStates", label: "Estado producción", flex: "0 0 16rem", minWidth: "16rem" },
];

const shortDate = (value) => value ? new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)) : "Sin fecha";

// Días entre hoy y la fecha de entrega (positivo = faltan días, negativo = vencido).
const daysToDelivery = (value) => {
    if (!value) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const delivery = new Date(value); delivery.setHours(0, 0, 0, 0);
    if (Number.isNaN(delivery.getTime())) return null;
    return Math.round((delivery - today) / 86400000);
};

// A tiempo: faltan 5 días o más. Cerca de vencer: faltan 4 o menos. Vencido: ya pasó.
const commitmentStatus = (value) => {
    const diff = daysToDelivery(value);
    if (diff === null) return "Sin fecha";
    if (diff < 0) return "Vencido";
    if (diff >= 5) return "A tiempo";
    return "Cerca de vencer";
};

// Tipo (color/icono) del TagIndicator para cada estado según su significado.
const commitmentTag = {
    "A tiempo": { type: "active", icon: "fa-solid fa-circle-check" },
    "Cerca de vencer": { type: "suspended", icon: "fa-solid fa-clock" },
    "Vencido": { type: "disabled", icon: "fa-solid fa-triangle-exclamation" },
    "Sin fecha": { type: "info", icon: "fa-solid fa-circle-question" }
};

const productionStateTag = (state) => {
    const normalized = String(state).toLowerCase();
    if (normalized.includes("por asignar")) return { type: "suspended", icon: "fa-solid fa-hourglass-half" };
    if (["cerrado", "terminad", "facturad", "entregad", "completad"].some((word) => normalized.includes(word))) return { type: "active", icon: "fa-solid fa-circle-check" };
    if (normalized.includes("asignado")) return { type: "blue", icon: "fa-solid fa-user-check" };
    return { type: "indicator", icon: "fa-solid fa-gears" };
};

// Tags de producción de la orden: un tag por subproceso (con su instance_id para
// abrirlo individualmente) + "Por asignar" (sin instancia) para los ítems que aún
// no se delegan o cuando no hay ningún subproceso.
const buildProductionTags = (order) => {
    const tags = (Array.isArray(order.subprocesses) ? order.subprocesses : [])
        .filter((subprocess) => subprocess && subprocess.name)
        .map((subprocess) => ({ name: subprocess.name, instance_id: subprocess.instance_id }));
    const hasUnassignedItems = (order.components || []).some((component) => component.status === "Por asignar" || !component.provider);
    if (hasUnassignedItems || tags.length === 0) tags.push({ name: "Por asignar", instance_id: null });
    return tags;
};

// Proveedores distintos de la orden (multi-valor). Sin proveedores => "Sin asignar".
const buildProviders = (order) => {
    const providers = [...new Set((order.components || []).map(({ provider }) => provider).filter((name) => name && name !== "Sin asignar"))];
    return providers.length > 0 ? providers : ["Sin asignar"];
};

export function ProcessAdministrationTable({ UniversalTable, UniversalRow, TagIndicator, SearchBar, CheckSquare, FormButton, search, setSearch, orders, total, selectedOrderIds, onToggleOrder, onBulkAssign, onOpen, onOpenProcess }) {
    const results = orders.map((order) => {
        const productionTags = buildProductionTags(order);
        return {
            ...order,
            itemsCount: (order.components || []).length,
            order: String(order.reference ?? order.id),
            processIdentifier: order.processOwnSerial ? `${order.processCode ?? ""}#${order.processOwnSerial}` : "—",
            paramDocReference: order.paramDocReference ?? "",
            productionTags,
            // Valores string para el filtro/búsqueda de la columna (los objetos van en productionTags).
            productionStates: productionTags.map((tag) => tag.name),
            providers: buildProviders(order),
            commitment: commitmentStatus(order.deliveryAt)
        };
    });

    const renderers = {
        select: ({ info }) => <CheckSquare title="" checked={selectedOrderIds.includes(info.id)} action={() => onToggleOrder(info)} />,
        order: ({ info }) => <button type="button" className="processAdministrationTableOrder" onClick={() => onOpen(info)}>
            <b>Orden #{info.reference ?? info.id}</b>
            <small>{info.itemsCount} ítem{info.itemsCount === 1 ? "" : "s"}</small>
        </button>,
        clientName: ({ value }) => <span>{value || "Sin cliente"}</span>,
        processIdentifier: ({ info }) => info.parentInstanceId
            ? <button type="button" className="processAdministrationTableProcess" onClick={() => onOpenProcess?.(info.parentInstanceId)}>{info.processIdentifier}</button>
            : <span>{info.processIdentifier}</span>,
        processInstanceName: ({ value }) => <span>{value || "—"}</span>,
        processStage: ({ value }) => <span>{value || "—"}</span>,
        productionStates: ({ info }) => <div className="processAdministrationTags">
            {(info.productionTags || []).map((tag, index) => {
                const style = productionStateTag(tag.name);
                const chip = <TagIndicator title={tag.name} type={style.type} icon={null} desc={`Subproceso: ${tag.name}`} />;
                // Cada tag abre el ProcessStatusAlert de SU subproceso; "Por asignar" no tiene instancia.
                return tag.instance_id
                    ? <button type="button" key={`${tag.name}-${tag.instance_id}`} className="processAdministrationTagButton" onClick={() => onOpenProcess?.(tag.instance_id)}>{chip}</button>
                    : <span key={`${tag.name}-${index}`}>{chip}</span>;
            })}
        </div>,
        providers: ({ value }) => <span>{(value || []).join(", ")}</span>,
        createdAt: ({ info }) => <span>{shortDate(info.createdAt)}</span>,
        deliveryAt: ({ info }) => <span>{shortDate(info.deliveryAt)}</span>,
        commitment: ({ value }) => {
            const tag = commitmentTag[value] || commitmentTag["Sin fecha"];
            return <TagIndicator title={value} type={tag.type} icon={null} desc={`Compromiso: ${value}`} />;
        },
        paramDocReference: ({ value }) => <span title={value}>{value || "—"}</span>
    };

    return <section className="processAdministrationTable">
        {selectedOrderIds.length > 0 && <div className="processAdministrationTableBulk"><span>{selectedOrderIds.length} orden{selectedOrderIds.length > 1 ? 'es' : ''} seleccionada{selectedOrderIds.length > 1 ? 's' : ''}: gestione los proveedores por cada ítem o componente.</span><FormButton text={`Asignar ${selectedOrderIds.length} órdenes`} onClick={onBulkAssign}/></div>}
        <div className="sgaTreasury"><UniversalTable columns={columns} results={results} searchValue={search} Row={UniversalRow} getRowKey={(order) => order.id} selectedRows={selectedOrderIds} rowHeight={76} height="min(56vh, 580px)" rowProps={{ renderers }} /></div>
    </section>;
}
