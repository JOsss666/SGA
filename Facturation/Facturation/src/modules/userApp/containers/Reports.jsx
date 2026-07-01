import { BrowserRouter as Router, Route, Routes,useLocation, useNavigate  } from 'react-router-dom';
import { BoldTitle } from "../components/BoldTitle";
import React, { Suspense } from 'react';
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
import { useEffect, useState } from 'react';
import { ReportKardex } from './reports/ReportKardex';
import { PathLocation } from '../components/PathLocation';
import { ReportAccountTransactions } from './reports/ReportAccountTransactions';
import { ProcessesReport } from './reports/ProcessesReport';
import { EficiencyReport } from './reports/EficiencyReport';
import { BriefCaseReport } from './reports/BriefCaseReport';
import { useAppInfo,useAiAssistant, useAlert } from '../../../context/context';
import { CashBoxesCloseReport } from './reports/CashBoxesCloseReport';
import { ReportHistorialInstance } from './reports/ReportHIstorialInstance';
import { PortfolioReportDetail } from './reports/PortfolioReportDetail';

// Costume modules

    // Z&J S.A.S
    const CustomZJClicksReport = React.lazy(() => 
        import('../../../../../../costume-modules/zjSAS.S/src/containers/reports/ClicksReport').then(module => ({ default: module.ClicksReport }))
    );
    const CustomZJServicesReport = React.lazy(() => 
        import('../../../../../../costume-modules/zjSAS.S/src/containers/reports/ServiceMovements').then(module => ({ default: module.ServiceMovements }))
    );

    const CustomZJAuditoryClicksReport = React.lazy(() => 
        import('../../../../../../costume-modules/zjSAS.S/src/containers/reports/AuditoryClicksReport').then(module => ({ default: module.AuditoryClicksReport }))
    );

