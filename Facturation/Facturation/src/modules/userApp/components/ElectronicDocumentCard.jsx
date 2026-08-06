import { TagIndicator } from "./TagIndicator";
import './ElectronicDocumentCard.css'
import { BoldTitle } from "./BoldTitle";
import { DescriptionSpan } from "./DescriptionSpan";
import { copyToClipBoard, moneyFormat, postInfo } from "../../../utils/functions";
import { ButtonMenu } from "./ButtonMenu";
import { useNotifications } from "../../../context/context";
import { useNavigate, useParams } from "react-router-dom";
import { urlSer } from "../../../App";
import { downloadPdfFromResponse, downloadXmlFromResponse } from "../../../utils/functions";

export function getElectronicDocumentOptions(info, addNotification){
    const downloadPDF = async()=>{
        let res = await postInfo('/electronicFacturation/downloadBill',{
            bill_numer:info.number
        })
        if(res.status == 'OK'){
            let download = await downloadPdfFromResponse(res);
            if(download.status == 'OK'){
                addNotification({
                    type:'aproved',
                    title:`${download.file_name} descargado correctamente.`,
                    description:`El documento "${download.file_name}" fue descargado correctamente.`
                })
            }else{
                addNotification({
                    type:'error',
                    title:`Error al descargar ${info.number}`,
                    description:`No se pudo descargar "${info.number}", intentelo nuevamente`
                })
            }
        }else{
            addNotification({
                type:'error',
                title:`No se pudo descargar ${info.number}`,
                description:res.message
            })
        }
    }

    const downloadXML = async()=>{
        let res = await postInfo('/electronicFacturation/downloadBillXML',{
            bill_numer:info.number
        })
        if(res.status == 'OK'){
            let download = await downloadXmlFromResponse(res);
            if(download.status == 'OK'){
                addNotification({
                    type:'aproved',
                    title:`${download.file_name} descargado correctamente.`,
                    description:`El documento "${download.file_name}" fue descargado correctamente.`
                })
            }else{
                addNotification({
                    type:'error',
                    title:`Error al descargar ${info.number}`,
                    description:`No se pudo descargar "${info.number}", intentelo nuevamente`
                })
            }
        }else{
            addNotification({
                type:'error',
                title:`No se pudo descargar ${info.number}`,
                description:res.message
            })
        }
    }

    return [
        {
            text:'Previsualizar',
            title:'Previsualizar',
            icon:<i className="fa-regular fa-eye"/>,
            action:()=>window.open(`${info.url}`,'_blank','noopener,noreferrer')
        },
        {
            text:'Copiar CUFE',
            title:'Copiar CUFE',
            icon:<i className="fa-regular fa-copy"/>,
            action:()=>{
                copyToClipBoard(info.code)
                addNotification({
                    type:'info',
                    title:'Copiado en el portapapeles',
                    description:`Se copio "${info.code}" en el portapapeles.`
                })
            }
        },
        {
            text:'Descargar PDF',
            title:'Descargar PDF',
            icon:<i className="fa-regular fa-file-pdf"/>,
            action:downloadPDF
        },
        {
            text:'Descargar XML',
            title:'Descargar XML',
            icon:<i className="fa-regular fa-file-code"/>,
            action:downloadXML
        }
    ];
}

export function ElectronicDocumentCard({info}){

    const {addNotification} = useNotifications(); 
    const navigate = useNavigate();
    const params = useParams();

    const handleNavigate = ()=>{ 
         navigate(`/SGA_management/${params.company_key}/${params.user_key}/edocuments/${info.id}`);
    }

    const documentOptions = getElectronicDocumentOptions(info, addNotification);
    
    return(
        <div className="ElectronicDocumentCard">
            <div className="headCard">
                <TagIndicator type={'indicator'} title={info.type}/>
                <h4 className="serialDocument">{info.number}</h4>
                {info.instance_ownSerial != null && (
                    <TagIndicator type={'suspended'} title={`${info.process_code}#${info.instance_ownSerial}`}/>
                )}
                <TagIndicator title={`${info.document_type}#${info.doc_ownSerial}`}/>
                <div className="statusDoc">
                    <TagIndicator type={info.doc_status} title={info.doc_status}/>
                </div>
            </div>
            <div className="body" onClick={()=>{
                handleNavigate();
            }}>
                <div className="customerInfo">
                    <h5 className="typeClient">
                        {info.thirdParty_type ?? '--'}
                        <i className="fa-solid fa-arrow-right"/>
                    </h5>
                    <BoldTitle text={info.thirdParty_names}/>
                </div>
                <span className="decription">
                    Esta es la descripción del doc
                </span>
            </div>
            <div className="options">
                <div className="totalResume">
                    <span>Valor total</span>
                    <BoldTitle text={`$ ${moneyFormat(info.doc_total?? 0)}`}/>
                </div>
                <div className="quickOptions">
                    {documentOptions.map((option)=>(
                        <ButtonMenu
                            key={option.text}
                            noRotate={true}
                            title={option.title}
                            children={option.icon}
                            onClick={option.action}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
