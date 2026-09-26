import { useEffect, useMemo, useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import { ButtonDownload } from "../../components/ButtonDownload";
import { ButtonMenu } from "../../components/ButtonMenu";
import { AiButton } from "../../components/ChatAiComponents/AiButton";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { FormInput } from "../../components/FormInput";
import { PathLocation } from "../../components/PathLocation";
import { SearchBar } from "../../components/SearchBar";
import { SelectOptions } from "../../components/SelectOptions";
import './BriefCaseReport.css'
import './ReportDocuments.css'
import './PortfolioReportDetail.css'
import { FilterReports } from "./FilterReports";
import { UniversalTable } from "../universalTable";
import { moneyFormat, postInfo } from "../../../../utils/functions";
import { useAppInfo, useAlert } from "../../../../context/context";
import { useParams } from "react-router-dom";
import { LabelValue } from "../../components/LabelValue";
import { DocumentPreview } from "../Alerts/DocumentPreview";
import { ProcessStatusAlert } from "../Alerts/ProcessStatusAlert";

// Columnas de la tabla universal: la key apunta al campo (real o derivado) de
// cada fila para que búsqueda, orden y filtros del UniversalTable funcionen.
const portfolioColumns = [
    { key: 'store_name', label: 'Tienda', flex: '1 1 12rem', minWidth: '10rem' },
    { key: 'instance_label', label: 'Instancia', flex: '1 1 11rem', minWidth: '9rem' },
    { key: 'document_label', label: 'Documento', flex: '1 1 11rem', minWidth: '9rem' },
    { key: 'total', label: 'Valor', flex: '1 1 9rem', minWidth: '8rem' },
    { key: 'paid_amount', label: 'Pagado', flex: '1 1 9rem', minWidth: '8rem' },
    { key: 'pending_amount', label: 'Pendiente', flex: '1 1 9rem', minWidth: '8rem' },
    { key: 'due_date', label: 'Fecha vencimiento', flex: '1 1 10rem', minWidth: '9rem' },
    { key: 'created_at', label: 'Fecha creación', flex: '1 1 10rem', minWidth: '9rem' }
];

// Columnas para la exportación XLSX (keys alineadas a los campos derivados).
const portfolioXlsxColumns = [
    { header: "Tienda", key: "store_name", width: 24 },
    { header: "Instancia", key: "instance_label", width: 20 },
    { header: "Documento", key: "document_label", width: 20 },
    { header: "Valor", key: "total", type: "number", numFmt: "#,##0.00", width: 16 },
    { header: "Pagado", key: "paid_amount", type: "number", numFmt: "#,##0.00", width: 16 },
    { header: "Pendiente", key: "pending_amount", type: "number", numFmt: "#,##0.00", width: 16 },
    { header: "Fecha vencimiento", key: "due_date_label", width: 18 },
    { header: "Fecha creación", key: "created_at_label", width: 18 }
];

const toDateLabel = (value) => (value ? String(value).substring(0, 10) : '');
const renderMoney = ({ value }) => <span>$ {moneyFormat(parseFloat(value ?? 0))}</span>;
const renderDate = ({ value }) => <span>{value ? toDateLabel(value) : '—'}</span>;

export function PortfolioReportDetail(){

    //Requirements
    const params = useParams();
    const {appInfo} = useAppInfo();
    const {popInAlert} = useAlert();

    // Control
    const [info,setInfo] = useState([]);
    const [visibleRows,setVisibleRows] = useState([]);
    const [thirdPartyInfo,setThirdPartyInfo] = useState({});
    const [loading,setLoading] = useState(true);
    const [searchValue,setSearchValue] = useState();
    const [disabled,setDisabled] = useState(false);
    const [start_date,setStart_date] = useState(undefined);
    const [end_date,setEnd_date] = useState(undefined);
    const [visibleSettings,setVisibleSettings] = useState(false);

    // FormSettings (etiquetas legibles para el panel de ajustes/columnas)
    const columsTr = [
        "Tienda",
        "Instancia",
        "Documento",
        "Valor",
        "Pagado",
        "Pendiente",
        "Fecha vencimiento",
        "Fecha creación"
    ]

    const filters = [];

     const settingsReport = {
        columns: columsTr,
        company_id: appInfo.company_id,
        start_date,
        end_date,
        thirdParty_id:params.thirdParty_id
    };

    // Getters of info
    const getThirdPartyPortfolio = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/treasury/getThirdPartyPortfolio',settingsReport);
        setInfo(Array.isArray(res[1]) ? res[1] : []);
        setLoading(false);
        setDisabled(false);
    }
    const getThirdPartyInfo = async()=>{
        let res = await postInfo('/getThirdParties',{
            company_id:appInfo.company_id,
            id:params.thirdParty_id
        });
        if(res[0]){
            setThirdPartyInfo(res[1][0])
        }
    }

    useEffect(()=>{
        getThirdPartyPortfolio();
        getThirdPartyInfo();
    },[]);

    useEffect(()=>{
        setVisibleSettings(false);
        getThirdPartyPortfolio();
    },[start_date,end_date]);

    // Filas normalizadas: se agregan las etiquetas compuestas (documento e
    // instancia) y las fechas recortadas para que UniversalTable pueda
    // buscar/ordenar por ellas y la exportación muestre lo mismo que la tabla.
    const tableRows = useMemo(() => (Array.isArray(info) ? info : []).map((row) => ({
        ...row,
        document_label: row.doc_type ? `${row.doc_type}#${row.ownSerial ?? ''}` : '—',
        instance_label: row.process_code ? `${row.process_code}#${row.instance_serial ?? ''}` : '—',
        due_date_label: toDateLabel(row.due_date),
        created_at_label: toDateLabel(row.created_at)
    })), [info]);

    // Totales de la cartera completa del tercero (independientes de la búsqueda).
    const { totalUsed, totalPayed, totalPending } = useMemo(() => (Array.isArray(info) ? info : []).reduce((totals, element) => ({
        totalUsed: totals.totalUsed + parseFloat(element.total ?? 0),
        totalPayed: totals.totalPayed + parseFloat(element.paid_amount ?? 0),
        totalPending: totals.totalPending + parseFloat(element.pending_amount ?? 0)
    }), { totalUsed: 0, totalPayed: 0, totalPending: 0 }), [info]);

    // Renderers de celdas: mantienen los popovers de Documento e Instancia.
    const portfolioRenderers = useMemo(() => ({
        instance_label: ({ value, info: row }) => row.process_code ? (
            <button
                type="button"
                className="portfolioCellLink"
                onClick={(event) => { event.stopPropagation(); popInAlert(<ProcessStatusAlert instance_id={row.instance_id}/>); }}
            >
                {value}
            </button>
        ) : <span>{'—'}</span>,
        document_label: ({ value, info: row }) => row.doc_type ? (
            <button
                type="button"
                className="portfolioCellLink"
                onClick={(event) => { event.stopPropagation(); popInAlert(<DocumentPreview data={row}/>); }}
            >
                {value}
            </button>
        ) : <span>{'—'}</span>,
        total: renderMoney,
        paid_amount: renderMoney,
        pending_amount: renderMoney,
        due_date: renderDate,
        created_at: renderDate
    }), [popInAlert]);

    // Las fuentes de IA y descarga usan las filas visibles (tras búsqueda/orden/filtros).
    const rowsForExport = visibleRows.length ? visibleRows : tableRows;

    const getPortfolioXlsxOptions = () => ({
        companyName: appInfo.legal_name || appInfo.trade_name || appInfo.company_name || "Compañía",
        reportName: `Informe de cartera - ${thirdPartyInfo.names || '---'}`,
        period: `${toDateLabel(start_date) || '1900-01-01'} a ${toDateLabel(end_date) || toDateLabel(new Date().toISOString())}`,
        startRow: 4
    });

    return(
        <div className="BriefCaseReport ReportDocument PortfolioReportDetail sgaTreasury">

            <div className="headReport">
                <PathLocation/>
                <BoldTitle text={`Informe de cartera de "${thirdPartyInfo.names? thirdPartyInfo.names:'---'}"`}/>
                <DescriptionSpan text={'Consulte la cartera de los terceros de su aplicación'}/>
            </div>

            <div className="totalsBalanceC">
                <LabelValue title={"Usado"} value={<b>{moneyFormat(totalUsed)}</b>} />
                <LabelValue title={"Pendiente de pago"} value={<b>{moneyFormat(totalPending)}</b>} />
                <LabelValue title={"Pagado"} value={<b>{moneyFormat(totalPayed)}</b>} />
            </div>

            <div className="settingsReport">

                <SearchBar placeholder={"Buscar"} action={setSearchValue}/>

                <div className="rangeInput">
                    <FormInput type={"date"} title={"Fecha Inicial"} action={setStart_date} />
                    <span>-</span>
                    <FormInput type={"date"} title={"Fecha Final"} action={setEnd_date} />
                </div>

                <SelectOptions
                    options={[
                        "Ascendente (fecha)",
                        "Descendente (fecha)",
                        "Ascendente (Nombre)",
                        "Descendente (Nombre)",
                    ]}
                    title={"Orden"}
                />

                <ButtonMenu
                    title={"Mas Ajustes"}
                    children={<i className="fa-solid fa-sliders" />}
                    noRotate={true}
                    onClick={()=>{
                        setVisibleSettings(!visibleSettings)
                    }}
                />

                <ButtonMenu title={"Agregar a favoritos"} children={<i className="fa-regular fa-star" />} noRotate={true} />

                <AiButton attached={rowsForExport} sugerence={[
                    {text:'¿Que proceso deberia priorizar?',context:`Procesos - Cartera - Tercero - Cuentas por cobrar`},
                    {text:'Realiza un analisis de este informe',context:`Procesos - Cartera - Tercero - Cuentas por cobrar`},
                    {text:'¿Que acciones me recomiendas basado en este informe?',context:`Procesos - Cartera - Tercero - Cuentas por cobrar`}
                ]}/>

                <ButtonDownload
                    info={rowsForExport}
                    columns={portfolioXlsxColumns}
                    title={"Informe_Cartera"}
                    component={"bodyreport"}
                    xlsxOptions={getPortfolioXlsxOptions}
                />

                <FilterReports hidden={visibleSettings} columns={columsTr} filters={filters}/>

            </div>

            <div className="SpaceReport" id="bodyreport">
                <UniversalTable
                    columns={portfolioColumns}
                    results={tableRows}
                    searchValue={searchValue}
                    loading={loading}
                    disabled={disabled}
                    getRowKey={row => row.id ?? row.document_id}
                    onResultsChange={setVisibleRows}
                    rowProps={{ renderers: portfolioRenderers }}
                    emptyMessage="No hay cartera para mostrar"
                />
            </div>

        </div>
    )
}
