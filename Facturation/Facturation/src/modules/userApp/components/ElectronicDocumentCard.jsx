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

export function ElectronicDocumentCard({info}){

    const {addNotification} = useNotifications(); 
    const navigate = useNavigate();
    const params = useParams();

    const handleNavigate = ()=>{
        navigate(`${urlSer}/SGA_management/${params.company_key}/${params.user_key}/edocuments/${info.id}`)
    }

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
        console.log(res)
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

    

    const getDocFullInfo = async()=>{
        let res = await postInfo('/electronicFacturationController.getDocumentFullInfo',{
            bill_numer:info.number
        })
    }
    
    return(
        <div className="ElectronicDocumentCard">
            <div className="headCard">
                <TagIndicator type={'indicator'} title={info.type}/>
                <h4 className="serialDocument">{info.number}</h4>
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
                    <ButtonMenu noRotate={true} title={'Previsualizar'} children={<i className="fa-regular fa-eye"/>} onClick={()=>{
                        window.open(`${info.url}`,'_blank','noopener,noreferrer')
                    }}/>
                    <ButtonMenu noRotate={true} title={'Copiar CUFE'} children={<i className="fa-regular fa-copy"/>} onClick={()=>{
                        copyToClipBoard(info.code)
                        addNotification({
                            type:'info',
                            title:'Copiado en el portapapeles',
                            description:`Se copio "${info.code}" en el portapapeles.`
                        })
                    }}/>
                    <ButtonMenu noRotate={true} title={'Descargar PDF'} children={<i className="fa-regular fa-file-pdf"/>} onClick={()=>{
                        downloadPDF()
                    }}/>
                    <ButtonMenu noRotate={true} title={'Descargar XML'} children={<i className="fa-regular fa-file-code"/>} onClick={()=>{
                        downloadXML();
                    }}/>
                    
                </div>
            </div>
        </div>
    )
}