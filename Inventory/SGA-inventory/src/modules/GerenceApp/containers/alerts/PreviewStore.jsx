
import { BoldTitle } from '../../componets/BoldTitle'
import { NewElementSelect } from '../../componets/NewElementSelect'
import { TitleValue } from '../../componets/TitleValue'
import { useAlert } from '../../../../context/context'
import {UserCard} from '../../componets/UserCard'
import './PreviewStore.css'
import { FormNewCellar } from '../forms/FormNewCellar'
import { useEffect, useState } from 'react'
import { postInfo } from '../../../../utils/functions'
import { PreviewCellar } from './PreviewCellar'

export function PreviewStore({info}){
    const {popInAlert,setOpenAlert} = useAlert();
    const [cellars,setCellars] = useState([])

    const getCellars = async()=>{
        let res = await postInfo('/getCellars',{
            company_id:info.company_id,
            store_id:info.store_id
        });
        if(res[0]){
            setCellars(res[1]);
        }
    }

    useEffect(()=>{
        getCellars();
    },[])

    return(
        <div className="PreviewStore">
            <div className="storeImgContainer">
                <img src="" alt="" />
                <div className="storeImgCaption">
                    <BoldTitle text={info.store_name}/>
                    <span className='directionStore'>{info.store_location}</span>
                </div>
            </div>
            <div className="AditionalStoreInfo">
                <strong className='zoneStore'>{info.store_zone}, {info.store_city}</strong>
                <TitleValue title={"Bodegas"} children={
                    <div className='cellarsContainer'>
                        <NewElementSelect title={"Crear nueva bodega"} onClick={()=>{
                            popInAlert(<FormNewCellar storeId={info.store_id} store_name={info.store_name}/>)
                            setOpenAlert(true);
                        }}  />
                        {cellars.length > 0 && cellars.map((element,index)=>(
                            <UserCard onClick={()=>{
                                popInAlert(<PreviewCellar info={element}/>)
                                setOpenAlert(true);
                            }} key={index} name={element.cellar_name} roll={element.cellar_location} icon={<i className="fa-solid fa-boxes-packing"/>}/>
                        ))}
                    </div>
                }/>
                <TitleValue title={"Personal"} children={
                    <div className='usersStoreContainer'>
                        <NewElementSelect title={"Crear nuevo usuario"}/>
                        <UserCard name={"Usuario"} roll={"Cargo usuario"}/>
                        <UserCard name={"Usuario"} roll={"Cargo usuario"}/>
                    </div>
                }/>
            </div>
        </div>
    )
}