export function Reports(){

    const {userConfig,userInfo,appInfo,appConfig} = useAppInfo();
    const navigate = useNavigate();
    const location = useLocation();

    console.log(userConfig)
    
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
                                    ]}
                                ]}/>
                                <DespleList children={<i className="fa-solid fa-book"/>} father={{
                                    title:'Informes por estado'
                                }} options={[
                                    {title:'Documentos reportados',children:<i className="fa-solid fa-book"/>},
                                    {title:'Balance de prueba',children:<i className="fa-solid fa-book"/>,action:handleNavigate,path:'Balance'},
                                    {title:'Estado de Existencias y Movimientos (Kardex)',children:<i className="fa-solid fa-book"/>,action:handleNavigate,path:'kardex'},
                                    {title:'Estado Ordenes de producción',children:<i className="fa-solid fa-file-lines"/>},
                                    {title:'Volumen ordenes de clientes',children:<i className="fa-solid fa-file-lines"/>},
                                    {title:'Informes adicionales',options:[
                                        {title:'Informe Costos Operativos',children:<i className="fa-solid fa-book"/>}
                                    ]}
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
                        <div className="galleryReports">
                            {false && <CardReport type={'Documento'} title={'Ordenes de cliente (OCS)'} description={'Consulta los detalles de todas tus Ordenes de cliente'} onClick={()=>{
                                handleNavigate('OCS')
                            }} />}
                            {false && <CardReport type={'Documento'} title={'Ordenes de producción (OPS)'} description={'Consulta los detalles de todas tus Ordenes de producción'} onClick={()=>{
                                handleNavigate("OPS")
                            }}/>}
                            {false && <CardReport type={'Documento'} title={'Documentos de compra (DCS)'} description={'Consulta los detalles de todos tus Documentos de compra'} onClick={()=>{
                                handleNavigate('DCS')
                            }}/>}
                            {false && <CardReport type={'Documento'} title={'Consumos de inventario (CIS)'} description={'Consulta los detalles de todos tus Consumos de inventario'} onClick={()=>{
                                handleNavigate('CIS')
                            }}/>}
                            {false && <CardReport type={'Documento'} title={'Facturas de venta (FVS)'} description={'Consulta los detalles de todas tus Facturas de venta'} onClick={()=>{
                                handleNavigate('FVS')
                            }}/>}
                            <CardReport type={'Documento'} title={'Transacciones (TRS)'} description={'Consulta los detalles de todas tus Transacciones'} onClick={()=>{
                                handleNavigate('TRS')
                            }}/>
                            {false && <CardReport type={'contable'} title={'Balance de prueba'} description={'Genera un balance de prueba de la contabilidad de tu empresa'} onClick={()=>{
                                handleNavigate('Balance')
                            }}/>}
                            {false && <CardReport type={'inventarios'} title={'Movimiento Inventario (Kardex)'} description={'Visualiza todos los movimientos por referencia de tu inventario'} onClick={()=>{
                                handleNavigate('Kardex')
                            }}/>}
                            <CardReport type={'processes'} title={'Informe de procesos'} description={'Visualiza los procesos de tu empresa'} onClick={()=>{
                                handleNavigate('Processes')
                            }}/>
                            {false && (
                                <CardReport type={'processes'} title={'Eficiencia usuarios'} description={'Visualiza la eficiencia de los usuarios de tu empresa'} onClick={()=>{
                                    handleNavigate('Eficiency')
                                }}/>
                            )}
                            <CardReport type={'contable'} title={'Informe de cartera (Alpha)'} description={'Versión de prueba Alpha V 0.1'} onClick={()=>{
                                handleNavigate('BriefCases')
                            }}/>
                            {appConfig?.access?.services?.personalized?.['custom-modules']?.["z&j_clicksControl"]?.access && (
                                <CardReport type={'processes'} title={'Informe de clicks (Beta)'} description={'Versión de prueba Beta V 1.1'} onClick={()=>{
                                    handleNavigate('zjClicksReport')
                                }}/>
                            )}
                            {appConfig?.access?.services?.personalized?.['custom-modules']?.["z&j_clicksControl"]?.access && (
                                <CardReport type={'inventarios'} title={'Informe de servicios (Alpha)'} description={'Versión de prueba Alpha V 1.1'} onClick={()=>{
                                    handleNavigate('zjServicesReport')
                                }}/>
                            )}
                            {appConfig?.access?.services?.personalized?.['custom-modules']?.["z&j_clicksControl"]?.access && (
                                <CardReport type={'processes'} title={'Auditoria de clicks (V0.01)'} description={'Versión de prueba Alpha V 1.1'} onClick={()=>{
                                    handleNavigate('zjAuditoryClicksReport')
                                }}/>
                            )}
                            <CardReport type={'contable'} title={'Informe Cierres de caja'} description={'Consulte los cierres de caja'} onClick={()=>{
                                handleNavigate('CashBoxesCloseReport')
                            }}/>
                            <CardReport type={'processes'} title={'Historial de procesos'} description={'Consulte el historial de acciones en los procesos'} onClick={()=>{
                                handleNavigate('ProcessInstanceHistorial')
                            }}/>
                            <CardReport type={'contable'} title={'Balance de prueba'} description={'Consulte la contabilización de su empresa'} onClick={()=>{
                                handleNavigate('Balance')
                            }}/>
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
                <Route path='/TRS/:transaction_id' element={<ReportTransactionDetails/>} />
                <Route path='/Balance' element={<ReportBalance/>}/>
                <Route path='/Balance/:account_id' element={<ReportAccountTransactions/>}/>
                <Route path='/Kardex' element={<ReportKardex/>}/>
                <Route path='/Processes' element={<ProcessesReport/>}/>
                <Route path='/Eficiency' element={<EficiencyReport/>}/>
                <Route path='/BriefCases' element={<BriefCaseReport/>}/>
                <Route path='/BriefCases/:thirdParty_id' element={<PortfolioReportDetail/>}/>
                <Route path='/ProcessInstanceHistorial' element={<ReportHistorialInstance/>}/>
                <Route path='/CashBoxesCloseReport' element={<CashBoxesCloseReport/>}/>
                {appConfig?.access?.services?.personalized?.['custom-modules']?.["z&j_clicksControl"]?.access && (
                    <Route path='/zjClicksReport' element={
                    <Suspense fallback={<div>Cargando componente pesado...</div>}>
                        <CustomZJClicksReport useAlert={useAlert} appInfo={appInfo} userConfig={userConfig} userInfo={userInfo} useAiAssistant={useAiAssistant}/>
                    </Suspense>
                    }/>
                )}
                {appConfig?.access?.services?.personalized?.['custom-modules']?.["z&j_clicksControl"]?.access && (
                    <Route path='/zjAuditoryClicksReport' element={
                    <Suspense fallback={<div>Cargando modulo personalizado...</div>}>
                        <CustomZJAuditoryClicksReport useAlert={useAlert} appInfo={appInfo} userConfig={userConfig} userInfo={userInfo} useAiAssistant={useAiAssistant}/>
                    </Suspense>
                    }/>
                )}
                {appConfig?.access?.services?.personalized?.['custom-modules']?.["z&j_clicksControl"]?.access && (
                    <Route path='/zjServicesReport' element={
                    <Suspense fallback={<div>Cargando componente pesado...</div>}>
                        <CustomZJServicesReport appInfo={appInfo} userConfig={userConfig} userInfo={userInfo} useAiAssistant={useAiAssistant}/>
                    </Suspense>
                    }/>
                )}
            </Routes>
        </div>
    )
}