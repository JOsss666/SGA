import { useNotifications } from '../../../context/context'
import { postInfo } from '../../../utils/functions'
import { CheckSquare } from './CheckSquare'
import { MoreOptions } from './MoreOptions'
import './RowTableUsers.css'
import { TagIndicator } from './TagIndicator'
import { UserCard } from './UserCard'
import { useNavigate, useParams } from 'react-router-dom'

export function RowTableUsers({info,onClick,reloadFun}){

    console.log(info)

    const {addNotification} = useNotifications();
    const navigate = useNavigate();
    const params = useParams();

    const handlenavigate = ()=>{
        navigate(`/SGA_management/${params.company_key}/${params.user_key}/users/${info.user_id}`)
    }

    const deleteUser = async()=>{
        let res = await postInfo('/deleteUser',{
            user_id:info.user_id,
            company_id:info.company_id
        })
        if(res){
            addNotification({
                type:'aproved',
                title:`Usuario "${info.user_name}" eliminado.`,
                description:`El usuario "${info.user_name}" fue eliminado correctamente.`
            })
            if(reloadFun != undefined){
                reloadFun();
            }
        }else{
            addNotification({
                type:'error',
                title:`Error al eliminar usuario "${info.user_name}"`,
                description:`Hubo un problema al elimanr el usuario "${info.user_name}", intenelo de nuevo.`
            })
        }
    }
    
    return(
        <div className="RowTableUsers">
            <CheckSquare/>
            <span className='atributeRow idContainer'>{info.user_id}</span>
            <span className='atributeRow UserCardContainer'><UserCard imgSrc={'https://i0.wp.com/digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png?fit=500%2C500&ssl=1'} name={info.user_name} desc={info.user_mail}/></span>
            <span className='atributeRow'><TagIndicator type={'indicator'} title={info.user_roll}/></span>
            <span className='atributeRow UserCardContainer'>{info.user_key}</span>
            <span className='atributeRow'>Tienda {info.company_id}</span>
            <span className='atributeRow'>{(info.created_at).substring(0,10)}</span>
            <span className='atributeRow'>{info.updated_at != null?(info.updated_at).substring(0,10):''}</span>
            <span className='atributeRow redirectSpan' onClick={onClick}><MoreOptions options={[
                {text:'Editar',icon:<i className="fa-solid fa-pencil"/>},
                {text:'Eliminar',icon:<i className="fa-solid fa-trash"/>,action:deleteUser},
                {text:'Ver detalles',icon:<i className="fa-solid fa-circle-info"/>,action:handlenavigate},
                {text:'Compartir',icon:<i className="fa-solid fa-share-nodes"/>},
                {text:'Ver actividad',icon:<i className="fa-solid fa-eye"/>}
            ]}/></span>
        </div>
    )
}