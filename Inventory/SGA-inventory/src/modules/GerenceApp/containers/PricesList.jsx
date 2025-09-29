
import { useLocation, useNavigate } from 'react-router-dom'
import { NormalCard } from '../componets/NormalCard'
import { SectionTitle } from '../componets/SectionTitle'
import { SubSectionTitle } from '../componets/SubSectionTitle'
import { ListCard } from './ListCard'
import { ListPriceProducts } from './ListPriceProducts'
import { useEffect, useState } from 'react'
import { postInfo } from '../../../utils/functions'
import { useAlert } from '../../../context/context'
import { useAppInfo } from '../../../context/context'
import './PricesList.css'
import { CreatePricesList } from './forms/CreatePricesList'


export function PricesList({setActualist}){
    const location = useLocation();
    const navigate = useNavigate();
    const {popInAlert,setOpenAlert} = useAlert();
    const [listPrices,setListPrices] = useState([]);
    const {appInfo} = useAppInfo();
    const getPricesLists = async()=>{
        let res = await postInfo('/getPricesNameList',{
            company_id:appInfo.company_id,
            limit:3
        });
        if(res[0]){
            setListPrices(res[1]);
        }
        console.log(res);
    }

    useEffect(()=>{
        getPricesLists();
    },[])

    return(
        <div className="PricesList appSection">
            <div className="asideOptions">
                <SectionTitle text={'Listas de precios'}/>
                <div className="ListContainer">
                    {listPrices.length>0 && listPrices.map((element,index)=>(
                        <ListCard info={element} key={index} onClick={()=>{navigate(location.pathname + `/${element.list_name}`);if(setActualist!=undefined){setActualist(element)}}}/>
                    ))}
                </div>
                <div className="optionsList">
                    <NormalCard onClick={()=>{
                        popInAlert(<CreatePricesList/>);
                        setOpenAlert(true);
                    }} title={'Crear nueva lista'} description={'Define los procecios de tus productos.'}/>
                    <NormalCard title={'Historial de listas'} description={'Mira las todas tus listas de precios en el tiempo.'}/>
                    <NormalCard title={'Editar Lista'} description={'Edita y actualiza la información de tus productos.'}/>
                    <NormalCard title={'Eliminar Lista'} description={'Borra la lista de precios y usa otra versión.'}/>
                </div>
            </div>
            <div className="activeList">
                <SubSectionTitle text={'Lista actual: Lista_2025'}/>
                <div className="containerMainList">
                    {listPrices.length > 0 && (
                        <ListPriceProducts info={listPrices[0]}/>
                    )}{listPrices.length == 0 && (
                        <span>Cargando...</span>
                    )}
                </div>
            </div>
        </div>
    )
}