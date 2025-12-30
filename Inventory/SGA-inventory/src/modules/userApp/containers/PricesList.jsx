import './PricesList.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { NormalCard } from '../components/NormalCard';
import { SectionTitle } from '../components/SectionTitle';
import { SubSectionTitle } from '../components/SubSectionTitle';
import { ListCard } from './ListCard';
import { ListPriceProducts } from './ListPriceProducts';
import { useEffect, useState } from 'react';
import { postInfo } from '../../../utils/functions';
import { useAlert, useAppInfo } from '../../../context/context';
import { CreatePricesList } from './forms/CreatePricesList';
import { SearchBar } from '../components/SearchBar';
import { SelectOptions } from '../components/SelectOptions';
import { FormButton } from '../components/FormButton';
import { MoreOptions } from '../components/MoreOptions';

export function PricesList({ setActualist }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { popInAlert, setOpenAlert } = useAlert();
    const [listPrices, setListPrices] = useState([]);
    const [filteredLists, setFilteredLists] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const { appInfo } = useAppInfo();

    const priceListCards = [
        {
            id: 1,
            title: 'Lista 1',
            image: 'https://i.pinimg.com/736x/00/2c/13/002c13c1b24794d3fd202c2a184c46d3.jpg',
            onlyTitle: true,
            listNumber: '1'
        },
        {
            id: 2,
            title: 'Lista 2',
            image: 'https://i.pinimg.com/736x/00/2c/13/002c13c1b24794d3fd202c2a184c46d3.jpg',
            onlyTitle: true,
            listNumber: '2'
        },
        {
            id: 3,
            title: 'Lista 3',
            image: 'https://i.pinimg.com/736x/00/2c/13/002c13c1b24794d3fd202c2a184c46d3.jpg',
            onlyTitle: true,
            listNumber: '3'
        },
        {
            id: 4,
            title: 'Lista 4',
            image: 'https://i.pinimg.com/736x/00/2c/13/002c13c1b24794d3fd202c2a184c46d3.jpg',
            onlyTitle: true,
            listNumber: '4'
        },
    ];

    const getPricesLists = async () => {
        setLoading(true);
        let res = await postInfo('/getPricesNameList', {
            company_id: appInfo.company_id,
            limit: 10
        });
        if (res[0]) {
            setListPrices(res[1]);
            setFilteredLists(res[1]);
        }
        setLoading(false);
        console.log(res);
    }

    useEffect(() => {
        getPricesLists();
    }, []);

    useEffect(() => {
        let filtered = listPrices;
        
        if (searchTerm) {
            filtered = filtered.filter(list =>
                list.list_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                list.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        if (selectedFilter) {
            switch (selectedFilter) {
                case 'active':
                    filtered = filtered.filter(list => list.is_active);
                    break;
                case 'inactive':
                    filtered = filtered.filter(list => !list.is_active);
                    break;
                case 'with_categories':
                    filtered = filtered.filter(list => list.has_categories);
                    break;
            }
        }
        
        setFilteredLists(filtered);
    }, [searchTerm, selectedFilter, listPrices]);

    const handleSearch = (term) => {
        setSearchTerm(term);
    };

    const handleFilterChange = (filter) => {
        setSelectedFilter(filter);
    };

    const handleNavigate = (listName) => {
        navigate(location.pathname + `/${listName}`);
        if (setActualist != undefined) {
            const actualList = listPrices.find(list => list.list_name === listName);
            setActualist(actualList);
        }
    };

    const handleCreateNew = () => {
        popInAlert(<CreatePricesList reloadFun={getPricesLists} />);
        setOpenAlert(true);
    };

    const handleEditList = (list) => {
        popInAlert(<CreatePricesList editData={list} reloadFun={getPricesLists} />);
    };

    const handleDeleteList = async (list) => {
        if (window.confirm(`¿Estás seguro de eliminar la lista "${list.list_name}"?`)) {
            let res = await postInfo('/deletePriceList', {
                company_id: appInfo.company_id,
                price_list_id: list.id
            });
            if (res[0]) {
                getPricesLists();
            }
        }
    };

    const handleViewDetails = (list) => {
        navigate(location.pathname + `/${list.list_name}`);
        if (setActualist) {
            setActualist(list);
        }
    };

    return (
        <div className="PricesList appSection">
            <div className="asideOptions">
               <div className="sectionTitleContainer">
                    <SectionTitle text={'Listas de precios'}/>
                </div>
                <div className="ListContainer">
                    {listPrices.length>0 && listPrices.map((element,index)=>(
                        <ListCard info={element} key={index} onClick={()=>{navigate(location.pathname + `/${element.list_name}`);if(setActualist!=undefined){setActualist(element)}}}/>
                    ))}
                </div>
                <div className="filterSection">
                    <SearchBar placeholder={'Buscar'} onChange={handleSearch} />
                    <SelectOptions
                        title={'Filtro'}
                        options={[]}
                        onChange={handleFilterChange}
                    />
                    <FormButton text={'+ Crear Nuevo'} onClick={handleCreateNew} />
                    <FormButton text={'Historial de listas'} onClick={[]} />
                </div>

                {/* Listas numeradas con menú desplegable */}
                <div className="numberedListsSection">
                    <SubSectionTitle text={'Listas'}/>
                    <div className="numberedLists">
                        {priceListCards.map((list) => (
                            <div className="numberedListCard" key={list.id}>
                                <NormalCard
                                    title={list.title}
                                    onlyTitle={list.onlyTitle}
                                    img={'https://i.pinimg.com/736x/00/2c/13/002c13c1b24794d3fd202c2a184c46d3.jpg'}
                                    onClick={() => handleNavigate(list.title)}
                                />
                                {/* Menú desplegable */}
                                <MoreOptions options={[
                                    { text: 'Editar', icon: <i className="fa-solid fa-pencil" />, action: () => console.log('Editar', list.title) },
                                    { text: 'Eliminar', icon: <i className="fa-solid fa-trash" />, action: () => console.log('Eliminar', list.title) },
                                    { text: 'Compartir', icon: <i className="fa-solid fa-share-nodes" /> },
                                ]} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="activeList">
                <SubSectionTitle text={'Nombre de la lista de precios'}/>
                <div className="containerMainList">
                    {listPrices.length > 0 ? (
                        <ListPriceProducts info={listPrices[0]}/>
                    ) : listPrices.length === 0 && !loading ? (
                        <div className="noListsMessage">
                            <span>No hay listas de precios disponibles</span>
                            <FormButton 
                                text={'Crear primera lista'} 
                                onClick={handleCreateNew}
                                style={{ marginTop: '2vh' }}
                            />
                        </div>
                    ) : (
                        <span>Cargando...</span>
                    )}
                </div>
            </div>
        </div>
    );
}