import { CheckSquare } from './CheckSquare'
import { MoreOptions } from './MoreOptions'
import './RowTableUsers.css'
import { TagIndicator } from './TagIndicator'
import { UserCard } from './UserCard'
import { useNavigate, useParams } from 'react-router-dom'

export function RowTableUsers({info,onClick}){

    const navigate = useNavigate();
    const params = useParams();

    const handlenavigate = ()=>{
        navigate(`/SGA_management/${params.company_key}/${params.user_key}/users/${info.user_id}`)
    }
    
    return(
        <div className="RowTableUsers">
            <CheckSquare/>
            <span className='atributeRow idContainer'>{info.user_id}</span>
            <span className='atributeRow UserCardContainer'><UserCard imgSrc={'https://i.pinimg.com/1200x/3e/14/cc/3e14cc0efc15b6f1695706c1fc48d5cd.jpg'} name={info.user_name} desc={info.user_mail}/></span>
            <span className='atributeRow'><TagIndicator type={'indicator'} title={info.user_roll}/></span>
            <span className='atributeRow UserCardContainer'>{info.user_key}</span>
            <span className='atributeRow'>Tienda {info.company_id}</span>
            <span className='atributeRow'>{(info.created_at).substring(0,10)}</span>
            <span className='atributeRow'>{(info.updated_at).substring(0,10)}</span>
            <span className='atributeRow redirectSpan' onClick={onClick}><MoreOptions options={[
                {text:'Editar',icon:<i className="fa-solid fa-pencil"/>},
                {text:'Eliminar',icon:<i className="fa-solid fa-trash"/>},
                {text:'Ver detalles',icon:<i className="fa-solid fa-circle-info"/>,action:handlenavigate},
                {text:'Compartir',icon:<i className="fa-solid fa-share-nodes"/>},
                {text:'Ver actividad',icon:<i className="fa-solid fa-eye"/>}
            ]}/></span>
        </div>
    )
}