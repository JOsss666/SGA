import { useEffect, useMemo, useState } from "react";
import { useAppInfo } from "../../../../context/context";
import { moneyFormat, postInfo } from "../../../../utils/functions";
import { BoldTitle } from "../../components/BoldTitle";
import { ButtonMenu } from "../../components/ButtonMenu";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { FormInput } from "../../components/FormInput";
import { PathLocation } from "../../components/PathLocation";
import { SearchBar } from "../../components/SearchBar";
import { SelectOptions } from "../../components/SelectOptions";
import { UniversalTable } from "../universalTable";
import { Link, useNavigate } from "react-router-dom";
import "./ReportBalance.css";
import "./ReportDocuments.css";
import { ButtonDownload } from "../../components/ButtonDownload";
import { AiButton } from "../../components/ChatAiComponents/AiButton";
import { LabelValue } from "../../components/LabelValue";
import { FilterReports } from "./FilterReports";

const balanceColumns = [
    { key: 'account_code', label: 'Cuenta', flex: '0 0 10rem' },
    { key: 'concept_name', label: 'Concepto', flex: '2 1 16rem', minWidth: '12rem' },
    { key: 'opening_balance', label: 'Saldo inicial' },
    { key: 'total_debit', label: 'Débito' },
    { key: 'total_credit', label: 'Crédito' },
    { key: 'final_balance', label: 'Saldo' }
];
const renderBalanceAmount = ({ value }) => <span>{moneyFormat(Number(value ?? 0))}</span>;
const balanceRenderers = {
    account_code: ({ value, info }) => info.id != null ? (
        <Link className="balanceAccountLink" to={String(info.id)} onClick={event => event.stopPropagation()}>
            {value}
        </Link>
    ) : <span>{value}</span>,
    opening_balance: renderBalanceAmount,
    total_debit: renderBalanceAmount,
    total_credit: renderBalanceAmount,
    final_balance: renderBalanceAmount
};

export function ReportBalance() {
    const navigate = useNavigate();

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

    const columsTr = [
        "Cuenta",
        "Concepto",
        "Saldo inicial",
        "Debito",
        "Crédito",
        "Saldo"
    ];

    const balanceXlsxColumns = [
        { header: "Cuenta", key: "account_code", width: 18 },
        { header: "Concepto", key: "concept_name", width: 36 },
        { header: "Saldo Inicial", key: "opening_balance", type: "number", numFmt: "#,##0.00", width: 18 },
        { header: "D\u00e9bito", key: "total_debit", type: "number", numFmt: "#,##0.00", width: 18 },
        { header: "Cr\u00e9dito", key: "total_credit", type: "number", numFmt: "#,##0.00", width: 18 },
        { header: "Saldo Final", key: "final_balance", type: "number", numFmt: "#,##0.00", width: 18 }
    ];

    const formatReportDate = (value) => {
        if (!value) return "";

        if (typeof value === "string") {
            const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (dateMatch) {
                return `${dateMatch[1]}${dateMatch[2]}${dateMatch[3]}`;
            }
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}${month}${day}`;
    };

    const getBalanceXlsxOptions = () => {
        const periodStart = formatReportDate(start_date || appInfo.created_at || "1900-01-01");
        const periodEnd = formatReportDate(end_date || new Date());

        return {
            companyName: appInfo.legal_name || appInfo.trade_name || appInfo.company_name || "Compa\u00f1\u00eda",
            reportName: "Balance de prueba",
            period: `${periodStart} a ${periodEnd}`,
            startRow: 4
        };
    };

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

    const { totalDebit, totalCredit, totalBalance, totalInitialBalance } = useMemo(() => info.reduce((totals, row) => ({
        totalDebit: totals.totalDebit + Number(row.total_debit ?? 0),
        totalCredit: totals.totalCredit + Number(row.total_credit ?? 0),
        totalBalance: totals.totalBalance + Number(row.final_balance ?? 0),
        totalInitialBalance: totals.totalInitialBalance + Number(row.opening_balance ?? 0)
    }), { totalDebit: 0, totalCredit: 0, totalBalance: 0, totalInitialBalance: 0 }), [info]);

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
        <div className="ReportBalance ReportDocument sgaTreasury">
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
            <ButtonDownload
                info={info}
                columns={balanceXlsxColumns}
                title={"Balance_de_prueba"}
                component={"bodyreport"}
                xlsxOptions={getBalanceXlsxOptions}
            />
            <FilterReports hidden={visibleSettings} columns={columsTr} filters={filters}/>
        </div>
        <div className="SpaceReport">
                <UniversalTable
                    columns={balanceColumns}
                    results={info}
                    searchValue={searchValue}
                    loading={loading}
                    getRowKey={row => row.id ?? row.account_code}
                    rowProps={{
                        renderers: balanceRenderers,
                        onRowClick: row => { if (row.id != null) navigate(String(row.id)); }
                    }}
                    emptyMessage="No hay cuentas para mostrar"
                />
            </div>
        </div>
    );
}
