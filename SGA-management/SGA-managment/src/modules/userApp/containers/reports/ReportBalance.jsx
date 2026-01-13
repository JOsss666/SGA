import { useEffect, useState } from "react";
import { useAppInfo } from "../../../../context/context";
import { moneyFormat, postInfo } from "../../../../utils/functions";
import { BoldTitle } from "../../components/BoldTitle";
import { ButtonMenu } from "../../components/ButtonMenu";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { FormButton } from "../../components/FormButton";
import { FormInput } from "../../components/FormInput";
import { PathLocation } from "../../components/PathLocation";
import { SearchBar } from "../../components/SearchBar";
import { SelectOptions } from "../../components/SelectOptions";
import { TableReport } from "../TableReport";
import "./ReportDocuments.css";
import { LoadingSpace } from "../LoadingSpace";
import { ButtonDownload } from "../../components/ButtonDownload";
import { AiButton } from "../../components/ChatAiComponents/AiButton";
import { LabelValue } from "../../components/LabelValue";
import { SearchinList } from "../../components/SearchInList";
import { FilterReports } from "./FilterReports";

export function ReportBalance({}) {

    // Prev Info
    const [info, setInfo] = useState([]);
    const { appInfo } = useAppInfo();
    const [searchValue,setSearchValue] = useState();

    // Control
    const [loading, setLoading] = useState(false);
    const [start_date,setStart_date] = useState(undefined);
    const [end_date,setEnd_date] = useState(undefined);
    const [allAccounts,setAllAccounts] = useState(false);
    const [visibleSettings,setVisibleSettings] = useState(false);
    const [totalCredit,setTotalCredit] = useState(0)
    const [totalDebit,setTotalDebit] = useState(0)
    const [totalBalance,setTotalBalance] = useState(0)
    const [totalInitialBalance,setTotalInitialBalance] = useState(0)

    const columsTr = [
        "Cuenta",
        "Concepto",
        "Saldo inicial",
        "Debito",
        "Crédito",
        "Saldo"
    ];

    const filters = {
        "Saldo":[
            {title:'Valor',
                options:[
                    {text:'Todas',value:true},
                    {text:'Distinto de 0',value:false}
                ],
                action:setAllAccounts
            }
        ]
    }

    const settingsReport = {
        columns: columsTr,
        company_id: appInfo.company_id,
        typePlanAccount:appInfo.accountPlanType,
        start_date,
        end_date,
        allAccounts
    };

    const calcTotals = ()=>{
        let td = 0;
        let tc = 0;
        let tb = 0;
        let tiB = 0;
        info.forEach(element => {
            td += element.total_debit
            tc += element.total_credit
            tb += element.final_balance
            tiB += element.opening_balance
        });
        console.log(td,tc,tb,tiB)
        setTotalDebit(td);
        setTotalCredit(tc);
        setTotalBalance(tb)
        setTotalInitialBalance(tiB)
    }

    useEffect(()=>{
        if(info.length >0){
            calcTotals();
        }
    },[info])

    const getBalance = async () => {
        setLoading(true);
        let res = await postInfo('/contability/contabiltyController',settingsReport);
        console.log(res)
        if(res[0]){
            setInfo(res[1])
        }
        setLoading(false)
    };

    useEffect(()=>{
        getBalance();
    },[])

    useEffect(() => {
        setVisibleSettings(false)
        getBalance();
    }, [start_date,end_date,allAccounts]);

    return (
        <div className="ReportDocument">
        <PathLocation />
        <div className="headReport">
            <BoldTitle text={`Balance de prueba`} />
            <DescriptionSpan text={`Balance de cuentas contables.`} />
        </div>
        <div className="totalsBalanceC">
            <LabelValue title={'Debito'} value={<b>$ {moneyFormat(totalDebit)}</b>}/>
            <LabelValue title={'Crédito'} value={<b>$ {moneyFormat(totalCredit)}</b>}/>
            <LabelValue title={'Balance inicial'} value={<b>$ {moneyFormat(totalInitialBalance)}</b>}/>
            <LabelValue title={'Balance final'} value={<b>$ {moneyFormat(totalBalance)}</b>}/>
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
            <FilterReports hidden={visibleSettings} columns={columsTr} filters={filters}/>
        </div>
        <div className="SpaceReport">
            {!loading && (
                <TableReport columns={settingsReport.columns} info={info} type={''} searchValue={searchValue} navigation={true}/>
            )}
            {loading && (
            <LoadingSpace title={"Cargando información"} description={"Esto no debe tardar mucho..."} />
            )}
        </div>
        </div>
    );
}
