import { BoldTitle } from "../../components/BoldTitle";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import {PathLocation} from '../../components/PathLocation'
import {SearchBar} from '../../components/SearchBar'
import {FormInput} from '../../components/FormInput';
import {SelectOptions} from '../../components/SelectOptions';
import {ButtonMenu} from '../../components/ButtonMenu';
import {ButtonDownload} from '../../components/ButtonDownload';
import {AiButton} from '../../components/ChatAiComponents/AiButton';
import {UserCard} from '../../components/UserCard';
import { useEffect, useMemo, useState } from "react";
import {FilterReports} from './FilterReports'
import { moneyFormat, postInfo } from "../../../utils/functions";
import {useRealtime} from '../../../utils/useRealTime.js'
import { useParams } from 'react-router-dom'
import { UniversalTable } from "../universalTable";
import './ClicksReport.css'

// Columnas del informe de servicios para UniversalTable.
const SERVICE_COLUMNS = [
    { key: 'service_name', label: 'Servicio', flex: '1 1 12rem', minWidth: '11rem' },
    { key: 'instance_label', label: 'Instancia', minWidth: '9rem' },
    { key: 'thirdparty_name', label: 'Tercero' },
    {
        key: 'clicksTotal',
        label: 'Clicks',
        minWidth: '8rem',
        total: (rows) => moneyFormat(rows.reduce((sum, row) => sum + (row.clicksTotal || 0), 0))
    },
    {
        key: 'units',
        label: 'Unidades',
        minWidth: '8rem',
        total: (rows) => moneyFormat(rows.reduce((sum, row) => sum + (parseInt(row.units) || 0), 0))
    },
    { key: 'unit_value', label: 'Valor unitario', minWidth: '9rem' },
    {
        key: 'total',
        label: 'Total',
        minWidth: '9rem',
        total: (rows) => `$ ${moneyFormat(rows.reduce((sum, row) => sum + (parseFloat(row.total) || 0), 0).toFixed(2))}`
    },
    { key: 'description', label: 'Descripción' },
    { key: 'machine_name', label: 'Maquina', flex: '1 1 12rem', minWidth: '11rem' },
    { key: 'created_at', label: 'Fecha', minWidth: '9rem' }
];

// Etiquetas y mapeo usados para exportar el informe.
const columsReport = [
    "Servicio", "Instancia", "Tercero", "Clicks", "Unidades",
    "Valor unitario", "Total", "Descripción", "Maquina", "Fecha"
];
const columnMap = {
    "Servicio": "service_name",
    "Instancia": "instance_serial",
    "Tercero": "thirdparty_name",
    "Clicks": "controlClicks",
    "Unidades": "units",
    "Valor unitario": "unit_value",
    "Total": "total",
    "Descripción": "description",
    "Maquina": "machine_name",
    "Fecha": "created_at"
};

// Añade a cada fila los campos derivados que la tabla ordena/muestra.
const toRow = (element) => ({
    ...element,
    clicksTotal: (parseInt(element.units) || 0) * (parseFloat(element.controlClicks) || 0),
    instance_label: `${element.process_code}#${element.instance_serial}`
});

