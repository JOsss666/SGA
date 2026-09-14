import "./processAdministrationTable.css";

const columns = [
    { key: "select", label: "Seleccionar", flex: "0 0 7rem", minWidth: "7rem", sortable: false, filterable: false },
    { key: "order", label: "Orden / cliente", flex: "1.35 1 14rem" },
    { key: "product", label: "Producto", flex: "1 1 11rem" },
    { key: "clientStage", label: "Cliente", flex: "1 1 12rem" },
    { key: "administrationStage", label: "Administración", flex: "1 1 13rem" },
    { key: "providerSummary", label: "Proveedor", flex: "1 1 13rem" },
    { key: "commitment", label: "Compromiso", flex: "1 1 10rem" },
    { key: "status", label: "Estado", flex: "1 1 11rem" }
];
const shortDate = (value) => value ? new Intl.DateTimeFormat("es-CO", { day:"2-digit", month:"short", year:"numeric" }).format(new Date(value)) : "Sin fecha";

export function ProcessAdministrationTable({ UniversalTable, UniversalRow, SearchBar, CheckSquare, FormButton, search, setSearch, orders, total, selectedOrderIds, onToggleOrder, onBulkAssign, onOpen }) {
    const results = orders.map((order) => {
        const providers = [...new Set((order.components || []).map(({ provider }) => provider).filter((name) => name && name !== "Sin asignar"))];
        return {
            ...order,
            order: `${order.id} ${order.clientName} ${order.store} ${order.city}`,
            providerSummary: providers.join(", ") || order.providerStage,
            commitment: shortDate(order.promisedAt)
        };
    });
    const renderers = {
        select: ({ info }) => <CheckSquare title="" checked={selectedOrderIds.includes(info.id)} action={() => onToggleOrder(info)} />,
        order: ({ info }) => <button type="button" className="processAdministrationTableOrder" onClick={() => onOpen(info)}><b>{info.id}</b><small>{info.clientName} · {info.store} · {info.city}</small></button>,
        product: ({ info }) => <span><b>{info.product}</b><small title={info.reference}>{info.reference}</small></span>,
        clientStage: ({ value }) => <span>{value}</span>,
        administrationStage: ({ value }) => <span>{value}</span>,
        providerSummary: ({ value }) => <span>{value}</span>,
        commitment: ({ info }) => <span><b>{shortDate(info.promisedAt)}</b><small>{info.priority}</small></span>,
        status: ({ info }) => <span><b>{info.status}</b><small>{(info.components || []).filter(({ progress }) => progress === 100).length}/{(info.components || []).length} procesos completos</small></span>
    };
    return <section className="processAdministrationTable">
        <header><div><h2>Ordenes del cliente</h2><p>Use los filtros de cada columna y abra una orden para revisar su ficha.</p></div><div className="processAdministrationTableTools"><SearchBar placeholder="Buscar orden, cliente, producto o proveedor" value={search} action={setSearch} /><strong>{orders.length} de {total}</strong></div></header>
        {selectedOrderIds.length > 0 && <div className="processAdministrationTableBulk"><span>{selectedOrderIds.length} orden{selectedOrderIds.length > 1 ? 'es' : ''} seleccionada{selectedOrderIds.length > 1 ? 's' : ''}: gestione los proveedores por cada ítem o componente.</span><FormButton text={`Asignar ${selectedOrderIds.length} órdenes`} onClick={onBulkAssign}/></div>}
        <div className="sgaTreasury"><UniversalTable columns={columns} results={results} searchValue={search} Row={UniversalRow} getRowKey={(order) => order.id} selectedRows={selectedOrderIds} rowHeight={76} height="min(56vh, 580px)" rowProps={{ renderers }} /></div>
    </section>;
}
