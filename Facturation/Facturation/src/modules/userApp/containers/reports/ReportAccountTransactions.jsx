import { useState, useEffect } from "react";
import { useAppInfo } from "../../../../context/context";
import { postInfo, moneyFormat } from "../../../../utils/functions";
import { BoldTitle } from "../../components/BoldTitle";
import { ButtonDownload } from "../../components/ButtonDownload";
import { ButtonMenu } from "../../components/ButtonMenu";
import { AiButton } from "../../components/ChatAiComponents/AiButton";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { FormInput } from "../../components/FormInput";
import { LabelValue } from "../../components/LabelValue";
import { PathLocation } from "../../components/PathLocation";
import { SearchBar } from "../../components/SearchBar";
import { SelectOptions } from "../../components/SelectOptions";
import { LoadingSpace } from "../LoadingSpace";
import { TableReport } from "../TableReport";
import { FilterReports } from "./FilterReports";
import { useParams } from "react-router-dom";


export function ReportAccountTransactions(){
     // Prev Info
    const params = useParams();
    const [info, setInfo] = useState([]);
    const [account_info,setAccount_info] = useState({});
    const { appInfo } = useAppInfo();
    const [searchValue,setSearchValue] = useState();

    // Control
    const [loadingAccInfo, setLoadingAccInfo] = useState(false);
    const [loading, setLoading] = useState(false);
    const [start_date,setStart_date] = useState(undefined);
    const [end_date,setEnd_date] = useState(undefined);
    const [visibleSettings,setVisibleSettings] = useState(false);
    const [totalCredit,setTotalCredit] = useState(0)
    const [totalDebit,setTotalDebit] = useState(0)

    const columns = [
        "ID",
        "Transacción",
        "Fecha Documento",
        "Tipo Doc",
        "Documento",
        "Cuenta",
        "Concepto",
        "Naturaleza",
        "Valor ",
        "Estado"
    ];

    const filters = {
        "Saldo":[
            {title:'Valor',
                options:[
                    {text:'Todas',value:true},
                    {text:'Distinto de 0',value:false}
                ],
                action:undefined
            }
        ]
    }

    const settingsAccount = {
        company_id:appInfo.company_id,
        id:params.account_id
    }

    const settingsReport = {
        columns: columns,
        company_id: appInfo.company_id,
        account_code:account_info.code,
        typePlanAccount:appInfo.accountPlanType,
        start_date,
        end_date,
        status:'posted'
    };

    const calcTotals = ()=>{
        let td = 0;
        info.forEach(element => {
            td += parseInt(element.total)
        });
        setTotalDebit(td);
        setTotalCredit(info.length);
    }

    useEffect(()=>{
        if(info.length >0){
            calcTotals();
        }
    },[info])

    const GetTransactionDetails = async () => {
        setLoading(true);
        try {
            const res = await postInfo("/getTransactionDetails", settingsReport);
            if (res && res[0]) {
                setInfo(res[1]);
            } else {
                setInfo([]);
            }
        } catch (error) {
            console.error("Error al obtener detalles de la transacción:", error);
        } finally {
            setLoading(false);
        }
    };

    const getAccountInfo = async()=>{
        setLoadingAccInfo(true)
        let res = await postInfo('/getAccounts',settingsAccount);
        console.log(res)
        if(res[0]){
            setAccount_info(res[1][0])
        }
        setLoadingAccInfo(false)
    }

    useEffect(()=>{
        getAccountInfo();
    },[])

    useEffect(() => {
        if(account_info.code != undefined){
            setVisibleSettings(false)
            GetTransactionDetails();
        }
    }, [account_info,start_date,end_date]);

    if(!loadingAccInfo){
        return (
            <div className="ReportDocument">
            <PathLocation />
            <div className="headReport">
                <BoldTitle text={`Balance - ${account_info.code} "${account_info.name}"`} />
                <DescriptionSpan text={`Balance de cuentas contables.`} />
            </div>
            <div className="totalsBalanceC">
                <LabelValue title={'Movimientos'} value={<b>{totalCredit}</b>}/>
                <LabelValue title={'Total'} value={<b>$ {moneyFormat(totalDebit)}</b>}/>
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
                <ButtonMenu title={"Mas Ajustes"} children={<i className="fa-solid fa-sliders" />} noRotate={true} onClick={()=>{
                    setVisibleSettings(!visibleSettings)
                }}/>
                <ButtonMenu title={"Agregar a favoritos"} children={<i className="fa-regular fa-star" />} noRotate={true} />
                <AiButton attached={info} sugerence={[
                    {text:'¿Que representa este informe?',context:`Procesos - Balance - Cuentas contables - Saldo`},
                    {text:'Realiza un analisis de este informe',context:`Procesos - Balance - Cuentas contables - Saldo`},
                    {text:'¿Que acciones me recomiendas basado en este informe?',context:`Procesos - Balance - Cuentas contables - Saldo`}
                ]}/>
                <ButtonDownload />
                <FilterReports hidden={visibleSettings} columns={columns} filters={filters}/>
            </div>
            <div className="SpaceReport">
                {!loading && (
                    <TableReport columns={settingsReport.columns} info={info} type={''} searchValue={searchValue}/>
                )}
                {loading && (
                <LoadingSpace title={"Cargando transacciónes"} description={"Esto no debe tardar mucho..."} />
                )}
            </div>
            </div>
        );
    }else{
        return(
            <LoadingSpace title={'Cargando información de la cuenta'} description={'Esto no debe tardar mucho...'}/>
        )
    }
}