import { BrowserRouter as Router, Route, Routes,useLocation, useNavigate  } from 'react-router-dom';
import { BoldTitle } from "../components/BoldTitle";
import { Suspense } from 'react';
import { DescriptionSpan } from "../components/DescriptionSpan";
import { DespleList } from "../components/DespleList";
import { ReportDocuments } from './reports/ReportDocuments';
import { ReportTransactionDetails } from '../components/ReportTransactionDetails';
import { ReportBalance } from './reports/ReportBalance';
import { CardReport } from '../components/CardReport';
import { SearchBar } from '../components/SearchBar';
import { SelectOptions } from '../components/SelectOptions';
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
import { getCustomReports } from '../../../../../../costume-modules/reports';
import { AiButton } from '../components/ChatAiComponents/AiButton';
import './Reports.css'

export function Reports(){

    const {userConfig,userInfo,appInfo,appConfig} = useAppInfo();
    const navigate = useNavigate();
    const location = useLocation();
    const customReports = getCustomReports(appInfo, appConfig);

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
                        <div className="filterSettings">
                            <SearchBar placeholder={'Buscar informe'}/>
                            <AiButton/>
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
                            {customReports.map((report) => (
                                <CardReport key={report.path} type={report.type} title={report.title} description={report.description} onClick={() => handleNavigate(report.path)}/>
                            ))}
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
                {customReports.map(({ path, Component }) => (
                    <Route key={path} path={`/${path}`} element={
                        <Suspense fallback={<div role="status">Cargando informe personalizado...</div>}>
                            <Component key={appInfo?.company_id} showParentStage={path === 'NexoOtpProduction'} appInfo={appInfo} userInfo={userInfo} userConfig={userConfig} useAlert={useAlert} useAiAssistant={useAiAssistant}/>
                        </Suspense>
                    }/>
                ))}
            </Routes>
        </div>
    )
}
