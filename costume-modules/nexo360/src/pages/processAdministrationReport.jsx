import { WarningForm } from "../../../../Facturation/Facturation/src/modules/userApp/components/WarningForm";
import { FormButton } from "../../../../Facturation/Facturation/src/modules/userApp/components/FormButton";
import { TagIndicator } from "../../../../Facturation/Facturation/src/modules/userApp/components/TagIndicator";
import { UniversalRow } from "../../../../Treasury/SGA - Treasuty/src/modules/userApp/components/universalRow";
import { UniversalTable } from "../../../../Treasury/SGA - Treasuty/src/modules/userApp/containers/universalTable";
import { FormNewThirdPartyDelegation } from "../../../../Facturation/Facturation/src/modules/userApp/containers/forms/FormNewThirdPartyDelegation";
import { CheckSquare } from "../../../../Facturation/Facturation/src/modules/userApp/components/CheckSquare";
import { DocumentPreview } from "../../../../Facturation/Facturation/src/modules/userApp/containers/Alerts/DocumentPreview";
import { ButtonDownload } from "../../../../Facturation/Facturation/src/modules/userApp/components/ButtonDownload";
import { ActionsPannel } from "../../../../Facturation/Facturation/src/modules/userApp/components/actionsPannel";
import { FormNewInvoice } from "../../../../Facturation/Facturation/src/modules/userApp/containers/forms/FormNewInvoice";
import { FormNewPurchaseOrder } from "../../../../Facturation/Facturation/src/modules/userApp/containers/forms/FormNewPurchaseOrder";
import { FormNewFacturationOrder } from "../../../../Facturation/Facturation/src/modules/userApp/components/FormNewFacturationOrder";
import { FormDeliveryOrder } from "../containers/FormDeliveryOrder";
import { useMemo, useState } from "react";
import { ProcessAdministrationTable } from "../containers/processAdministrationTable";
import { useProcessAdministrationReport } from "../hooks/useProcessAdministrationReport";
import "./processAdministrationReport.css";
import { PathLocation } from "../../../../Facturation/Facturation/src/modules/userApp/components/PathLocation";
import { BoldTitle } from "../../../../Facturation/Facturation/src/modules/userApp/components/BoldTitle";
import { SearchBar } from "../../../../Facturation/Facturation/src/modules/userApp/components/SearchBar";
import { RangeDate } from "../../../../Treasury/SGA - Treasuty/src/modules/userApp/components/RangeDate";
import { ProcessStatusAlert } from "../../../../Facturation/Facturation/src/modules/userApp/containers/Alerts/ProcessStatusAlert";
import { DescriptionSpan } from "../../../zjSAS.S/src/components/DescriptionSpan";

const exportColumns = [
    "reference",
    "clientName",
    "storeName",
    "storeCode",
    "city",
    "processName",
    "processInstanceName",
    "processStage",
    "deliveryAt",
    "deliveryAddress",
    "createdAt",
    "status",
    "paramDocReference",
    "orderTotal",
];

const withinCreatedRange = (createdAt, { minDate, maxDate }) => {
    if (!minDate && !maxDate) return true;
    if (!createdAt) return false;

    const day = String(createdAt).slice(0, 10);

    if (minDate && day < minDate) return false;
    if (maxDate && day > maxDate) return false;

    return true;
};

