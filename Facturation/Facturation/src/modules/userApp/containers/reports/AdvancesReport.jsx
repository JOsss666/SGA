import { useEffect, useMemo, useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import { ButtonDownload } from "../../components/ButtonDownload";
import { ButtonMenu } from "../../components/ButtonMenu";
import { AiButton } from "../../components/ChatAiComponents/AiButton";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { PathLocation } from "../../components/PathLocation";
import { SearchBar } from "../../components/SearchBar";
import './BriefCaseReport.css'
import './ReportDocuments.css'
import './AdvancesReport.css'
import { UniversalTable } from "../universalTable";
import { useNavigate } from "react-router-dom";
import { moneyFormat, postInfo } from "../../../../utils/functions";
import { useAppInfo } from "../../../../context/context";

const numberValue = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const sumMoney = (getValue) => (rows) => `$ ${moneyFormat(rows.reduce((sum, row) => sum + getValue(row), 0))}`;

// Columnas de la lista: key = campo devuelto por /treasury/getCompanyAdvances.
const advancesColumns = [
    { key: 'names', label: 'Terceros', minWidth: '14rem', flex: '2 1 14rem' },
    { key: 'identification_number', label: 'Identificación', minWidth: '10rem' },
    { key: 'advances_count', label: 'Anticipos', minWidth: '8rem' },
    { key: 'total_amount', label: 'Total', minWidth: '11rem', total: sumMoney((row) => numberValue(row.total_amount)) },
    { key: 'used_amount', label: 'Usado', minWidth: '11rem', total: sumMoney((row) => numberValue(row.used_amount)) },
    { key: 'available_amount', label: 'Saldo a favor', minWidth: '11rem', total: sumMoney((row) => numberValue(row.available_amount)) }
];

const advancesXlsxColumns = [
    { header: "Tercero", key: "names", width: 32 },
    { header: "Identificación", key: "identification_number", width: 18 },
    { header: "Anticipos", key: "advances_count", type: "number", numFmt: "#,##0", width: 12 },
    { header: "Total", key: "total_amount", type: "number", numFmt: "#,##0.00", width: 18 },
    { header: "Usado", key: "used_amount", type: "number", numFmt: "#,##0.00", width: 18 },
    { header: "Saldo a favor", key: "available_amount", type: "number", numFmt: "#,##0.00", width: 18 }
];

const renderMoney = ({ value }) => <span className="portfolioAmount">{moneyFormat(numberValue(value))}</span>;

function AdvanceNameCell({ value, info, navigate }) {
    const openDetail = (event) => {
        event.stopPropagation();
        navigate(String(info.thirdParty_id));
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

export function AdvancesReport(){

    //Requirements
    const {appInfo} = useAppInfo();
    const navigate = useNavigate();

    // Control
    const [info,setInfo] = useState([]);
    const [loading,setLoading] = useState(true);
    const [visibleRows, setVisibleRows] = useState([]);
    const [loadError, setLoadError] = useState('');
    const [searchValue,setSearchValue] = useState('');

    useEffect(() => {
        let active = true;
        const getCompanyAdvances = async () => {
            setLoading(true);
            setLoadError('');
            try {
                const res = await postInfo('/treasury/getCompanyAdvances', {
                    company_id: appInfo.company_id
                });
                if (res?.status !== 'OK' || !Array.isArray(res.summary)) throw new Error('Invalid advances response');
                if (active) setInfo(res.summary);
            } catch {
                if (active) {
                    setInfo([]);
                    setLoadError('No se pudo cargar el saldo a favor. Vuelve a abrir el informe para intentarlo de nuevo.');
                }
            } finally {
                if (active) setLoading(false);
            }
        };
        getCompanyAdvances();
        return () => { active = false; };
    }, [appInfo.company_id]);

    const advancesRenderers = useMemo(() => ({
        names: (props) => <AdvanceNameCell {...props} navigate={navigate} />,
        total_amount: renderMoney,
        used_amount: renderMoney,
        available_amount: renderMoney
    }), [navigate]);

    const rowsForExport = visibleRows.length ? visibleRows : info;

    return(
        <div className="BriefCaseReport ReportDocument AdvancesReport">

            <div className="headReport">
                <PathLocation/>
                <BoldTitle text={'Informe Saldos a favor'}/>
                <DescriptionSpan text={'Consulte el saldo a favor (anticipos) de los terceros de su aplicación'}/>
            </div>

            <div className="settingsReport">

                <SearchBar placeholder={"Buscar"} action={setSearchValue}/>

                <ButtonMenu title={"Agregar a favoritos"} children={<i className="fa-regular fa-star" />} noRotate={true} />

                <AiButton attached={rowsForExport} sugerence={[
                    {text:'¿Qué tercero concentra más saldo a favor?',context:`Procesos - Saldos a favor - Anticipos - Tercero`},
                    {text:'Realiza un analisis de este informe',context:`Procesos - Saldos a favor - Anticipos - Tercero`},
                    {text:'¿Qué acciones me recomiendas basado en este informe?',context:`Procesos - Saldos a favor - Anticipos - Tercero`}
                ]}/>

                <ButtonDownload
                    info={rowsForExport}
                    columns={advancesXlsxColumns}
                    title={"Informe_Saldos_a_favor"}
                />

            </div>

            {loadError && <p role="alert">{loadError}</p>}
            <div className="bodyreport portfolioUniversalReport sgaTreasury" id="bodyreport">
                <UniversalTable
                    columns={advancesColumns}
                    results={info}
                    searchValue={searchValue}
                    loading={loading}
                    getRowKey={(row) => row.thirdParty_id}
                    onResultsChange={setVisibleRows}
                    rowProps={{
                        renderers: advancesRenderers,
                        onRowClick: (row) => navigate(String(row.thirdParty_id))
                    }}
                    emptyMessage={loadError || 'No hay terceros con saldo a favor'}
                />
            </div>

        </div>
    )
}
