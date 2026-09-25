import { BoldTitle } from "../../components/BoldTitle";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { PathLocation } from '../../components/PathLocation'
import { SearchBar } from '../../components/SearchBar'
import { FormInput } from '../../components/FormInput';
import { SelectOptions } from '../../components/SelectOptions';
import { ButtonMenu } from '../../components/ButtonMenu';
import { ButtonDownload } from '../../components/ButtonDownload';
import { AiButton } from '../../components/ChatAiComponents/AiButton';
import { UserCard } from '../../components/UserCard';
import { useEffect, useState, useRef, useMemo } from "react";
import { FilterReports } from './FilterReports'
import { urlSer, formatDate, moneyFormat, extractIdFromAttached } from "../../../utils/functions";
import { UniversalTable } from "../universalTable";
import { PreviewFile } from "../Preview/PreviewFile";
import './ClicksReport.css'

// Columnas del informe de clicks para UniversalTable.
// El `key` apunta al valor primitivo de cada fila (orden/filtro/búsqueda);
// el render visual se resuelve con `CLICKS_RENDERERS`.
const CLICKS_COLUMNS = [
    { key: 'asset_name', label: 'Maquina', flex: '1 1 12rem', minWidth: '10rem' },
    {
        key: 'initialClicks',
        label: 'Clicks',
        minWidth: '8rem',
        total: (rows) => moneyFormat(rows.reduce((sum, row) => sum + (parseInt(row.initialClicks) || 0), 0))
    },
    { key: 'responsable', label: 'Responsable' },
    { key: 'description', label: 'Descripcion' },
    { key: 'created_at_local', label: 'Fecha' }
];

const CLICKS_RENDERERS = {
    asset_name: ({ info }) => (
        <UserCard name={info.asset_name} desc={info.asset_model} imgSrc={info.asset_img} />
    ),
    initialClicks: ({ value }) => <span>{moneyFormat(parseInt(value))}</span>,
    created_at_local: ({ value, info }) => <span>{formatDate(value || info.created_at, false)}</span>
};

// Etiquetas y mapeo usados para exportar el informe.
const columsReport = ["Maquina", "Clicks", "Responsable", "Descripcion", "Fecha"];
const columnMap = {
    "Maquina": "asset_name",
    "Clicks": "initialClicks",
    "Responsable": "responsable",
    "Descripcion": "description",
    "Fecha": "created_at_local"
};

export function ClicksReport({appInfo,userInfo,userConfig,popInAlert,popOutAlert,useAlert ,useAiAssistant}){

    const [info,setInfo] = useState([]);
    const [visibleRows,setVisibleRows] = useState([]);
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(true);
    const [searchValue,setSearchValue] = useState('');
    const [start_date,setStart_date] = useState('');
    const [end_date,setEnd_date] = useState('');
    const [error,setError] = useState('');
    const [visibleSettings,setVisibleSettings] = useState(false);

    const reportRef = useRef();

    const filters = {};

    useEffect(()=>{
        const controller = new AbortController();
        setInfo([]);
        setError('');

        if (start_date && end_date && start_date > end_date) {
            setError('La fecha inicial no puede ser posterior a la fecha final.');
            setLoading(false);
            setDisabled(false);
            return () => controller.abort();
        }

        if (!appInfo.company_id) {
            setLoading(false);
            setDisabled(false);
            return () => controller.abort();
        }

        const getClicksHistoric = async () => {
            setDisabled(true);
            setLoading(true);
            try {
                const response = await fetch(`${urlSer}/zj852/getHistorialClicksControl`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-SGA-Company-Id': String(appInfo.company_id)
                    },
                    body: JSON.stringify({
                        company_id: appInfo.company_id,
                        start_date: start_date || undefined,
                        end_date: end_date || undefined
                    }),
                    signal: controller.signal
                });
                const result = await response.json();
                if (!response.ok || !result[0] || !Array.isArray(result[1])) {
                    throw new Error('No fue posible cargar el informe. Intenta nuevamente.');
                }
                if (!controller.signal.aborted) setInfo(result[1]);
            } catch {
                if (!controller.signal.aborted) {
                    setError('No fue posible cargar el informe. Intenta nuevamente.');
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                    setDisabled(false);
                }
            }
        };

        getClicksHistoric();
        return () => controller.abort();
    },[appInfo.company_id, start_date, end_date]);

    // Exporta exactamente lo que la tabla tiene filtrado/ordenado en pantalla.
    const setInfoForReportDownload = () => visibleRows.map((element) => {
        const row = {};
        columsReport.forEach((col) => {
            row[col] = element[columnMap[col]] ?? "";
        });
        return row;
    });

    const rowProps = useMemo(() => ({
        renderers: CLICKS_RENDERERS,
        onRowClick: (row) => popInAlert(
            <PreviewFile
                id={extractIdFromAttached(row.attached)}
                useAlert={useAlert}
                appInfo={appInfo}
            />
        )
    }), [popInAlert, useAlert, appInfo]);

    return(
        <div className="ClicksReport ReportDocument">

            <div className="headReport">
                <PathLocation key="path-location-report"/>
                <BoldTitle text={'Informe de cierre de clicks'}/>
                <DescriptionSpan text={'Consulte el No de clicks ejecutados'}/>
            </div>

            <div className="settingsReport">

                <SearchBar placeholder={"Buscar"} action={setSearchValue}/>

                <div className="rangeInput">
                    <FormInput type={"date"} title={"Fecha Inicial"} action={setStart_date} value={start_date} max={end_date || undefined} required={false} />
                    <span>-</span>
                    <FormInput type={"date"} title={"Fecha Final"} action={setEnd_date} value={end_date} min={start_date || undefined} required={false} />
                </div>

                <ButtonMenu
                    title={"Mas Ajustes"}
                    children={<i className="fa-solid fa-sliders" />}
                    noRotate={true}
                    onClick={()=>{
                        setVisibleSettings(!visibleSettings)
                    }}
                />

                <ButtonMenu
                    title={"Agregar a favoritos"}
                    children={<i className="fa-regular fa-star" />}
                    noRotate={true}
                />

                <AiButton
                    attached={visibleRows}
                    useAiAssistant={useAiAssistant}
                    sugerence={[
                        {text:'¿Que representa este informe?',context:`Clicks - Reporte`},
                        {text:'Realiza un analisis de este informe',context:`Clicks - Reporte`},
                        {text:'¿Que acciones me recomiendas basado en este informe?',context:`Clicks - Reporte`}
                    ]}
                />

                <ButtonDownload
                    info={setInfoForReportDownload()}
                    columns={columsReport}
                    title="Informe_Clicks"
                    component={reportRef}
                />

                <FilterReports
                    hidden={visibleSettings}
                    columns={columsReport}
                    filters={filters}
                />

            </div>

            {error && <p role="alert">{error}</p>}

            {!error && (
                <div ref={reportRef}>
                    <UniversalTable
                        columns={CLICKS_COLUMNS}
                        results={info}
                        searchValue={searchValue}
                        loading={loading}
                        disabled={disabled}
                        rowProps={rowProps}
                        onResultsChange={setVisibleRows}
                        emptyMessage="No hay registros para los filtros seleccionados."
                    />
                </div>
            )}

        </div>
    )
}
