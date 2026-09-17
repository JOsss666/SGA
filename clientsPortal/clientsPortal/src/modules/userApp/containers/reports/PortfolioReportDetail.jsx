import { useEffect, useState } from "react";
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
import { FilterReports } from "./FilterReports";
import { TableReport } from "../TableReport";
import { moneyFormat, postInfo } from "../../../../utils/functions";
import { useAppInfo } from "../../../../context/context";
import { LoadingSpace } from "../LoadingSpace";
import { useParams } from "react-router-dom";
import { LabelValue } from "../../components/LabelValue";

export function PortfolioReportDetail(){

    //Requirements
    const params = useParams();
    console.log(params)
    const {appInfo,userConfig} = useAppInfo();

    // Control
    const [info,setInfo] = useState([]);
    const [thirdPartyInfo,setThirdPartyInfo] = useState({});
    const [loading,setLoading] = useState(true);
    const [searchValue,setSearchValue] = useState('')
    const [disabled,setDisabled] = useState(false);
    const [start_date,setStart_date] = useState(undefined);
    const [end_date,setEnd_date] = useState(undefined);
    const [visibleSettings,setVisibleSettings] = useState(false);
    const [totalUsed,setTotalUsed] = useState(0)
    const [totalPayed,setTotalPayed] = useState(0)
    const [totalPendig,setTotalPending] = useState(0)

    // FormSettings
    const columsTr = [
        "Tienda",
        "Instancia",
        "Documento",
        "Valor",
        "Pagado",
        "Pendiente",
        "Fecha vencimiento",
        "Fecha creación",
        //"Ultima actualización"
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
    const getThirdPartyPortfolio = async(id,limit)=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/treasury/getThirdPartyPortfolio',settingsReport);
        setInfo(res[1])
        setLoading(false);
        setDisabled(false);
    }
    const getThirdPartyInfo = async()=>{
        let res = await postInfo('/getThirdParties',{
            company_id:appInfo.company_id,
            id:params.thirdParty_id
        });
        console.log(res)
        if(res[0]){
            setThirdPartyInfo(res[1][0])
        }
    }

    useEffect(()=>{
        getThirdPartyPortfolio();
        getThirdPartyInfo();
    },[]);

    useEffect(()=>{
        let newTtlused = 0;
        let newTtlpayed = 0;
        let newTtlpending = 0;

        info.forEach(element => {
            newTtlused += parseFloat(element.total);
            newTtlpending += parseFloat(element.pending_amount);
            newTtlpayed += parseFloat(element.paid_amount);
        });

        setTotalPayed(newTtlpayed);
        setTotalPending(newTtlpending);
        setTotalUsed(newTtlused);

    },[info])

    useEffect(()=>{
        setVisibleSettings(false);
        getThirdPartyPortfolio();
    },[start_date,end_date]);

    // Esto asegura que el Excel/CSV exporte exactamente lo mismo que ve el usuario
    const tableData = Array.isArray(info)
        ? info.filter((row)=>
            Object.values(row)
                .join(" ")
                .toLowerCase()
                .includes(searchValue.toLowerCase())
        )
        : [];

    const columnMap = {
        "Terceros": "names",
        "Habilitado": "credit",
        "Plazo": "credit_term",
        "Cupo_max": "credit_value",
        "Cupo_disponible": "aviable_credit",
        "Cartera": "thirdParty_totalDebt",
        "Corriente": "thirdParty_currentBalance",
        "Vencido": "thirdParty_overdueBalance"
    };

    const setInfoForReportDownload = () => {
        return tableData.map(element => {

            let row = {};

            columsTr.forEach(col => {

                const key = columnMap[col];
                let value = element[key] ?? "";

                // Formatear boolean
                if(key === "credit"){
                    value = value ? "SI" : "NO";
                }

                // Formatear números
                if(
                    key === "credit_value" ||
                    key === "aviable_credit" ||
                    key === "thirdParty_totalDebt" ||
                    key === "thirdParty_currentBalance" ||
                    key === "thirdParty_overdueBalance"
                ){
                    value = Number(value);
                }

                row[col] = value;

            });

            return row;
        });
    };

    return(
        <div className="BriefCaseReport ReportDocument">

            <div className="headReport">
                <PathLocation/>
                <BoldTitle text={`Informe de cartera de "${thirdPartyInfo.names? thirdPartyInfo.names:'---'}"`}/>
                <DescriptionSpan text={'Consulte la cartera de los terceros de su aplicación'}/>
            </div>

            <div className="totalsBalanceC">

                <LabelValue title={"Usado"} value={<b>{moneyFormat(totalUsed)}</b>} />
                <LabelValue title={"Pendiente de pago"} value={<b>{moneyFormat(totalPendig)}</b>} />
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

                {/* [CAMBIO] ahora AI usa los datos filtrados */}
                <AiButton attached={tableData} sugerence={[
                    {text:'¿Que proceso deberia priorizar?',context:`Procesos - Balance - Cuentas contables - Saldo`},
                    {text:'Realiza un analisis de este informe',context:`Procesos - Balance - Cuentas contables - Saldo`},
                    {text:'¿Que acciones me recomiendas basado en este informe?',context:`Procesos - Balance - Cuentas contables - Saldo`}
                ]}/>

                {/* [CAMBIO] ButtonDownload ahora exporta la tabla visible */}
                <ButtonDownload
                    info={setInfoForReportDownload()}
                    columns={columsTr}
                    title={"Informe_Cartera"}
                />

                <FilterReports hidden={visibleSettings} columns={columsTr} filters={filters}/>

            </div>

            {!loading && (
                // [AGREGADO] id para permitir exportación de screenshot/pdf
                <div className="bodyreport" id="bodyreport">
                    <TableReport
                        columns={columsTr}
                        info={tableData} // [CAMBIO] ahora usa datos filtrados
                        searchValue={searchValue}
                    />
                </div>
            )}

            {loading && (
                <LoadingSpace title={'Cargando cartera'} description={'Esto no debe tardar mucho'}/>
            )}

        </div>
    )
}