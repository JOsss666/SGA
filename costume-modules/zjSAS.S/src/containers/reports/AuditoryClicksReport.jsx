import {BoldTitle} from '../../components/BoldTitle';
import { ButtonDownload } from '../../components/ButtonDownload';
import { ButtonMenu } from '../../components/ButtonMenu';
import { AiButton } from '../../components/ChatAiComponents/AiButton';
import { PathLocation } from '../../components/PathLocation';
import { SearchBar } from '../../components/SearchBar';
import { UserCard } from '../../components/UserCard';
import { FilterReports } from './FilterReports';
import { useState, useEffect, useRef, useMemo } from 'react';
import { moneyFormat, postInfo, extractIdFromAttached } from '../../../utils/functions';
import './AuditoryClicksReport.css'
import { UniversalTable } from '../universalTable';
import { PreviewFile } from '../Preview/PreviewFile';
import {LabelValue} from '../../components/LabelValue'

// Columnas del informe de auditoría de clicks para UniversalTable.
const AUDIT_COLUMNS = [
    { key: 'fecha', label: 'Fecha', minWidth: '9rem' },
    { key: 'machine_name', label: 'Maquina', flex: '1 1 12rem', minWidth: '11rem' },
    { key: 'initial_clicks', label: 'Clicks iniciales', minWidth: '9rem' },
    { key: 'next_initial_clicks', label: 'Clicks cierre', minWidth: '9rem' },
    { key: 'clicksEjecutados', label: 'Clicks Ejecutados', minWidth: '9rem' },
    { key: 'clicksRegistrados', label: 'Clicks Registrados', minWidth: '9rem' },
    {
        key: 'diferencia',
        label: 'Diferencia',
        minWidth: '8rem',
        total: (rows) => moneyFormat(rows.reduce((sum, row) => sum + (parseFloat(row.diferencia) || 0), 0))
    }
];

const AUDIT_RENDERERS = {
    fecha: ({ value }) => <span>{value ? String(value).substring(0, 10) : '---'}</span>,
    machine_name: ({ info }) => (
        <UserCard name={info.machine_name} desc={info.machine_model} imgSrc={info.machine_img} />
    ),
    initial_clicks: ({ value }) => <span>{moneyFormat(parseFloat(value))}</span>,
    next_initial_clicks: ({ value }) => <span>{moneyFormat(parseFloat(value))}</span>,
    clicksEjecutados: ({ value }) => <span>{moneyFormat(parseFloat(value))}</span>,
    clicksRegistrados: ({ value }) => <span>{moneyFormat(parseFloat(value))}</span>,
    diferencia: ({ value }) => <span>{moneyFormat(parseFloat(value))}</span>
};

// Etiquetas y mapeo usados para exportar el informe.
const columsReport = [
    "Fecha", "Maquina", "Clicks iniciales", "Clicks cierre",
    "Clicks Ejecutados", "Clicks Registrados", "Diferencia"
];
const columnMap = {
    "Fecha": "fecha",
    "Maquina": "machine_name",
    "Clicks iniciales": "initial_clicks",
    "Clicks cierre": "next_initial_clicks",
    "Clicks Ejecutados": "clicksEjecutados",
    "Clicks Registrados": "clicksRegistrados",
    "Diferencia": "diferencia"
};

export function AuditoryClicksReport({appInfo,userInfo,userConfig,popInAlert,popOutAlert,useAlert ,useAiAssistant}){

    // requierements
    const reportRef = useRef();
    const [info,setInfo] = useState([]);
    const [visibleRows,setVisibleRows] = useState([]);
    // Control
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(true);
    const [searchValue,setSearchValue] = useState('');
    const [start_date,setStart_date] = useState(undefined);
    const [end_date,setEnd_date] = useState(undefined);
    const [visibleSettings,setVisibleSettings] = useState(false);

    // Aditional data
    const [acDiference,setAcDiference] = useState(0);

    // El preview se abre con el popInAlert del contexto (igual que la tabla
    // original), no con el prop, que en el host no dispara la alerta.
    const { popInAlert: openAlert } = useAlert();

    const filters = {};

    const settingsReport = {
        columsReport,
        company_id: appInfo.company_id,
        start_date,
        end_date
    };

    const getClicksHistoric = async()=>{
        setDisabled(true);
        setLoading(true);

        let res = await postInfo('/zj852/getAuditClicksReport', settingsReport);
        if(res[0]){
            setInfo(res[1]);
        }

        setLoading(false);
        setDisabled(false);
    }

    useEffect(()=>{
        getClicksHistoric();
    },[start_date,end_date])

    useEffect(()=>{
        getClicksHistoric();
    },[]);

    // Diferencia acumulada de lo que la tabla tiene filtrado en pantalla.
    useEffect(()=>{
        const total = visibleRows.reduce((sum, element) => sum + (parseFloat(element.diferencia) || 0), 0);
        setAcDiference(total);
    },[visibleRows])

    // Exporta exactamente lo que la tabla tiene filtrado/ordenado en pantalla.
    const setInfoForReportDownload = () => visibleRows.map((element) => {
        const row = {};
        columsReport.forEach((col) => {
            row[col] = element[columnMap[col]] ?? "";
        });
        return row;
    });

    const rowProps = useMemo(() => ({
        renderers: AUDIT_RENDERERS,
        onRowClick: (row) => openAlert(
            <PreviewFile
                id={extractIdFromAttached(row.clickControlAttached)}
                useAlert={useAlert}
                appInfo={appInfo}
            />
        )
    }), [openAlert, useAlert, appInfo]);

    return(
        <div className="AuditoryClicksReport">
            <div className="headReport">
                <PathLocation/>
                <BoldTitle text={'Auditoria de clicks'}/>
            </div>

            <div className="totalsBalanceC">
                <LabelValue title={"No. Registros"} value={<b>{moneyFormat(visibleRows.length)}</b>} />
                <LabelValue title={"Diferencia acumulada"} value={<b>{moneyFormat(acDiference)}</b>} />
            </div>

            <div className="settingsReport">

                <SearchBar placeholder={"Buscar"} action={setSearchValue}/>

                <div className="rangeInput">
                    <input className='rangeINput' type="date" onChange={(e)=>{
                        setStart_date(e.target.value)
                    }}/>
                    <span>-</span>
                    <input className='rangeINput' type="date" onChange={(e)=>{
                        setEnd_date(e.target.value)
                    }}/>
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

            <div ref={reportRef}>
                <UniversalTable
                    columns={AUDIT_COLUMNS}
                    results={info}
                    searchValue={searchValue}
                    loading={loading}
                    disabled={disabled}
                    rowProps={rowProps}
                    onResultsChange={setVisibleRows}
                    emptyMessage="No hay registros para los filtros seleccionados."
                />
            </div>
        </div>
    )
}
