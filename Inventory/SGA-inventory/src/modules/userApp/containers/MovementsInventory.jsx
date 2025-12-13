import { useAlert } from "../../../context/context";
import './MovementsInventory.css'
import { postInfo } from "../../../utils/functions";
import { useAppInfo } from "../../../context/context";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";


export function MovementsInventory(){

    const navigate = useNavigate();
    const location = useLocation()
    const {appInfo} = useAppInfo();
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
        //getMovements();
    },[])
    
    return(
        <div className="MovementsInventory appSection">
            <BoldTitle text={'Movimientos'}/>
            <DescriptionSpan text={'Esta es la descripción de la categoría actual '}/>
            <div className="AnalyticsIndicators">
                div.
            </div>
        </div>
    )
}