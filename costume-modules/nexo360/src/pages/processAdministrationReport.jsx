import { FormButton } from '../../../../Facturation/Facturation/src/modules/userApp/components/FormButton';
import { TagIndicator } from '../../../../Facturation/Facturation/src/modules/userApp/components/TagIndicator';
import { UniversalRow } from '../../../../Treasury/SGA - Treasuty/src/modules/userApp/components/universalRow';
import { UniversalTable } from '../../../../Treasury/SGA - Treasuty/src/modules/userApp/containers/universalTable';
import { FormNewThirdPartyDelegation } from '../../../../Facturation/Facturation/src/modules/userApp/containers/forms/FormNewThirdPartyDelegation';
import { CheckSquare } from '../../../../Facturation/Facturation/src/modules/userApp/components/CheckSquare';
import { LoadingSpace } from '../../../../Facturation/Facturation/src/modules/userApp/containers/LoadingSpace';
import { DocumentPreview } from '../../../../Facturation/Facturation/src/modules/userApp/containers/Alerts/DocumentPreview';
import { ButtonDownload } from '../../../../Facturation/Facturation/src/modules/userApp/components/ButtonDownload';
import { SearchBar } from "../../../../Facturation/Facturation/src/modules/userApp/components/SearchBar";
import { useState } from "react";
import { ProcessMetricFilter } from "../components/processMetricFilter";
import { ProcessAdministrationTable } from "../containers/processAdministrationTable";
import { useProcessAdministrationReport } from "../hooks/useProcessAdministrationReport";
import "./processAdministrationReport.css";

const exportColumns = ["id", "clientName", "store", "city", "product", "status", "clientStage", "administrationStage", "providerStage", "promisedAt"];

export function ProcessAdministrationReport({ appInfo, useAlert }) {
    const { popInAlert } = useAlert();
    const report = useProcessAdministrationReport(appInfo?.company_id);
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    const [selectionNotice, setSelectionNotice] = useState("");
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
                <span>NEXO 360 · Informe personalizado</span>
                <h1>Administración de procesos</h1>
            </div>
            <ButtonDownload info={report.filteredOrders} columns={exportColumns} title="Informe administración procesos NEXO 360" text="Descargar informe" />
        </header>

        <ProcessMetricFilter FormButton={FormButton} totals={report.totals} value={report.quickFilter} onChange={report.selectQuickFilter} />
        {report.notice && <div className="processAdministrationReportNotice" role="status"><i className="fa-solid fa-circle-info" aria-hidden="true" />{report.notice}</div>}
        {selectionNotice && <div className="processAdministrationReportNotice" role="alert"><i className="fa-solid fa-circle-exclamation" aria-hidden="true" />{selectionNotice}</div>}
        {report.loading
            ? <LoadingSpace />
            : <ProcessAdministrationTable UniversalTable={UniversalTable} UniversalRow={UniversalRow} SearchBar={SearchBar} CheckSquare={CheckSquare} FormButton={FormButton} search={report.search} setSearch={report.setSearch} orders={report.filteredOrders} total={report.orders.length} selectedOrderIds={selectedOrderIds} onToggleOrder={toggleOrder} onBulkAssign={openBulkAssignment} onOpen={openClientOrder} />}
    </main>;
}
