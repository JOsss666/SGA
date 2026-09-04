import { useEffect, useState } from 'react'
import { BoldTitle } from '../components/BoldTitle'
import { DescriptionSpan } from '../components/DescriptionSpan'
import { FormButton } from '../components/FormButton'
import { SearchBar } from '../components/SearchBar'
import { SelectOptions } from '../components/SelectOptions'
import './Users.css'
import { RowTableUsers } from '../components/RowTableUsers'
import { LoadingSpace } from './LoadingSpace'
import { postInfo } from '../../../utils/functions'
import { useAlert, useAppInfo } from '../../../context/context'
import { CheckSquare } from '../components/CheckSquare'
import { FormNewUser } from './forms/FormNewUser'
import { NoResults } from './NoResults'

export function Users(){
    const {popInAlert} = useAlert();
    const [users,setUsers] = useState([]);
    const [loading,setLoading]= useState(false);
    const {appInfo, userConfig} = useAppInfo();

    const getUsers = async()=>{
        setLoading(true)
        let res = await 
        postInfo('/getUsers',{
            company_id:appInfo.company_id,
            status:'active'
        });
        console.log(res)
        if(res[0]){
            setUsers(res[1])
        }
        setLoading(false)
    }

    useEffect(()=>{
        getUsers();
    },[])

    console.log(userConfig.access.sections.users.can_create)

    return(
        <div className="Users">
            <div className="headUsers">
                <BoldTitle text={'Usuarios'}/>
                <DescriptionSpan text={'Adminstra los miembros de tu quipo y sus roles'}/>
            </div>
            <div className="menuUsers">
                <h6 className='resultsTotal'>Todos los usuarios: <span className='nRes'>{users.length}</span></h6>
                <div className="optionsMenuUsers">
                    <SearchBar placeholder={'Buscar'}/>
                    <SelectOptions title={'Filtro'} options={['ninguno']}/>
                    <SelectOptions title={'Orden'} options={['Alfabetico','Fecha de Creación','Rol']}/>
                    {userConfig.access.sections.users.can_create && (
                        <FormButton onClick={()=>{
                            popInAlert(<FormNewUser reloadFun={getUsers}/>)
                        }} text={'Crear usuario'} children={<i className="fa-solid fa-plus"/>}/>
                    )}
                </div>
            </div>
            <div className="tableUsers">
                <div className="headTableUsers">
                    <CheckSquare/>
                    <span className='headTableTitle idContianer'>ID</span>
                    <span className='headTableTitle userCardContainer'>Usuario <i className="fa-solid fa-arrow-up-z-a"/></span>
                    <span className='headTableTitle'>Cargo <i className="fa-solid fa-arrow-up-z-a"/></span>
                    <span className='headTableTitle userCardContainer'>Llave</span>
                    <span className='headTableTitle'>Tienda</span>
                    <span className='headTableTitle'>Fecha Creación <i className="fa-solid fa-arrow-down-short-wide"/></span>
                    <span className='headTableTitle'>Ultima edición <i className="fa-solid fa-arrow-down-short-wide"/></span>
                    <span className='headTableTitle'>Opciones</span>
                </div>
                {!loading && (
                    <div className="bodyTableUsers">
                        {users.length > 0 && users.map((element,index)=>(
                            <RowTableUsers reloadFun={getUsers} info={element} key={index} onClick={()=>{
                                //handlenavigate(element.user_id)
                            }}/>
                        ))}
                        {users.length == 0 && (
                            <NoResults title={'No hay usuarios disponibles'} newOption={'Crear nuevo usuario'}>
                                <FormNewUser/>
                            </NoResults>
                        )}
                    </div>
                )}
                {loading && (
                    <LoadingSpace title={'Cargando Usuarios'} description={'Esto no debe tardar mucho ...'}/>
                )}
            </div>
        </div>
    )
}