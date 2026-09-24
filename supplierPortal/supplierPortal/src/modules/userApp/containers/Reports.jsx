import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { BoldTitle } from '../components/BoldTitle';
import { DescriptionSpan } from '../components/DescriptionSpan';
import { CardReport } from '../components/CardReport';
import { SearchBar } from '../components/SearchBar';
import { SelectOptions } from '../components/SelectOptions';
import { ProcessesReport } from './reports/ProcessesReport';
import { ProcessesReferencesReport } from './reports/ProcessesReferencesReport';
import { lazy, Suspense } from 'react';
import { useAlert, useAppInfo } from '../../../context/context';
import { urlSer } from '../../../App';
import { ProcessStatusAlert } from './Alerts/ProcessStatusAlert';
import './Reports.css';

const OtpProductionReport = lazy(() => import('../../../../../../costume-modules/nexo360/src/pages/otpProductionReport').then(module => ({ default: module.OtpProductionReport })));

export function Reports() {
    const navigate = useNavigate();
    const { appInfo } = useAppInfo();
    const { popInAlert } = useAlert();
    const canViewNexoOtp = String(appInfo?.company_id) === '7';
    const { company_key, user_key } = useParams();
    const reportsPath = `/SGA_management/${company_key}/${user_key}/reports`;

    return (
        <div className="Reports appSection">
            <Routes>
                <Route path="/" element={
                    <>
                        <div className="headSection">
                            <BoldTitle text="Informes de procesos" />
                            <DescriptionSpan text="Consulta el estado de tus procesos" />
                        </div>
                        <div className="menuBar">
                            <div className="optionsBar">
                                <i className="fa-solid fa-bars IconList" />
                                <i className="fa-solid fa-table-cells-large IconList" />
                                <SearchBar placeholder="Buscar" />
                                <SelectOptions title="Filtro" options={['ninguno']} />
                                <SelectOptions title="Orden" options={['Alfabetico', 'Fecha de Creación', 'Rol']} />
                            </div>
                        </div>
                        <div className="galleryReports">
                            {canViewNexoOtp && <CardReport
                                type="processes"
                                title="Producción por OTP NEXO 360"
                                description="Consulta tus órdenes de producción y sus medidas"
                                onClick={() => navigate(`${reportsPath}/NexoOtpProduction`)}
                            />}
                            <CardReport
                                type="processes"
                                title="Informe de procesos"
                                description="Visualiza tus procesos y su avance"
                                onClick={() => navigate(`${reportsPath}/Processes`)}
                            />
                            <CardReport
                                type="processes"
                                title="Informe de procesos con referencias"
                                description="Tus procesos, su avance y sus referencias"
                                onClick={() => navigate(`${reportsPath}/ProcessesReferences`)}
                            />
                        </div>
                    </>
                } />
                {canViewNexoOtp && <Route path="/NexoOtpProduction" element={
                    <Suspense fallback={<div role="status">Cargando informe de OTP...</div>}>
                        <OtpProductionReport appInfo={appInfo} useAlert={useAlert}
                            showClient={false} showParentStage={false}
                            supplierAccess={{ companyKey: company_key, accessKey: user_key, apiBaseUrl: urlSer }}
                            onOpenOtp={instanceId => popInAlert(<ProcessStatusAlert instance_id={instanceId} />)} />
                    </Suspense>
                } />}
                <Route path="/Processes" element={<ProcessesReport />} />
                <Route path="/ProcessesReferences" element={<ProcessesReferencesReport />} />
                <Route path="*" element={<Navigate to={reportsPath} replace />} />
            </Routes>
        </div>
    );
}
