import { postInfo } from "../../../utils/functions";
import { useAlert, useAppInfo, useNotifications } from "../../../context/context";
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { CardNewDocument } from "../components/CardNewDocument";
import './CreateDocument.css'
import { OpCard } from "../components/OpCard";
import { useEffect, useState } from "react";
import { FormNewOc } from "./forms/FormNewOc";
import { FormNewDC } from "./forms/FormNewDC";
import { FormNewFV } from "./forms/FormNewFV";
import { FormNewDocument } from "./forms/FormNewDocument";

export function CreateDocument(){

    const {appInfo,userInfo} = useAppInfo();
    const {addNotification} = useNotifications();
    const {popInAlert} = useAlert();
    const [lastOp,setLastOp] = useState({});

    const createOp = async()=>{
        let res = await postInfo('/process/createOP',{company_id:appInfo.company_id,store_id:1,user_id:userInfo.user_id})
        if(res){
            addNotification({
                title:`OP#${res} creada`,
                description:`Se ha iniciado la nueva orden de producción "OP${res}" exitosamente.`,
                type:'aproved'
            })
        }else{
            addNotification({
                title:`Error al crear OP`,
                description:`No se pudo crear la nueva orden de producción intentelo de nuevo.`,
                type:'error'
            })
        }
    }

    const loadLastOp = async()=>{
        let res = await postInfo('/process/getOp',{company_id:appInfo.company_id});
        if(res[0]){
            setLastOp(res[1][0]);
        }else{
            alert('No se pudo cargar la ultima OP')
        }
    }

    useEffect(()=>{
        loadLastOp();
    },[])

    return(
        <div className="CreateDocument appSection">
            <div className="headCreateDoc">
                <BoldTitle text={'Crear nuevo documento'}/>
                <DescriptionSpan text={'Crea, modifíca y elimina si es necesario documentos de tus ordenes de producción.'}/>
            </div>
            <div className="bodyNewDoc">
                <div className="gridOptionsDocuments">
                    <CardNewDocument onCLick={()=>{createOp()}} title={'Orden de produccón'} description={'Crea una nueva orden de producción para tu empresa.'}/>
                    <CardNewDocument onCLick={()=>{
                        popInAlert(<FormNewOc info={{}} reloadFun={loadLastOp} />)
                    }} title={'Orden de cliente'} description={'Crea una nueva orden de producción para tu empresa.'}/>
                    <CardNewDocument onCLick={()=>{
                        popInAlert(<FormNewDC info={{}} reloadFun={loadLastOp}/>)
                    }}  title={'Documento de compra'} description={'Crea una nueva orden de producción para tu empresa.'}/>
                    <CardNewDocument onCLick={()=>{
                        popInAlert(<FormNewFV info={{}} reloadFun={loadLastOp}/>)
                    }} title={'Factura de venta'} description={'Crea una nueva orden de producción para tu empresa.'}/>
                    <CardNewDocument onCLick={()=>{
                        popInAlert(<FormNewDocument type={'consuption'} info={{}} reloadFun={loadLastOp}/>)
                    }} title={'Consumo de inventario'} description={'Crea una nueva orden de producción para tu empresa.'}/>
                </div>
                <div className="lastOpContainer">
                    <h5>Ultima orden de producción</h5>
                    {lastOp.op_id != undefined && (
                        <OpCard data={lastOp} />
                    )}
                </div>
            </div>
        </div>
    )
}