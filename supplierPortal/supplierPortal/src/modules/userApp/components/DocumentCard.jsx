import { useEffect, useState } from "react";
import { BoldTitle } from "./BoldTitle";
import { SwitchOption } from "./SwitchOption";
import './DocumentCard.css'
import { LabelValue } from "./LabelValue";
import { moneyFormat, postInfo } from "../../../utils/functions";
import { UserCard } from "./UserCard";
import { useAppInfo } from "../../../context/context";

export function DocumentCard({data}){

    const [info,setData] = useState(data);
    const {appInfo} = useAppInfo();
    const [visibleInfo,setVisibleInfo] = useState(true);

    const getFullData = async()=>{
        let res = await postInfo('/process/getDocuments',{
            type:info.docType,
            company_id:appInfo.company_id,
            id:info.id
        })
        console.log(`---> ${res}`)
        if(res[0]){
            setData(res[1][0]);
        }
    }

    useEffect(()=>{
        if(data.user_name == undefined){
            getFullData();
        }
    },[])

    return(
        <div className="DocumentCard">
            <div className="headCard">
                <BoldTitle text={`${info.docType}#${info.id}`}/>
                <SwitchOption action={setVisibleInfo} state1={'Información'} state2={'Adjuntos'}/>
            </div>
            <div className="contentCard">
                {!visibleInfo && (
                    <div className="infoCardContainer">
                        {info.docType != 'CI' && (
                            <div className="thirdpartyC">
                                <span className="mainDes">{info.docType == 'OC'? 'Cliente':'Proveedor'}</span>
                                <UserCard name={info.names} desc={info.docType == 'OC'? 'Cliente':'Proveedor'}/>
                            </div>
                        )}
                        {info.docType == 'OC' && (
                            <div className="descOCc">
                                <span className="mainDes">Descripción</span>
                                <strong>{info.description}</strong>
                            </div>
                        )}
                        {info.docType == 'DC' && (
                            <LabelValue title={'Valor'} value={`$ ${moneyFormat(info.value != undefined? info.value:0)}`} />
                        )}
                        <LabelValue title={'Orden de producción'} value={`OP#${info.op_id}`} />
                        <LabelValue title={'Fecha de creación'} value={(info.created_at).substring(0,10)} />
                        <LabelValue title={'Creado por'} value={(info.user_name)} />
                        <LabelValue title={'Tienda'} value={(info.store_id)} />
                        <LabelValue title={'Estado'} value={info.status} />
                    </div>
                )}{visibleInfo && (
                    <div className="attachedCardContainer">
                        Adjuntos
                    </div>
                )}
            </div>
        </div>
    )
}