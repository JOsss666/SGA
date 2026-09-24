import { useEffect, useState } from "react";
import { useAppInfo } from "../../../../context/context";
import { postInfo, parseSettlementReportByPeriodToXlsx } from "../../../../utils/functions";
import { BoldTitle } from "../../components/BoldTitle";
import { ButtonMenu } from "../../components/ButtonMenu";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { FormInput } from "../../components/FormInput";
import { PathLocation } from "../../components/PathLocation";
import { SearchBar } from "../../components/SearchBar";
import "./ReportDocuments.css";
import { ButtonDownload } from "../../components/ButtonDownload";
import { AiButton } from "../../components/ChatAiComponents/AiButton";
import { TableCashBoxClose } from "../TableCashBoxClose";

const columnsOp = [
    "Responsable",
    "Caja",
    "Saldo inicial",
    "Saldo actual",
    "Saldo final",
    "Fecha de inicio",
    "Fecha de cierre",
    "Estado"
];

export function CashBoxesCloseReport() {

    // Prev Info
    const [info, setInfo] = useState([]);
    const [visibleRows, setVisibleRows] = useState([]);
    const [loadError, setLoadError] = useState('');
    const { appInfo } = useAppInfo();
    const [searchValue,setSearchValue] = useState("");

    // Actions Page
    const [loading, setLoading] = useState(true);


    // Filters
    const [startDate,setStartDate] = useState();
    const [endDate,setEndDate] = useState();
    const [cashStore_id] = useState();
    const [cashBox_id] = useState();

    // Settings Report
    useEffect(() => {
        let active = true;
        const getDocuments = async () => {
            setLoading(true);
            setLoadError('');
            try {
                const res = await postInfo('/facturation/getRegisterShift', {
                    columns: columnsOp,
                    company_id: appInfo.company_id
                });
                if (!res?.[0] || !Array.isArray(res[1])) throw new Error('Invalid shift response');
                if (active) setInfo(res[1]);
            } catch {
                if (active) {
                    setInfo([]);
                    setLoadError('No se pudieron cargar los cierres de caja. Vuelve a abrir el informe para intentarlo de nuevo.');
                }
            } finally {
                if (active) setLoading(false);
            }
        };
        getDocuments();
        return () => { active = false; };
    }, [appInfo.company_id]);

    const columnMap = {
        "Responsable": "responsable",
        "Caja": "cashBox_name",
        "Saldo inicial": "initialBalance",
        "Saldo actual": "actual_balance",
        "Saldo final": "expectedBalance",
        "Fecha de inicio": "opening_time",
        "Fecha de cierre": "closing_time",
        "Estado": "status"
    };

    const setInfoForReportDownload = () => {
        return visibleRows.map(element => {
            let row = {};

            columnsOp.forEach(col => {
                const key = columnMap[col];

                // ✔ trae el dato tal cual
                // ✔ si no existe → vacío
                row[col] = (key && element[key] !== undefined)
                    ? element[key]
                    : "";
            });

            return row;
        });
    };

    // Descarga el informe consolidado (liquidaciones de caja por periodo).
    const downloadConsolidado = async () => {
        let res = await postInfo('/facturation/getSettlementReportByPeriod', {
            company_id: appInfo.company_id,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            store_id: cashStore_id || undefined,
            cash_box_id: cashBox_id || undefined
        });
        if (!res[0]) {
            throw new Error('No se pudo obtener el informe consolidado.');
        }
        await parseSettlementReportByPeriodToXlsx(res[1], {
            title: `Informe_Consolidado_Cierres_Caja_${appInfo.legal_name}`,
            period: startDate && endDate ? `${startDate} a ${endDate}` : '',
            companyName: appInfo.legal_name
        });
    };

    return (
        <div className="ReportDocument">
        <PathLocation />
        <div className="headReport">
            <BoldTitle text={`Informe Cierres de caja`} />
            <DescriptionSpan text={`Informe de los cierres de caja.`} />
        </div>
        <div className="settingsReport">
            <SearchBar placeholder={"Buscar"} action={setSearchValue}/>
            <div className="rangeInput">
            <FormInput type={"date"} title={"Fecha Inicial"} action={setStartDate} />
            <span>-</span>
            <FormInput type={"date"} title={"Fecha Final"} action={setEndDate} />
            </div>
            <ButtonMenu title={"Mas Ajustes"} children={<i className="fa-solid fa-sliders" />} noRotate={true} />
            <ButtonMenu title={"Agregar a favoritos"} children={<i className="fa-regular fa-star" />} noRotate={true} />
            <AiButton attached={visibleRows} sugerence={[
                {text:'¿Que representa este informe?',context:`Procesos - Informe `},
                {text:'Realiza un analisis de este informe',context:`Procesos - Informe - `},
                {text:'¿Que acciones me recomiendas basado en este informe?',context:`Procesos - Informe - `}
            ]}/>
            <div className="downloadContainer">
                <ButtonDownload
                    info={setInfoForReportDownload()}
                    title={"Informe_Cierres_Caja"}
                    text={'Consolidado'}
                    onDownload={downloadConsolidado}
                />
                <ButtonDownload
                    info={setInfoForReportDownload()}
                    title={"Informe_Cierres_Caja"}
                />
            </div>
        </div>
        {loadError && <p role="alert">{loadError}</p>}
        <div className="SpaceReport" id="SpaceReport">
            <TableCashBoxClose
                info={info}
                columns={columnsOp}
                searchValue={searchValue}
                loading={loading}
                onResultsChange={setVisibleRows}
            />
        </div>
        </div>
    );
}