export function ProcessAdministrationReport({ appInfo, useAlert }) {
    const { popInAlert, popOutAlert } = useAlert();
    const report = useProcessAdministrationReport(appInfo?.company_id);

    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    const [filteredRows, setFilteredRows] = useState([]);
    const [selectionNotice, setSelectionNotice] = useState("");
    const [dateRange, setDateRange] = useState({ minDate: "", maxDate: "" });

    const selectedOrderIdSet = useMemo(
        () => new Set(selectedOrderIds.map(String)),
        [selectedOrderIds]
    );

    const visibleOrders = useMemo(() => {
        const matchingOrders = report.filteredOrders.filter((order) =>
            withinCreatedRange(order.createdAt, dateRange)
        );

        const ordersById = new Map();

        report.orders.forEach((order) => {
            const orderId = String(order.id);

            if (selectedOrderIdSet.has(orderId)) {
                ordersById.set(orderId, order);
            }
        });

        matchingOrders.forEach((order) => {
            const orderId = String(order.id);

            if (!ordersById.has(orderId)) {
                ordersById.set(orderId, order);
            }
        });

        return [...ordersById.values()];
    }, [report.orders, report.filteredOrders, dateRange, selectedOrderIdSet]);

    const visibleTotal = filteredRows.reduce(
        (sum, order) => sum + (Number(order.orderTotal) || 0),
        0
    );

    const openProcess = (instanceId) => {
        if (instanceId) {
            popInAlert(<ProcessStatusAlert instance_id={instanceId} />);
        }
    };

    const openClientOrder = (order) =>
        popInAlert(
            <DocumentPreview
                data={{
                    ...order,
                    doc_id: order.doc_id || order.documentId || order.id,
                    doc_type: "Client Order",
                    ownSerial: order.ownSerial || order.id,
                    created_at: order.createdAt,
                }}
            />
        );

    const toggleOrder = (order) => {
        const orderId = String(order.id);

        setSelectedOrderIds((current) =>
            current.includes(orderId)
                ? current.filter((id) => id !== orderId)
                : [...current, orderId]
        );
    };

    const getSelectedOrders = () =>
        report.orders.filter(({ id }) => selectedOrderIdSet.has(String(id)));

    const openBulkAssignment = () => {
        if (report.isDemo) {
            setSelectionNotice(
                "No es posible delegar órdenes demostrativas. El servidor local aún debe publicar el informe NEXO 360 con IDs reales de Client Order."
            );
            return;
        }

        const selectedOrders = getSelectedOrders();

        popInAlert(
            <FormNewThirdPartyDelegation
                clientOrders={selectedOrders.map(
                    (order) => order.doc_id || order.documentId || order.id
                )}
                reloadFun={() => setSelectedOrderIds([])}
            />
        );
    };

    const openInvoice = () => {
        if (report.isDemo) {
            setSelectionNotice(
                "No es posible facturar órdenes demostrativas. El servidor local aún debe publicar el informe NEXO 360 con IDs reales de Client Order."
            );
            return;
        }

        const selectedOrders = getSelectedOrders();

        popInAlert(
            <FormNewInvoice
                clientOrders={selectedOrders.map(
                    (order) => order.doc_id || order.documentId || order.id
                )}
            />
        );
    };

    const openPurchaseOrder = () => {
        if (report.isDemo) {
            setSelectionNotice(
                "No es posible generar órdenes de compra con órdenes demostrativas. El servidor local aún debe publicar el informe NEXO 360 con IDs reales de Client Order."
            );
            return;
        }

        const selectedOrders = getSelectedOrders();

        popInAlert(
            <FormNewPurchaseOrder
                clientOrders={selectedOrders.map(
                    (order) => order.doc_id || order.documentId || order.id
                )}
            />
        );
    };

    const openFacturationOrder = () => {
        if (report.isDemo) {
            setSelectionNotice(
                "No es posible generar órdenes de facturación con órdenes demostrativas. El servidor local aún debe publicar el informe NEXO 360 con IDs reales de Client Order."
            );
            return;
        }

        const selectedOrders = getSelectedOrders();

        popInAlert(
            <FormNewFacturationOrder
                clientOrders={selectedOrders.map(
                    (order) => order.doc_id || order.documentId || order.id
                )}
            />
        );
    };

    const openDeliveryOrder = () => {
        if (report.isDemo) {
            setSelectionNotice(
                "No es posible crear órdenes de entrega con datos demostrativos. El informe debe incluir IDs reales de órdenes de cliente y producción."
            );
            return;
        }

        const selectedOrders = getSelectedOrders();

        if (!selectedOrders.length) {
            setSelectionNotice(
                "Selecciona al menos una orden antes de crear la orden de entrega."
            );
            return;
        }

        popInAlert(
            <FormDeliveryOrder
                orders={selectedOrders}
                onCancel={popOutAlert}
            />
        );
    };
    const openActionsPannel = () => {
        const selectedOrders = getSelectedOrders();
        const clientKeys = new Set(
            selectedOrders.map(
                (order) => `${order.thirdPartyId ?? order.clientName ?? ""}`
            )
        );
        const multipleClients = clientKeys.size > 1;

        return popInAlert(
            <div className="actionsAlert">
                <BoldTitle text="Acciones órdenes" />
                <DescriptionSpan
                    text={`Se han seleccionado ${selectedOrderIds.length} órdenes.`}
                />

                {multipleClients && (
                    <WarningForm
                        tittle="Varios terceros seleccionados"
                        desc="La entrega y la orden de compra admiten varios clientes. Facturar y generar la orden de facturación requieren seleccionar órdenes de un solo cliente."
                    />
                )}

                <ActionsPannel
                    actions={[
                        {
                            title: "Órdenes",
                            actions: [
                                {
                                    icon: <i className="bi bi-receipt" />,
                                    name: "Facturar",
                                    action: openInvoice,
                                    disabled: multipleClients,
                                },
                                {
                                    icon: <i className="bi bi-file-earmark-text" />,
                                    name: "Generar orden de facturación",
                                    action: openFacturationOrder,
                                    disabled: multipleClients,
                                },
                                {
                                    icon: <i className="bi bi-cash-coin" />,
                                    name: "Generar orden de compra",
                                    action: openPurchaseOrder,
                                },
                            ],
                        },
                        {
                            title: "Procesos",
                            actions: [
                                {
                                    icon: <i className="bi bi-people" />,
                                    name: "Asignar a proveedores",
                                    action: openBulkAssignment,
                                },
                                {
                                    icon: <i className="bi bi-truck" />,
                                    name: "Crear orden de entrega",
                                    action: openDeliveryOrder,
                                },
                                {
                                    icon: <i className="bi bi-arrow-up" />,
                                    name: "Avanzar",
                                    disabled: true,
                                },
                                {
                                    icon: <i className="bi bi-x-circle" />,
                                    name: "Cancelar",
                                    disabled: true,
                                },
                            ],
                        },
                    ]}
                />
            </div>
        );
    };

    return (
        <main className="processAdministrationReport ReportDocument">
            <header className="processAdministrationReportHeader">
                <div>
                    <PathLocation />
                    <BoldTitle text="Administración de procesos 4K 360" />
                </div>
            </header>

            <div className="settingsReport">
                <SearchBar
                    placeholder="Buscar documento"
                    value={report.search}
                    action={report.setSearch}
                />

                <div className="sgaTreasury">
                    <RangeDate
                        label="Rango de creación"
                        updateRange={setDateRange}
                        align="left"
                    />
                </div>

                {!report.loading && (
                    <ButtonDownload
                        info={filteredRows}
                        columns={exportColumns}
                        title="Informe administración procesos NEXO 360"
                        text="Descargar informe"
                    />
                )}
            </div>

            {report.notice && (
                <div
                    className="processAdministrationReportNotice"
                    role="status"
                >
                    <i className="fa-solid fa-circle-info" aria-hidden="true" />
                    {report.notice}
                </div>
            )}

            {selectionNotice && (
                <div className="processAdministrationReportNotice" role="alert">
                    <i
                        className="fa-solid fa-circle-exclamation"
                        aria-hidden="true"
                    />
                    {selectionNotice}
                </div>
            )}

            <ProcessAdministrationTable
                UniversalTable={UniversalTable}
                UniversalRow={UniversalRow}
                TagIndicator={TagIndicator}
                SearchBar={SearchBar}
                CheckSquare={CheckSquare}
                FormButton={FormButton}
                loading={report.loading}
                search={report.search}
                setSearch={report.setSearch}
                orders={visibleOrders}
                onFilteredResultsChange={setFilteredRows}
                totalValue={visibleTotal}
                total={report.orders.length}
                selectedOrderIds={selectedOrderIds}
                onToggleOrder={toggleOrder}
                onBulkAssign={openActionsPannel}
                onOpen={openClientOrder}
                onOpenProcess={openProcess}
            />
        </main>
    );
}



