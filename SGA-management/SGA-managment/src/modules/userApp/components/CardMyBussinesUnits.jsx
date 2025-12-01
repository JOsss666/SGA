
import './CardMyBussinesUnits.css';
import { BoldTitle } from './BoldTitle';
import { DescriptionSpan } from './DescriptionSpan';
import { MoreOptions } from './MoreOptions';
import { useAlert, useNotifications } from '../../../context/context';
import { FormNewStore } from '../containers/forms/FormNewStore';
import { postInfo } from '../../../utils/functions';
import { useNavigate, useParams } from 'react-router-dom';

export function CardMyBussinesUnits({onClick,info,image,reloadFun}){

    const {popInAlert} = useAlert();
    const {addNotification} = useNotifications();
    const navigate = useNavigate();
    const params = useParams();

    const editStore = ()=>{
        popInAlert(<FormNewStore/>)
    }

    const deleteStore = async()=>{
        let res = await postInfo('/deleteStore',{
            company_id:info.company_id,
            store_id:info.id
        })
        console.log(res);
        if(res[0]){
            addNotification({
                type:'aproved',
                title:`Unidad de negocio ${info.name} eliminada`,
                description:`La unidad de negócion ${info.name} fue eliminada correctamente.`
            })
        }else{
            addNotification({
                type:'Error',
                title:`Error al elminar unidad de negocio`,
                description:`Hubo un problema al intentar eliminar La unidad de negócion ${info.name}, intentelo nuevamente.`
            })
        }
        if(reloadFun != undefined){
            reloadFun();
        }
    }

    const moveToDetails = ()=>{
        navigate(`/SGA_management/${params.company_key}/${params.user_key}/myBussines/Units/${info.id}`)
    }

    return(
        <div className="CardMyBussinesUnits">
            <img src={image} alt="ImageBackground" onClick={onClick}/>
            <div className="contentCardMyBussines">
                <BoldTitle text={info.name}/>
                <DescriptionSpan text={info.address}/>
            </div>
                            <MoreOptions options={[
                    {text:'Editar',icon:<i className="fa-solid fa-pencil"/>,action:editStore},
                    {text:'Eliminar',icon:<i className="fa-solid fa-trash"/>,action:deleteStore},
                    {text:'Ver detalles',icon:<i className="fa-solid fa-circle-info"/>,action:moveToDetails},
                    {text:'Compartir',icon:<i className="fa-solid fa-share-nodes"/>},
                    {text:'Ver actividad',icon:<i className="fa-solid fa-eye"/>}
                ]}/>
        </div>
    )
}