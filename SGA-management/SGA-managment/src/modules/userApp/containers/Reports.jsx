import { BrowserRouter as Router, Route, Routes,useLocation, useNavigate  } from 'react-router-dom';
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { DespleList } from "../components/DespleList";
import './Reports.css'
import { ReportDocuments } from './reports/ReportDocuments';
import { ReportTransactionDetails } from '../components/ReportTransactionDetails';
import { ReportBalance } from './reports/ReportBalance';
import { CardReport } from '../components/CardReport';
import { SearchBar } from '../components/SearchBar';
import { SelectOptions } from '../components/SelectOptions';
import { FormButton } from '../components/FormButton';

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
                        <div className="menuBar">
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
                                        {title:'Informe Costos Operativos',children:<i className="fa-solid fa-book"/>},
                                        {title:'Balance de prueba',children:<i className="fa-solid fa-book"/>,action:handleNavigate,path:'Balance'}
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
                            <div className="optionsBar">
                                <i className="fa-solid fa-bars IconList"/>
                                <i className="fa-solid fa-table-cells-large IconList"/>
                                <SearchBar placeholder={'Buscar'}/>
                                <SelectOptions title={'Filtro'} options={['ninguno']}/>
                                <SelectOptions title={'Orden'} options={['Alfabetico','Fecha de Creación','Rol']}/>
                            </div>
                        </div>
                    </>
                }/>
                // http://localhost:5173/SGA_process/:company_key/:user_key/reports/OPS
                <Route path='/OCS' element={<ReportDocuments type={'Client Order'}/>} />
                <Route path='/OPS' element={<ReportDocuments type={'Production Order'}/>} />
                <Route path='/DCS' element={<ReportDocuments type={'Purchase Document'}/>} />
                <Route path='/CIS' element={<ReportDocuments type={'Inventory Consume'}/>} />
                <Route path='/FVS' element={<ReportDocuments type={'Sell Invoice'}/>} />
                <Route path='/TRS' element={<ReportDocuments type={'TR'}/>} />
                <Route path='/TRS/:transaction_id' element={<ReportTransactionDetails />} />
                <Route path='/Balance' element={<ReportBalance/>}/>
            </Routes>
            <div className="galleryReports">
                <CardReport type={'Estadistico'} title={'Nombre Informe'} description={'Esta es la descripción del informe Esta es la descripción del informe Esta es la descripción del informe'}/>
                <CardReport type={'Documento'} title={'Nombre Informe'} description={'Esta es la descripción del informe Esta es la descripción del informe Esta es la descripción del informe'}/>
                <CardReport type={'contable'} title={'Nombre Informe'} description={'Esta es la descripción del informe Esta es la descripción del informe Esta es la descripción del informe'}/>
                <CardReport type={'contable'} title={'Nombre Informe'} description={'Esta es la descripción del informe Esta es la descripción del informe Esta es la descripción del informe'}/>
                <CardReport type={'Estadistico'} title={'Nombre Informe'} description={'Esta es la descripción del informe Esta es la descripción del informe Esta es la descripción del informe'}/>
                <CardReport type={'contable'} title={'Nombre Informe'} description={'Esta es la descripción del informe Esta es la descripción del informe Esta es la descripción del informe'}/>
                <CardReport type={'contable'} title={'Nombre Informe'} description={'Esta es la descripción del informe Esta es la descripción del informe Esta es la descripción del informe'}/>
            </div>
        </div>
    )
}