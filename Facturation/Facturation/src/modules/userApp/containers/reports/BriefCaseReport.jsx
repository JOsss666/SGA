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
import { FilterReports } from "./FilterReports";
import { TableReport } from "../TableReport";
import { moneyFormat, postInfo } from "../../../../utils/functions";
import { useAppInfo } from "../../../../context/context";
import { LoadingSpace } from "../LoadingSpace";

export function BriefCaseReport(){

    //Requirements
    const {appInfo,userConfig} = useAppInfo();

    // Control
    const [info,setInfo] = useState([]);
    const [loading,setLoading] = useState(true);
    const [disabled,setDisabled] = useState(false);
    const [searchValue,setSearchValue] = useState('');
    const [startDate, setStart_date] = useState();
    const [endDate,setEnd_date] = useState();
    const [visibleSettings,setVisibleSettings] = useState(false);

    // FormSettings
    const columsTr = [
        "Terceros",
        "Habilitado",
        "Plazo",
        "Cupo_max",
        "Cupo_disponible",
        "Cartera",
        "Corriente",
        "Vencido",
    ]

    const filters = [];

    const FormSettings = {
        columsTr
    }

    // Getters of info
    const getThirdParties = async(id,limit)=>{
        setDisabled(true);
        setLoading(true);

        let res = await postInfo('/getThirdParties',{
            company_id:appInfo.company_id,
            comercialInfo:true
        });

        console.log(res);

        if(res[0]){
            console.log("BACKEND DATA:", res[1]);
            setInfo(res[1])
        }

        setLoading(false);
        setDisabled(false);
    }

    useEffect(()=>{
        getThirdParties();
    },[])

    // [AGREGADO] Datos visibles en la tabla según el buscador
    // Esto asegura que el Excel/CSV exporte exactamente lo mismo que ve el usuario
    const tableData = useMemo(() => (
        Array.isArray(info)
            ? info.filter((row)=>
                Object.values(row)
                    .join(" ")
                    .toLowerCase()
                    .includes(searchValue.toLowerCase())
            )
            : []
    ), [info, searchValue]);

    const tableSummary = useMemo(() => {
        const parseMoneyValue = (value) => {
            const number = Number(value);
            return Number.isFinite(number) ? number : 0;
        };

        const totals = tableData.reduce((acc, row) => {
            const creditValue = parseMoneyValue(row.credit_value);
            const totalDebt = parseMoneyValue(row.thirdParty_totalDebt);

            acc["Cupo_disponible"] += creditValue - totalDebt;
            acc["Cartera"] += parseMoneyValue(row.thirdParty_balance ?? row.thirdParty_totalDebt);
            acc["Corriente"] += parseMoneyValue(row.thirdParty_currentBalance);
            acc["Vencido"] += parseMoneyValue(row.thirdParty_overdueBalance);

            return acc;
        }, {
            "Cupo_disponible": 0,
            "Cartera": 0,
            "Corriente": 0,
            "Vencido": 0
        });

        return Object.fromEntries(
            Object.entries(totals).map(([key, value]) => [
                key,
                `$ ${moneyFormat(Number(value.toFixed(2)))}`
            ])
        );
    }, [tableData]);

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
                <BoldTitle text={'Informe de cartera'}/>
                <DescriptionSpan text={'Consulte la cartera de los terceros de su aplicación'}/>
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
                        navigation={true}
                        columns={columsTr}
                        info={tableData} // [CAMBIO] ahora usa datos filtrados
                        searchValue={searchValue}
                        summaryValues={tableSummary}
                    />
                </div>
            )}

            {loading && (
                <LoadingSpace title={'Cargando cartera'} description={'Esto no debe tardar mucho'}/>
            )}

        </div>
    )
}
