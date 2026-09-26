import { useEffect, useMemo, useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import { ButtonDownload } from "../../components/ButtonDownload";
import { ButtonMenu } from "../../components/ButtonMenu";
import { AiButton } from "../../components/ChatAiComponents/AiButton";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { PathLocation } from "../../components/PathLocation";
import { SearchBar } from "../../components/SearchBar";
import { SelectOptions } from "../../components/SelectOptions";
import './BriefCaseReport.css'
import './ReportDocuments.css'
import './AdvancesReportDetail.css'
import { UniversalTable } from "../universalTable";
import { moneyFormat, postInfo } from "../../../../utils/functions";
import { useAppInfo } from "../../../../context/context";
import { useParams } from "react-router-dom";
import { LabelValue } from "../../components/LabelValue";

const numberValue = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const toDateLabel = (value) => (value ? String(value).substring(0, 10) : '');

// Columnas del detalle: key = campo de cada anticipo (/treasury/getThirdPartyAdvances).
const advancesDetailColumns = [
    { key: 'ownSerial', label: 'Documento', flex: '1 1 10rem', minWidth: '9rem' },
    { key: 'currency', label: 'Moneda', flex: '0 1 7rem', minWidth: '6rem' },
    { key: 'total', label: 'Total', flex: '1 1 9rem', minWidth: '8rem' },
    { key: 'used_amount', label: 'Usado', flex: '1 1 9rem', minWidth: '8rem' },
    { key: 'available_amount', label: 'Disponible', flex: '1 1 9rem', minWidth: '8rem' },
    { key: 'business_date', label: 'Fecha creación', flex: '1 1 10rem', minWidth: '9rem' }
];

const advancesDetailXlsxColumns = [
    { header: "Documento", key: "document_label", width: 16 },
    { header: "Moneda", key: "currency", width: 10 },
    { header: "Total", key: "total", type: "number", numFmt: "#,##0.00", width: 16 },
    { header: "Usado", key: "used_amount", type: "number", numFmt: "#,##0.00", width: 16 },
    { header: "Disponible", key: "available_amount", type: "number", numFmt: "#,##0.00", width: 16 },
    { header: "Fecha creación", key: "business_date", width: 16 }
];

const renderMoney = ({ value }) => <span>$ {moneyFormat(numberValue(value))}</span>;
const renderDocument = ({ value }) => <span>#{value ?? '—'}</span>;
const renderDate = ({ value, info: row }) => <span>{value || toDateLabel(row.created_at_local) || toDateLabel(row.created_at) || '—'}</span>;

const advancesDetailRenderers = {
    ownSerial: renderDocument,
    total: renderMoney,
    used_amount: renderMoney,
    available_amount: renderMoney,
    business_date: renderDate
};

export function AdvancesReportDetail(){

    //Requirements
    const params = useParams();
    const {appInfo} = useAppInfo();

    // Control
    const [info,setInfo] = useState([]);
    const [visibleRows,setVisibleRows] = useState([]);
    const [thirdPartyInfo,setThirdPartyInfo] = useState({});
    const [loading,setLoading] = useState(true);
    const [loadError,setLoadError] = useState('');
    const [searchValue,setSearchValue] = useState();

    const getThirdPartyAdvances = async()=>{
        setLoading(true);
        setLoadError('');
        try {
            const res = await postInfo('/treasury/getThirdPartyAdvances',{
                company_id: appInfo.company_id,
                thirdParty_id: params.thirdParty_id
            });
            if(res?.status !== 'OK' || !Array.isArray(res.advances)) throw new Error(res?.message || 'Invalid advances response');
            setInfo(res.advances);
        } catch {
            setInfo([]);
            setLoadError('No se pudo cargar el saldo a favor. Vuelve a abrir el informe para intentarlo de nuevo.');
        } finally {
            setLoading(false);
        }
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
        getThirdPartyAdvances();
        getThirdPartyInfo();
    },[]);

    // Filas normalizadas: etiqueta de documento para búsqueda y exportación.
    const tableRows = useMemo(() => (Array.isArray(info) ? info : []).map((row) => ({
        ...row,
        document_label: `#${row.ownSerial ?? ''}`
    })), [info]);

    // Totales del tercero (independientes de la búsqueda).
    const { totalAmount, totalUsed, totalAvailable } = useMemo(() => (Array.isArray(info) ? info : []).reduce((totals, row) => ({
        totalAmount: totals.totalAmount + numberValue(row.total),
        totalUsed: totals.totalUsed + numberValue(row.used_amount),
        totalAvailable: totals.totalAvailable + numberValue(row.available_amount)
    }), { totalAmount: 0, totalUsed: 0, totalAvailable: 0 }), [info]);

    const rowsForExport = visibleRows.length ? visibleRows : tableRows;

    const getAdvancesXlsxOptions = () => ({
        companyName: appInfo.legal_name || appInfo.trade_name || appInfo.company_name || "Compañía",
        reportName: `Informe Saldos a favor - ${thirdPartyInfo.names || '---'}`,
        startRow: 4
    });

    return(
        <div className="BriefCaseReport ReportDocument AdvancesReportDetail sgaTreasury">

            <div className="headReport">
                <PathLocation/>
                <BoldTitle text={`Saldo a favor de "${thirdPartyInfo.names? thirdPartyInfo.names:'---'}"`}/>
                <DescriptionSpan text={'Consulte el saldo a favor (anticipos) del tercero'}/>
            </div>

            <div className="totalsBalanceC">
                <LabelValue title={"Total anticipos"} value={<b>{moneyFormat(totalAmount)}</b>} />
                <LabelValue title={"Usado"} value={<b>{moneyFormat(totalUsed)}</b>} />
                <LabelValue title={"Disponible"} value={<b>{moneyFormat(totalAvailable)}</b>} />
            </div>

            <div className="settingsReport">

                <SearchBar placeholder={"Buscar"} action={setSearchValue}/>

                <SelectOptions
                    options={[
                        "Ascendente (fecha)",
                        "Descendente (fecha)",
                        "Ascendente (Nombre)",
                        "Descendente (Nombre)",
                    ]}
                    title={"Orden"}
                />

                <ButtonMenu title={"Agregar a favoritos"} children={<i className="fa-regular fa-star" />} noRotate={true} />

                <AiButton attached={rowsForExport} sugerence={[
                    {text:'¿Cuánto saldo a favor tiene disponible este tercero?',context:`Procesos - Saldos a favor - Anticipos - Detalle`},
                    {text:'Realiza un analisis de este informe',context:`Procesos - Saldos a favor - Anticipos - Detalle`},
                    {text:'¿Qué acciones me recomiendas basado en este informe?',context:`Procesos - Saldos a favor - Anticipos - Detalle`}
                ]}/>

                <ButtonDownload
                    info={rowsForExport}
                    columns={advancesDetailXlsxColumns}
                    title={"Informe_Saldos_a_favor"}
                    component={"bodyreport"}
                    xlsxOptions={getAdvancesXlsxOptions}
                />

            </div>

            {loadError && <p role="alert">{loadError}</p>}
            <div className="SpaceReport" id="bodyreport">
                <UniversalTable
                    columns={advancesDetailColumns}
                    results={tableRows}
                    searchValue={searchValue}
                    loading={loading}
                    getRowKey={row => row.id}
                    onResultsChange={setVisibleRows}
                    rowProps={{ renderers: advancesDetailRenderers }}
                    emptyMessage={loadError || 'No hay saldo a favor para mostrar'}
                />
            </div>

        </div>
    )
}
