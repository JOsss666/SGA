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
import { FilterReports } from "./FilterReports";
import { UniversalTable } from "../universalTable";
import { useNavigate } from "react-router-dom";
import { moneyFormat, postInfo } from "../../../../utils/functions";
import { useAppInfo } from "../../../../context/context";

const numberValue = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const sumMoney = (getValue) => (rows) => `$ ${moneyFormat(rows.reduce((sum, row) => sum + getValue(row), 0))}`;

const portfolioColumns = [
    { key: 'names', label: 'Terceros', minWidth: '12rem' },
    { key: 'credit', label: 'Habilitado', values: [{ value: true, label: 'Sí' }, { value: false, label: 'No' }] },
    { key: 'credit_term', label: 'Plazo' },
    { key: 'credit_value', label: 'Cupo máximo', minWidth: '12rem', total: sumMoney((row) => numberValue(row.credit_value)) },
    { key: 'availableCredit', label: 'Cupo disponible', minWidth: '12rem', total: sumMoney((row) => numberValue(row.credit_value) - numberValue(row.thirdParty_totalDebt)) },
    { key: 'balance', label: 'Cartera', minWidth: '12rem', total: sumMoney((row) => row.balance) },
    { key: 'thirdParty_currentBalance', label: 'Corriente', minWidth: '12rem', total: sumMoney((row) => numberValue(row.thirdParty_currentBalance)) },
    { key: 'thirdParty_overdueBalance', label: 'Vencido', minWidth: '12rem', total: sumMoney((row) => numberValue(row.thirdParty_overdueBalance)) }
];

const renderMoney = ({ value }) => <span className="portfolioAmount">{moneyFormat(value)}</span>;

function PortfolioNameCell({ value, info }) {
    const navigate = useNavigate();
    const openDetail = (event) => {
        event.stopPropagation();
        navigate(String(info.id));
    };

    return (
        <span
            className="portfolioDetailLink"
            role="link"
            tabIndex={0}
            onClick={openDetail}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openDetail(event);
                }
            }}
        >{value || 'Sin nombre'}</span>
    );
}

const portfolioRenderers = {
    names: PortfolioNameCell,
    credit_term: ({ value }) => <span>{value || 0} días</span>,
    credit_value: renderMoney,
    availableCredit: renderMoney,
    balance: renderMoney,
    thirdParty_currentBalance: renderMoney,
    thirdParty_overdueBalance: renderMoney
};

export function BriefCaseReport(){

    //Requirements
    const {appInfo} = useAppInfo();
    const navigate = useNavigate();

    // Control
    const [info,setInfo] = useState([]);
    const [loading,setLoading] = useState(true);
    const [visibleRows, setVisibleRows] = useState([]);
    const [loadError, setLoadError] = useState('');
    const [searchValue,setSearchValue] = useState('');
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

    useEffect(() => {
        let active = true;
        const getThirdParties = async () => {
            setLoading(true);
            setLoadError('');
            try {
                const res = await postInfo('/getThirdParties', {
                    company_id: appInfo.company_id,
                    comercialInfo: true
                });
                if (!res?.[0] || !Array.isArray(res[1])) throw new Error('Invalid portfolio response');
                if (active) setInfo(res[1]);
            } catch {
                if (active) {
                    setInfo([]);
                    setLoadError('No se pudo cargar la cartera. Vuelve a abrir el informe para intentarlo de nuevo.');
                }
            } finally {
                if (active) setLoading(false);
            }
        };
        getThirdParties();
        return () => { active = false; };
    }, [appInfo.company_id]);

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

    const rows = useMemo(() => tableData.map((row) => ({
        ...row,
        credit: Boolean(row.credit),
        // Preserve the existing row and summary calculations.
        availableCredit: numberValue(row.aviable_credit) - numberValue(row.thirdParty_currentBalance),
        balance: numberValue(row.thirdParty_balance ?? row.thirdParty_totalDebt)
    })), [tableData]);

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
        return visibleRows.map(element => {

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


                <ButtonMenu title={"Agregar a favoritos"} children={<i className="fa-regular fa-star" />} noRotate={true} />

                {/* [CAMBIO] ahora AI usa los datos filtrados */}
                <AiButton attached={visibleRows} sugerence={[
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


            </div>

            {loadError && <p role="alert">{loadError}</p>}
            <div className="bodyreport portfolioUniversalReport sgaTreasury" id="bodyreport">
                <UniversalTable
                    columns={portfolioColumns}
                    results={rows}
                    loading={loading}
                    getRowKey={(row) => row.id}
                    onResultsChange={setVisibleRows}
                    rowProps={{
                        renderers: portfolioRenderers,
                        onRowClick: (row) => navigate(String(row.id))
                    }}
                    emptyMessage={loadError || 'No hay terceros para mostrar'}
                />
            </div>

        </div>
    )
}
