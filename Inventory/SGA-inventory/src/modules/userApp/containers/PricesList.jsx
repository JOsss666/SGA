import './PricesList.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { postInfo } from '../../../utils/functions';
import { useAlert, useAppInfo, useNotifications } from '../../../context/context';
import { CreatePricesList } from './forms/CreatePricesList';
import { FormNewPriceList } from './forms/FormNewPriceList';
import { SearchBar } from '../components/SearchBar';
import { SelectOptions } from '../components/SelectOptions';
import { PathLocation } from '../components/PathLocation';
import { BoldTitle } from '../components/BoldTitle';
import { DescriptionSpan } from '../components/DescriptionSpan';
import { ButtonMenu } from '../components/ButtonMenu';
import { MoreOptions } from '../components/MoreOptions';
import { ButtonDownload } from '../components/ButtonDownload';
import { LoadingSpace } from './LoadingSpace';
import { PricesListCard } from '../components/PricesListCard';


export function PricesList({ setActualist }) {
    const { appInfo, userConfig } = useAppInfo();
    const { popInAlert } = useAlert();
    const { addNotification } = useNotifications(); // asegurar que existe
    const location = useLocation();
    const navigate = useNavigate();

    const [disabled, setDisabled] = useState(false);
    const [displayGird, setDisplayGrid] = useState('grid');
    const [searchVal, setSearchVal] = useState('');
    const [listPrices, setListPrices] = useState([]);
    const [loading, setLoading] = useState(false);

    // 1. Función para obtener listas
    const getPricesLists = async () => {
    setLoading(true);
    try {
        const res = await postInfo('/inventory/getPricesList', {
            company_id: appInfo.company_id,
            allowedStores: userConfig.access.stores.enabled.length > 0 ? userConfig.access.stores.enabled : undefined
        });
        if (res && res[0]) {
            setListPrices(res[1]);
        } else {
            setListPrices([]);
        }
    } catch (error) {
        console.error("Error en getPricesLists:", error);
        setListPrices([]);
    } finally {
        setLoading(false);
    }
};

    // 2. Función para eliminar (AHORA está fuera de getPricesLists)
   const handleDeleteList = async (id) => {
    try {
        // Usa postInfo en lugar de fetch localhost
        const res = await postInfo('/inventory/deletePriceList', { lists: [id] });
        if (res && res[0] === true) {
            addNotification({ type: 'aproved', title: 'Eliminada', description: 'Lista eliminada correctamente.' });
            // Actualización optimista: elimina la tarjeta del estado local inmediatamente
            setListPrices(prevList => prevList.filter(list => list.id !== id));
        } else {
            addNotification({ type: 'error', title: 'Error', description: res?.[1]?.message || 'No se pudo eliminar.' });
        }
    } catch (error) {
        console.error(error);
        addNotification({ type: 'error', title: 'Error', description: error.message });
    }
};

    const handleNavigate = (id) => {
        navigate(`${location.pathname}/${id}`);
    };

    const handleCreateNewList = () => {
        popInAlert(<FormNewPriceList reloadInfo={getPricesLists} />);
    };

    useEffect(() => {
        getPricesLists();
    }, []);

    return (
        <div className="PricesList appSection">
            <div className="headPricesListC">
                <PathLocation />
                <BoldTitle text={'Listas de precios'} />
                <DescriptionSpan text={'Consulta, modifica y mas tus listas de precios'} />
            </div>
            <div className="searchOptions">
                <SearchBar placeholder={'Buscar'} action={setSearchVal} />
                <SelectOptions title={'Filtro'} options={['ninguno']} />
                <SelectOptions title={'Orden'} options={['Alfabetico','Fecha de Creación','Categoría']} />
                <div className="organizerView">
                    <ButtonMenu noRotate={true} onClick={() => {
                        displayGird === 'grid' ? setDisplayGrid('tree') : setDisplayGrid('grid');
                    }} title={'Cambiar distribución'}>
                        <i className={displayGird === 'grid' ? 'fa-solid fa-border-all' : 'fa-solid fa-folder-tree'} />
                    </ButtonMenu>
                </div>
                <ButtonDownload title={'Descargar listas de precios'} />
                <MoreOptions children={<i className="fa-solid fa-ellipsis-vertical"/>} options={[
                    { text:'Crear nueva lista', action: handleCreateNewList, icon:<i className="fa-solid fa-plus"/> },
                    { text:'Refrescar', action: getPricesLists, icon:<i className="fa-solid fa-sync"/> },
                    { text:'Ver Historial', action: undefined, icon:<i className="fa-solid fa-eye"/> },
                ]} />
            </div>
            {!loading && (
                <div className="gridPricesList">
                    {listPrices.map((element, index) => (
                        <PricesListCard
                            key={index}
                            info={element}
                            onClick={() => handleNavigate(element.id)}
                            onDelete={handleDeleteList}   // ← NUEVA PROP
                        />
                    ))}
                </div>
            )}
            {loading && <LoadingSpace title={'Cargando lista de precios'} />}
        </div>
    );
}