import { useEffect, useState } from "react";
import { useAppInfo } from "../../../context/context";
import { PathLocation } from "../components/PathLocation";
import { postInfo } from "../../../utils/functions";
import { useParams } from "react-router-dom";
import { BoldTitle } from "../components/BoldTitle";
import { LoadingSpace } from "./LoadingSpace";
import { DescriptionSpan } from "../components/DescriptionSpan";
import './StoreDetail.css'
import { CellarsBody } from "./CellarsBody";

export function StoreDetail(){

    // Requirements
    const [info,setInfo] = useState({});
    const {appInfo} = useAppInfo();
    const params = useParams();
    const [cellars,setCellars] = useState([]);

    // Control
    const [loading,setLoading] = useState(true);
    const [disabled,setDisabled] = useState(false);
    const [actualSection,setActualSection] = useState(0)
    const sections = [
        'Información General',
        'Bodegas y Secciones',
        'Información Comercial',
        'Actividad',
        'Estadisticas',
        'Informes'
    ];

    // Functions
    const getStoreinfo = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/getStores',{
            company_id:appInfo.company_id,
            id:params.store_id
        })
        console.log(res)
        if(res[0]){
            setInfo(res[1][0])
        }
        setLoading(false);
        setDisabled(false);
    }

    const getCellars = async()=>{
        let res = await postInfo('/getCellars',{
            company_id:appInfo.company_id,
            store_id:info.id
        })
        if(res[0]){
            setCellars(res[1])
        }
    }

    useEffect(()=>{
        if(info.id != undefined){
            getCellars();
        }
    },[info])

    useEffect(()=>{
        getStoreinfo();
    },[])

    if(!loading){
        return(
            <div className="StoreDetail">
                <PathLocation/>
                <BoldTitle text={info.name}/>
                <DescriptionSpan text={`Administra y ajusta la infomación de ${info.name}`}/>
                <div className="CarrouselOptions">
                    {sections.map((element,index)=>(
                        <h4 className={index== actualSection? 'activeSec':''} onClick={()=>{
                            setActualSection(index)
                        }} key={index}>{element}</h4>
                    ))}
                    <div className="CarrouselIndicator" style={{
                        left:`${actualSection * 14}vw`
                    }}/>
                </div>
                <div className="contentStoreDetail">
                    {!loading && actualSection == 1 && (
                        <CellarsBody cellars={cellars} reloadFun={getCellars} storeInfo={info}/>
                    )}
                    {loading && (
                        <LoadingSpace title={`Cargando información de ${info.name}`} description={'Esto no debe tardar mucho...'}/>
                    )}
                </div>
            </div>
        )
    }else{
        return(
            <LoadingSpace title={'Cargando información de la unidad de negoció'} description={'Esto no debe tardar mucho...'}/>
        )
    }
}