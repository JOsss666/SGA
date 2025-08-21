import { ActionButton } from "../componets/actionButton";
import { ChartIndicator } from "../componets/ChartIndicator";
import { FormButton } from "../componets/FormButton";
import { MovementCard } from "../componets/MovementCard";
import { NormalCard } from "../componets/NormalCard";
import { SectionTitle } from "../componets/SectionTitle";
import { SubSectionTitle } from "../componets/SubSectionTitle";
import { useAlert } from "../../../context/context";
import './MovementsInventory.css'
import { FormNewEntry } from "./forms/FormNewEntry";
import { FormNewDeparture } from "./forms/FormNewDeparture";
import { FormNewDocument } from "./forms/FormNewDocument";
import { postInfo } from "../../../utils/functions";
import { useAppinfo } from "../../../context/context";
import { useEffect, useState } from "react";
import { WarningForm } from "../componets/WarningForm";
import { useLocation, useNavigate } from "react-router-dom";


export function MovementsInventory(){

    const navigate = useNavigate();
    const location = useLocation()
    const {appInfo} = useAppinfo();
    const {popInAlert,setOpenAlert} = useAlert();
    const [movements,setMovements] = useState([]);

    const getMovements = async()=>{
        let res = await postInfo('/getMovements',{company_id:appInfo.company_id,limit:10})
        console.log(res);
        if(res[0]){
            setMovements(res[1]);
        }
    }

    const handleNavigate = (path)=>{
        console.log(location)
        navigate(location.pathname + path)
    }

    useEffect(()=>{
        getMovements();
    },[])
    
    return(
        <div className="MovementsInventory appSection">
            <SectionTitle text={"Movimientos Inventario"}/>
            <fiv className="contentMovements">
                <div className="optionsMovements">
                    <NormalCard onClick={()=>{
                        popInAlert(<FormNewDocument type={'entry'}/>)
                        setOpenAlert(true);
                    }} title={"Nueva entrada"} description={"Crear nueva entrada de bodega"}/>
                    <NormalCard onClick={()=>{
                        popInAlert(<FormNewDocument type={'consuption'}/>)
                        setOpenAlert(true);
                    }} title={"Nuevo consumo"} description={"Crear nueva salidad de bodega"}/>
                    <NormalCard onClick={()=>{
                        popInAlert(<FormNewDocument type={'sell'}/>)
                        setOpenAlert(true);
                    }}  title={"Nueva Venta"} description={"Crear nueva venta de inventario"}/>
                    <NormalCard onClick={()=>{
                        popInAlert(<FormNewDocument type={'transfer'}/>)
                        setOpenAlert(true);
                    }} title={"Traslados"} description={"Crear nuevo traslado de productos"}/>
                    <NormalCard onClick={()=>{
                        popInAlert(<FormNewDocument type={'transfer'}/>)
                        setOpenAlert(true);
                    }} title={"Editar operación"} description={"Modificar operaciones de inventario"}/>
                </div>
                <div className="historyMovements">
                    <SubSectionTitle text={'Historial Movimientos'}/>
                    <div className="movementsContainer">
                        {movements.length > 0 && movements.map((element,index)=>(
                            <MovementCard info={element} key={index}/>
                        ))}
                        {movements.length == 0 && (
                            <WarningForm tittle={"Sin movimientos"} desc={"Una vez realizes movimientos en tu inventario apareceran en esta sección"}/>
                        )}
                    </div>
                    <FormButton onClick={()=>{
                        handleNavigate('/record');
                    }} text={"Ver todos los movimientos"}/>
                </div>
                <div className="analyticsMovements">
                    <SubSectionTitle text={'Estadisticas Movimientos'}/>
                    <ChartIndicator title={"Entradas"}/>
                    <ChartIndicator title={"Salidas"}/>
                </div>
            </fiv>
        </div>
    )
}