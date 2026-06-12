import { useNavigate, Routes, Route, useParams } from 'react-router-dom';
import { BoldTitle } from '../components/BoldTitle';
import { ThirdPartyCard } from '../components/ThirdPartyCard';
import { postInfo } from '../../../utils/functions';
import './ThirdParties.css';
import { useState, useEffect } from 'react';
import { SearchBar } from '../components/SearchBar';
import { SelectOptions } from '../components/SelectOptions';
import { FormButton } from '../components/FormButton';
import { useAlert, useAppInfo } from '../../../context/context';
import { FormNewThirdParties } from './forms/FormNewThirdParties';
import { LoadingSpace } from './LoadingSpace';
import { NoResults } from './NoResults';


export function ThirdParties() {
    const navigate = useNavigate();
    const params = useParams();
    const {appInfo,userConfig} = useAppInfo();
    const [thirdPartiesData, setThirdPartiesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchVal, setSearchVal] = useState('');
    const {popInAlert} = useAlert();

    useEffect(() => {
        fetchThirdParties();
    }, []);

    const fetchThirdParties = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await postInfo('/getThirdParties', { company_id: appInfo.company_id});
            
            if (response[0]){
                setThirdPartiesData(response[1])
            }
            setLoading(false)

        } catch (error) {
            console.error('Error fetching third parties:', error);
            setThirdPartiesData([]);
            setError('Error al cargar los terceros');
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (thirdPartyId) => {
        navigate(`/SGA_management/${params.company_key}/${params.user_key}/thirdParties/${thirdPartyId}`);
    };

    const handleRetry = () => {
        fetchThirdParties();
    };

    // Función de búsqueda
    const handleSearch = (thirdParty) => {
        if (!searchVal.trim()) return true;

        const searchLower = searchVal.toLowerCase();

        return Object.values(thirdParty)
            .filter(v => typeof v === "string" || typeof v === "number")
            .some(v =>
                v.toString().toLowerCase().includes(searchLower)
            );
    };



    // Obtener terceros filtrados
    const filteredThirdParties = thirdPartiesData.filter(handleSearch);

    const ThirdPartyDetail = () => {
        return (
            <div className="thirdparty-detail">
                <h2>Detalle del Tercero</h2>
                <p>Funcionalidad en desarrollo...</p>
                <button onClick={() => navigate('/thirdParties')}>
                    Volver a la lista
                </button>
            </div>
        );
    };

    return (
        <div className="ThirdParties">
            <Routes>
                <Route
                    path=""
                    element={
                        <div className="ThirdPartiesMain">
                            <div className="thirdparties-header">
                                <div className="header-left">
                                    <BoldTitle text={'Terceros'} />
                                    <p className="thirdparties-description">
                                        Gestiona y administra todos los terceros de tu empresa
                                    </p>
                                    <div className="thirdparties-counter">
                                        <span>Total Terceros: {thirdPartiesData.length}</span>
                                        {searchVal && (
                                            <span> | Mostrando: {filteredThirdParties.length}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="header-right">
                                    <div className="thirdparties-search">
                                        <SearchBar
                                            value={searchVal}
                                            action={setSearchVal}
                                            placeholder="Buscar..."
                                        />
                                        <SelectOptions
                                            title={'Orden'}
                                            options={[
                                                'Nombre (ascendente)',
                                                'Nombre (descendente)' , 
                                                'Fecha de creacion (ascendente)',
                                                'Fecha de creacion (descendente)',
                                            ]}
                                        />
                                        <SelectOptions
                                            title={'Filtros'}
                                            options={[
                                                'Ninguno',
                                                'Personalizado'
                                            ]}
                                        />
                                        <FormButton onClick={()=>{
                                            popInAlert(<FormNewThirdParties reloadFun={fetchThirdParties} quickCreation={!userConfig.access.sections.thirdparties.can_create}/>)
                                            }}text={'Crear Tercero'} children={<i className="fa-solid fa-plus"/>}/>
                                    </div>
                                </div>
                            </div>

                            {loading && (
                                <LoadingSpace title={'Cargando terceros'} description={'Esto no debe tardar mucho'}/>
                            )}
                                   
                            {!loading && (
                                 <div className="thirdparties-grid">
                                    {filteredThirdParties.map((thirdParty) => (
                                        <ThirdPartyCard
                                            key={thirdParty.id}
                                            info={thirdParty}
                                            onCardClick={handleCardClick}
                                        />
                                    ))}
                                    {filteredThirdParties.length == 0 && (
                                        <NoResults title={'No hay terceros disponibles para mostrar'}/>
                                    )}
                                </div>
                            )}
                        </div>
                    }
                />

                <Route path=":id" element={<ThirdPartyDetail />} />
            </Routes>
        </div>
    );
}