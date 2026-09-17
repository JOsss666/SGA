import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { BoldTitle } from '../components/BoldTitle';
import { DescriptionSpan } from '../components/DescriptionSpan';
import { CardReport } from '../components/CardReport';
import { SearchBar } from '../components/SearchBar';
import { SelectOptions } from '../components/SelectOptions';
import { ProcessesReport } from './reports/ProcessesReport';
import './Reports.css';

export function Reports() {
    const navigate = useNavigate();
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
                            <CardReport
                                type="processes"
                                title="Informe de procesos"
                                description="Visualiza tus procesos y su avance"
                                onClick={() => navigate(`${reportsPath}/Processes`)}
                            />
                        </div>
                    </>
                } />
                <Route path="/Processes" element={<ProcessesReport />} />
                <Route path="*" element={<Navigate to={reportsPath} replace />} />
            </Routes>
        </div>
    );
}