export function ServiceMovements({appInfo,userInfo,userConfig,popInAlert,popOutAlert, useAiAssistant}){

    const params = useParams();

    // requirements
    const [info,setInfo] = useState([]);
    const [visibleRows,setVisibleRows] = useState([]);

    // Control
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(true);
    const [searchValue,setSearchValue] = useState('');
    const [start_date,setStart_date] = useState(undefined);
    const [end_date,setEnd_date] = useState(undefined);
    const [visibleSettings,setVisibleSettings] = useState(false);
    const [totalValue,setTotalValue] = useState(0);
    const [totalServices,setTotalServices] = useState(0);
    const [totalClicks,setTotalClicks] = useState(0);

    // Settings Report
    const filters = {};

    const settingsReport = {
        columsReport,
        company_id:appInfo.company_id,
        start_date,
        end_date
    }

    const rows = useMemo(() => (Array.isArray(info) ? info.map(toRow) : []), [info]);

    // Getters of info
    const getServiceMovements = async()=>{
        setDisabled(true);
        setLoading(true)
        let res = await postInfo('/zj852/getServiceMovements',settingsReport);
        if(res[0]){
            setInfo(res[1]);
        }else{
            setInfo([])
        }
        setLoading(false);
        setDisabled(false);
    }

    // functions
    const calcTotals = ()=>{
        let ttlS = info.length;
        let ttlClicks = 0;
        let ttlValue = 0;
        info.forEach(element => {
            if(element.controlClicks != undefined){
                ttlClicks += parseFloat(element.controlClicks * element.units)
            }
            ttlValue += parseFloat(element.total)
        });
        let defTTVal = ttlValue?.toFixed(2)
        setTotalClicks(ttlClicks);
        setTotalServices(ttlS);
        setTotalValue(defTTVal);
    }

    useRealtime(appInfo.company_id, (payload) => {
        if (payload.table === 'process_instance') {
            getServiceMovements();
        }
    });

    // Effects listener
    useEffect(()=>{
        getServiceMovements();
    },[])

    useEffect(()=>{
        getServiceMovements();
    },[start_date,end_date])

    useEffect(()=>{
        calcTotals();
    },[info])

    // Exporta exactamente lo que la tabla tiene filtrado/ordenado en pantalla.
    const setInfoForReportDownload = () => visibleRows.map((element) => {
        const row = {};
        columsReport.forEach((col) => {
            const backendKey = columnMap[col];
            let value = element[backendKey] ?? "";

            if(backendKey === "controlClicks" || backendKey === "units"){
                value = Number(value);
            }
            if(backendKey === "unit_value" || backendKey === "total"){
                value = Number(value);
            }
            if(backendKey === "created_at" && value){
                value = new Date(value).toLocaleString();
            }

            row[col] = value;
        });
        return row;
    });

    const rowProps = useMemo(() => ({
        renderers: {
            service_name: ({ info: row }) => (
                <UserCard name={row.service_name} desc={row.service_code} imgSrc={row.service_img} />
            ),
            instance_label: ({ value, info: row }) => (
                <span
                    className="serviceInstanceLink"
                    role="link"
                    tabIndex={0}
                    onClick={() => window.open(
                        `https://facturation.sga360.co/preview/Process/${params.company_key}/${row.instance_id}`,
                        '_blank',
                        'noopener,noreferrer'
                    )}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            window.open(
                                `https://facturation.sga360.co/preview/Process/${params.company_key}/${row.instance_id}`,
                                '_blank',
                                'noopener,noreferrer'
                            );
                        }
                    }}
                >
                    {value}
                </span>
            ),
            clicksTotal: ({ value }) => <span>{value}</span>,
            units: ({ value }) => <span>{moneyFormat(parseInt(value))}</span>,
            unit_value: ({ value }) => <span>{moneyFormat(parseFloat(value))}</span>,
            total: ({ value }) => <span>{moneyFormat(parseFloat(value))}</span>,
            machine_name: ({ info: row }) => (
                <UserCard
                    name={row.machine_name ? row.machine_name : '---'}
                    desc={row.machine_model ? row.machine_model : '---'}
                    imgSrc={row.machine_img}
                />
            ),
            created_at: ({ value }) => <span>{value ? String(value).substring(0, 16) : '---'}</span>
        }
    }), [params.company_key]);

    return(
        <div className="ClicksReport ReportDocument">
            <div className="headReport">
                <PathLocation/>
                <BoldTitle text={'Informe de Servicios Z&J S.A.S'}/>
                <DescriptionSpan text={'Consulte el No de clicks ejecutados'}/>
            </div>
            <div className="totalsIndicator">
                <div className="ttlIndicator">
                    <span>Servicios</span>
                    <strong>{moneyFormat(totalServices)}</strong>
                </div>
                <div className="ttlIndicator">
                    <span>Clicks</span>
                    <strong>{moneyFormat(totalClicks)}</strong>
                </div>
                <div className="ttlIndicator">
                    <span>Valor total</span>
                    <strong>$ {moneyFormat(totalValue)}</strong>
                </div>
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
                <AiButton attached={visibleRows} useAiAssistant={useAiAssistant} sugerence={[
                    {text:'¿Que representa este informe?',context:`Procesos - Balance - Cuentas contables - Saldo`},
                    {text:'Realiza un analisis de este informe',context:`Procesos - Balance - Cuentas contables - Saldo`},
                    {text:'¿Que acciones me recomiendas basado en este informe?',context:`Procesos - Balance - Cuentas contables - Saldo`}
                ]}/>
                <ButtonDownload
                    info={setInfoForReportDownload()}
                    columns={columsReport}
                    title="Informe_Servicios"
                />
                <FilterReports hidden={visibleSettings} columns={columsReport} filters={filters}/>
            </div>
            <div className="contentReport">
                <UniversalTable
                    columns={SERVICE_COLUMNS}
                    results={rows}
                    searchValue={searchValue}
                    loading={loading}
                    disabled={disabled}
                    rowProps={rowProps}
                    onResultsChange={setVisibleRows}
                    emptyMessage="No hay servicios para mostrar"
                />
            </div>
        </div>
    )
}
