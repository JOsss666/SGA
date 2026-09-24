import { FormButton } from '../../../../Facturation/Facturation/src/modules/userApp/components/FormButton';
import { TagIndicator } from '../../../../Facturation/Facturation/src/modules/userApp/components/TagIndicator';
import { UniversalRow } from '../../../../Treasury/SGA - Treasuty/src/modules/userApp/components/universalRow';
import { UniversalTable } from '../../../../Treasury/SGA - Treasuty/src/modules/userApp/containers/universalTable';
import { FormNewThirdPartyDelegation } from '../../../../Facturation/Facturation/src/modules/userApp/containers/forms/FormNewThirdPartyDelegation';
import { CheckSquare } from '../../../../Facturation/Facturation/src/modules/userApp/components/CheckSquare';
import { LoadingSpace } from '../../../../Facturation/Facturation/src/modules/userApp/containers/LoadingSpace';
import { DocumentPreview } from '../../../../Facturation/Facturation/src/modules/userApp/containers/Alerts/DocumentPreview';
import { ButtonDownload } from '../../../../Facturation/Facturation/src/modules/userApp/components/ButtonDownload';
import { useMemo, useState } from "react";
import { ProcessAdministrationTable } from "../containers/processAdministrationTable";
import { useProcessAdministrationReport } from "../hooks/useProcessAdministrationReport";
import "./processAdministrationReport.css";
import { PathLocation } from "../../../../Facturation/Facturation/src/modules/userApp/components/PathLocation";
import { BoldTitle } from "../../../../Facturation/Facturation/src/modules/userApp/components/BoldTitle";
import { SearchBar } from "../../../../Facturation/Facturation/src/modules/userApp/components/SearchBar";
import { RangeDate } from "../../../../Treasury/SGA - Treasuty/src/modules/userApp/components/RangeDate";
import { ProcessStatusAlert } from "../../../../Facturation/Facturation/src/modules/userApp/containers/Alerts/ProcessStatusAlert";

const exportColumns = ["reference", "clientName", "processName", "processInstanceName", "processStage", "deliveryAt", "createdAt", "status", "paramDocReference"];

// El rango de fechas del informe se evalúa sobre la fecha de creación de la orden.
const withinCreatedRange = (createdAt, { minDate, maxDate }) => {
    if (!minDate && !maxDate) return true;
    if (!createdAt) return false;
    const day = String(createdAt).slice(0, 10); // yyyy-MM-dd
    if (minDate && day < minDate) return false;
    if (maxDate && day > maxDate) return false;
    return true;
};

export function ProcessAdministrationReport({ appInfo, useAlert }) {
    const { popInAlert } = useAlert();
    const report = useProcessAdministrationReport(appInfo?.company_id);
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    const [filteredRows, setFilteredRows] = useState([]);
    const [selectionNotice, setSelectionNotice] = useState("");
    const [dateRange, setDateRange] = useState({ minDate: "", maxDate: "" });
    const visibleOrders = useMemo(
        () => report.filteredOrders.filter((order) => withinCreatedRange(order.createdAt, dateRange)),
        [report.filteredOrders, dateRange]
    );
    const openProcess = (instanceId) => { if (instanceId) popInAlert(<ProcessStatusAlert instance_id={instanceId} />); };
    const openClientOrder = (order) => popInAlert(<DocumentPreview data={{
        ...order,
        doc_id: order.doc_id || order.documentId || order.id,
        doc_type: "Client Order",
        ownSerial: order.ownSerial || order.id,
        created_at: order.createdAt
    }} />);
    const toggleOrder = (order) => setSelectedOrderIds((current) => (
        current.includes(order.id) ? current.filter((id) => id !== order.id) : [...current, order.id]
    ));
    const openBulkAssignment = () => {
        if (report.isDemo) {
            setSelectionNotice("No es posible delegar órdenes demostrativas. El servidor local aún debe publicar el informe NEXO 360 con IDs reales de Client Order.");
            return;
        }
        const selectedOrders = report.orders.filter(({ id }) => selectedOrderIds.includes(id));
        popInAlert(<FormNewThirdPartyDelegation
            clientOrders={selectedOrders.map((order) => order.doc_id || order.documentId || order.id)}
            reloadFun={() => setSelectedOrderIds([])}
        />);
    };

    return <main className="processAdministrationReport ReportDocument">
        <header className="processAdministrationReportHeader">
            <div>
                <PathLocation/>
                <BoldTitle text={'Administración de procesos'}/>
            </div>
        </header>
        <div className="settingsReport">
            <SearchBar placeholder={'Buscar documento'} value={report.search} action={report.setSearch}/>
            <div className="sgaTreasury">
                <RangeDate label="Rango de creación" updateRange={setDateRange} align="left"/>
            </div>
            {!report.loading && <ButtonDownload info={filteredRows} columns={exportColumns} title="Informe administración procesos NEXO 360" text="Descargar informe" />}
        </div>
        {report.notice && <div className="processAdministrationReportNotice" role="status"><i className="fa-solid fa-circle-info" aria-hidden="true" />{report.notice}</div>}
        {selectionNotice && <div className="processAdministrationReportNotice" role="alert"><i className="fa-solid fa-circle-exclamation" aria-hidden="true" />{selectionNotice}</div>}
        {report.loading
            ? <LoadingSpace />
            : <ProcessAdministrationTable UniversalTable={UniversalTable} UniversalRow={UniversalRow} TagIndicator={TagIndicator} SearchBar={SearchBar} CheckSquare={CheckSquare} FormButton={FormButton} search={report.search} setSearch={report.setSearch} orders={visibleOrders} onFilteredResultsChange={setFilteredRows} total={report.orders.length} selectedOrderIds={selectedOrderIds} onToggleOrder={toggleOrder} onBulkAssign={openBulkAssignment} onOpen={openClientOrder} onOpenProcess={openProcess} />}
    </main>;
}
