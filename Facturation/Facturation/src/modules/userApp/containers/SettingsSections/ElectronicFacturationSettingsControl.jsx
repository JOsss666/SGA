import { BrowserRouter as Router, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { BoldTitle } from "../../components/BoldTitle";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { SettingsGroup } from "../../components/SettingsGroup";
import './ElectronicFacturationSettingsControl.css'
import { useEffect, useState } from "react";
import { LoadingSpace } from "../LoadingSpace";
import { formatDate, getNumberingRangesElectronicInvoices } from "../../../../utils/functions";
import { useAppInfo } from '../../../../context/context';
import { NoAccess } from '../NoAccess';

export function ElectronicFacturationSettingsControl(){

    // Requirements
    const {appInfo} = useAppInfo();
    const params = useParams();
    const navigate = useNavigate();

    // Control
    const [loading,setloading] = useState(false);
    const [numberingRanges,setNUmberingRanges] = useState([{}]);

     const options = [
        {text:'Ver rangos de numeración',path:'ranges',value:loading? 'cargando...': numberingRanges.length > 0 ? `Ver ${numberingRanges.length} rangos`:'No hay rangos disponibles',type:'general',icon:<i className="fa-solid fa-circle-info"/>},
        {text:'Definir consecutivo actual rango numeración',path:'setCurrentRange',value:'ver más',type:'functionality',icon:<i className="fa-solid fa-screwdriver"/>},
        {text:'Eliminar factura electronica',path:'deleteInvoice',value:'Ver más',type:'accesibility',icon:<i className="fa-regular fa-trash-can"/>},
    ]


    // getters and actions

    const handleNavigate = (path)=>{
        navigate(`/SGA_management/${params.company_key}/${params.user_key}/settings/System/e_fact/${path}`)
    }

    const getNumberingRanges = async()=>{
        setloading(true)
        const ranges = await getNumberingRangesElectronicInvoices(appInfo?.company_id);
        console.log('Rangos: ',ranges);
        setNUmberingRanges(ranges)
        setloading(false);
    }

    const setCurrentInRange = async(range_id,current)=>{
        const res = await postInfo('/electronicFacturation/setNumberingRangeCurrent', {
            numbering_range_id: range_id,
            current: current,            
            company_id: appInfo.company_id
        });
        console.log('Rspuesta range: ',res)
    }

    const deleteElectronicInvoice = async(number)=>{
        const res = await postInfo('/electronicFacturation/deletePendingBill', {
            number: number,        
            company_id: appInfo.company_id
        });
        console.log('Resultado de eliminar factura: ',res);
    }

    useEffect(()=>{
        getNumberingRanges();
    },[])

    return(
        <div className="ElectronicFacturationSettingsControl">
            <div className="body">
                <Routes>
                    <Route path='/' element={
                        <SettingsGroup options={options} onClick={handleNavigate} />
                    } />
                    <Route path='/ranges' element={
                        <div className="enabledRanges">
                            {loading && (
                                <LoadingSpace title={'Cargando rangos de numeración'} description={'Esto puede tardar un poco...'} />
                            )}
                            {!loading && numberingRanges.map((element,index)=>(
                                <div className="numberingRangeCard">
                                    <div className="headcard">
                                        <i className="fa-regular fa-folder-open"/>
                                        <h6>
                                            {`${element.prefix}-${element.current}`}
                                        </h6>
                                    </div>
                                    <span><b>Prefijo</b>: {element.prefix}</span>
                                    <span><b>Documentos</b>: {element.document}</span>
                                    <span><b>Inicio</b>: {element.from ||'--'}</span>
                                    <span><b>Fin</b>: {element.to || '--'}</span>
                                    <span><b>Actual</b>: {element.current || '--'}</span>
                                    <span><b>Creado el</b>: {formatDate(element.created_at,true)}</span>
                                    <span><b>Expira</b>: {formatDate(element.end_date,true)}</span>
                                    <span><b>Estado</b>: {element.is_active ? 'Activo':'Inactivo'}</span>
                                </div>
                            ))}
                        </div>
                    }/>
                    <Route path='setCurrentRange' element={
                        <NoAccess title={'Seccion aún no disponible'} description={'Pronto habilitaremos esta nueva sección'} noExit={true} />
                    }/>
                    <Route path='deleteInvoice' element={
                        <NoAccess title={'Seccion aún no disponible'} description={'Pronto habilitaremos esta nueva sección'} noExit={true} />
                    }/>
                </Routes>
            </div>
        </div>
    )
}