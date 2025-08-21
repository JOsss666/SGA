import { NormalCard } from "../componets/NormalCard";
import { SectionTitle } from "../componets/SectionTitle";
import { SubSectionTitle } from "../componets/SubSectionTitle";
import {SearchBar} from '../componets/SearchBar'
import {SelectOptions} from '../componets/SelectOptions'
import {BoldButton} from '../componets/BoldButton'
import { StoreCard } from "../componets/StoreCard";
import {useAlert} from "../../../context/context"
import { CreateStore } from "./forms/CreateStore";
import { useAppinfo } from "../../../context/context";

import "./Stores.css"
import { useEffect, useState } from "react";
import { postInfo } from "../../../utils/functions";
import { PreviewStore } from "./alerts/PreviewStore";


export function Stores(){

    const {appInfo} = useAppinfo();
    const [stores,setStores] = useState([]);
    const {setOpenAlert,popInAlert} = useAlert();


    const getStores = async()=>{
        let res = await postInfo('/getStores',appInfo.company_id);
        if(res[0]){
            setStores(res[1]);
        }
        console.log(res);
    }

    useEffect(()=>{
        if(appInfo.company_id != undefined){
            getStores();
        }
    },[appInfo.company_id])

    return(
        <div className="Stores appSection">
            <SectionTitle text={"Tiendas"}/>
            <div className="bodyStores">
                <div className="optionsStores">
                    <NormalCard title={'Crear Tienda'} description={"Crea una nueva unidad de negocio"} onClick={()=>{
                        popInAlert(<CreateStore reloadFun={getStores}/>);
                        setOpenAlert(true);
                    }}/>
                    <NormalCard title={'Editar Tienda'} description={"Crea una nueva unidad de negocio"}/>
                    <NormalCard title={'Eliminar Tienda'} description={"Crea una nueva unidad de negocio"}/>
                    <NormalCard title={'Ver todas'} description={"Crea una nueva unidad de negocio"}/>
                    <NormalCard title={'Crear Bodega'} description={"Crea una nueva unidad de negocio"}/>
                </div>
                <div className="mapStores">
                    <SubSectionTitle text={"Mapa de tiendas y bodegas"}/>
                    <div className="mapContainer">
                        <div className="menuMap">
                            <SearchBar placeholder={"Buscar tienda o bodega"}/>
                            <SelectOptions options={["Todas","Tiendas","Bodegas"]}/>
                            <div className="subMenuMap">
                                <BoldButton title={"Refrescar mapa"} children={<i className="fa-solid fa-rotate-right"/>}/>
                                <BoldButton title={"Reestablecer escala"} children={<i className="fa-solid fa-magnifying-glass"/>}/>
                                <BoldButton title={"Opciones mapa"} children={<i class="fa-solid fa-ellipsis-vertical"/>}/>
                            </div>
                        </div>
                    </div>
                    {stores.length > 0 && (
                        <div className="stores">
                            {stores.map((element,index)=>(
                                <StoreCard info={element} key={index} onClick={()=>{
                                    popInAlert(<PreviewStore info={element}/>)
                                    setOpenAlert(true)
                                }} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}