import { BrowserRouter as Router, Route, Routes,useLocation, useNavigate  } from 'react-router-dom';
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { DespleList } from "../components/DespleList";
import './Reports.css'
import { ReportDocuments } from './reports/ReportDocuments';
import { ReportTransactionDetails } from '../components/ReportTransactionDetails';

export function Reports(){

    const navigate = useNavigate();
    const location = useLocation();

    const handleNavigate = (path)=>{
        navigate(`${location.pathname}/${path}`);
    }

    return(
        <div className="Reports appSection">
            <Routes>
                <Route path="/" element={
                    <>
                        <div className="headSection">
                            <BoldTitle text={'Informes de procesos'}/>
                            <DescriptionSpan text={'Selecciona el informe que necesites'}/>
                        </div>
                        <div className="spaceSelectReports">
                            <DespleList children={<i className="fa-solid fa-book"/>} father={{
                                title:'Informes de Documentos'
                            }} options={[
                                {title:'Ordenes de cliente (OC)',children:<i className="fa-solid fa-file-contract"/>,action:handleNavigate,path:'OCS'},
                                {title:'Ordenes de producción (OP)',children:<i className="fa-solid fa-file-lines"/>,action:handleNavigate,path:'OPS'},
                                {title:'Documentos de compra (DC)',children:<i className="fa-solid fa-file-lines"/>,action:handleNavigate,path:'DCS'},
                                {title:'Consumos de inventario (CI)',children:<i className="fa-solid fa-file-lines"/>,action:handleNavigate,path:'CIS'},
                                {title:'Facturas de venta (FV)',children:<i className="fa-solid fa-file-invoice"/>,action:handleNavigate,path:'FVS'},
                                {title:'Transacciones (TR)',children:<i className="fa-solid fa-magnifying-glass-chart"/>,action:handleNavigate,path:'TRS'},
                                {title:'Informes adicionales',options:[
                                    {title:'Informe Costos Operativos',children:<i className="fa-solid fa-book"/>}
                                ]}
                            ]}/>
                            <DespleList children={<i className="fa-solid fa-book"/>} father={{
                                title:'Informes por estado'
                            }} options={[
                                {title:'Documentos reportados',children:<i className="fa-solid fa-book"/>},
                                {title:'Estado Ordenes de producción',children:<i className="fa-solid fa-file-lines"/>},
                                {title:'Volumen ordenes de clientes',children:<i className="fa-solid fa-file-lines"/>},
                                {title:'Informes adicionales',options:[
                                    {title:'Informe Costos Operativos',children:<i className="fa-solid fa-book"/>}
                                ]}
                            ]}/>
                            <DespleList children={<i className="fa-solid fa-calendar-check"/>} father={{
                                title:'Informes de aplicación'
                            }} options={[
                                {title:'Productividad usuarios',children:<i className="fa-solid fa-chart-line"/>},
                                {title:'Eficiencia procesos',children:<i className="fa-solid fa-business-time"/>},
                                {title:'Estado de ejecución',children:<i class="fa-solid fa-list-check"/>}
                            ]}/>
                        </div>
                    </>
                }/>
                // http://localhost:5173/SGA_process/:company_key/:user_key/reports/OPS
                <Route path='/OCS' element={<ReportDocuments type={'OC'}/>} />
                <Route path='/OPS' element={<ReportDocuments type={'OP'}/>} />
                <Route path='/DCS' element={<ReportDocuments type={'DC'}/>} />
                <Route path='/CIS' element={<ReportDocuments type={'CI'}/>} />
                <Route path='/FVS' element={<ReportDocuments type={'FV'}/>} />
                <Route path='/TRS' element={<ReportDocuments type={'TR'}/>} />
                <Route path='/TRS/:transaction_id' element={<ReportTransactionDetails />} />
            </Routes>
        </div>
    )
}