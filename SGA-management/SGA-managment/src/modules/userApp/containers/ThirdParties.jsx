import { useNavigate, Routes, Route, useParams } from 'react-router-dom';
import { BoldTitle } from '../components/BoldTitle';
import { ThirdPartyCard } from '../components/ThirdPartyCard';
import { postInfo } from '../../../utils/functions';
import './ThirdParties.css';
import { useState, useEffect } from 'react';
import { SearchBar } from '../components/SearchBar';
import { SelectOptions } from '../components/SelectOptions';
import { FormButton } from '../components/FormButton';
import { useAlert } from '../../../context/context';
import { FormNewThirdParties } from './forms/FormNewThirdParties';

export function ThirdParties() {
    const navigate = useNavigate();
    const params = useParams();
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
            const response = await postInfo('/getThirdParties', { company_id: 1 });
            
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
        if (searchVal === '') return true;
        
        const searchLower = searchVal.toLowerCase();
        
        const searchableFields = [
            thirdParty.name,
            thirdParty.legal_name,
            thirdParty.trade_name,
            thirdParty.email,
            thirdParty.company_mail,
            thirdParty.phone,
            thirdParty.contact_phone
        ].filter(Boolean);

        return searchableFields.some(field => 
            field.toString().toLowerCase().includes(searchLower)
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
                                            action={setSearchVal} 
                                            placeholder={'Buscar...'}
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
                                            popInAlert(<FormNewThirdParties reloadFun={fetchThirdParties}/>)
                                            }}text={'Crear Proveedor'} children={<i className="fa-solid fa-plus"/>}/>
                                    </div>
                                </div>
                            </div>

                            {loading ? (
                                <div className="thirdparties-loading">
                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                    Cargando terceros...
                                </div>
                            ) : error ? (
                                <div className="thirdparties-error">
                                    <p>{error}</p>
                                    <button onClick={handleRetry} className="retry-btn">
                                        Reintentar
                                    </button>
                                </div>
                            ) : thirdPartiesData.length === 0 ? (
                                <div className="thirdparties-empty">
                                    <p>No hay terceros registrados</p>
                                    <button onClick={fetchThirdParties} className="retry-btn">
                                        Actualizar
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="thirdparties-grid">
                                        {filteredThirdParties.map((thirdParty) => (
                                            <ThirdPartyCard
                                                key={thirdParty.id}
                                                thirdParty={thirdParty}
                                                onCardClick={handleCardClick}
                                            />
                                        ))}
                                    </div>
                                    
                                    {/* Mensaje cuando no hay resultados de búsqueda */}
                                    {filteredThirdParties.length === 0 && searchVal !== '' && (
                                        <div className="thirdparties-no-results">
                                            <p>No se encontraron terceros que coincidan con "{searchVal}"</p>
                                            <button onClick={() => setSearchVal('')} className="retry-btn">
                                                Limpiar búsqueda
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    }
                />

                <Route path=":id" element={<ThirdPartyDetail />} />
            </Routes>
        </div>
    );
}