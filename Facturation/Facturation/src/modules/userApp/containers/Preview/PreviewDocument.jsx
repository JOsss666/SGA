import { useEffect,useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import './PreviewDocument.css'
import { postInfo } from "../../../../utils/functions";
import { useAppInfo } from "../../../../context/context";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { UserCard } from "../../components/UserCard";
import { MoreOptions } from "../../components/MoreOptions";
import { useParams } from "react-router-dom";
import { LoadingAppDataPage } from "../LoadingAppDataPage";

export function PreviewDocument({doc_id}){

    // Requirements
    const {appInfo} = useAppInfo();
    const [docInfo,setDocInfo] = useState({})
    const [attachedServices,setAttacedServices] = useState([]);
    const [attachedFiles,setAttachedFiles] = useState([]);
    const params = useParams();
    const [id,setId] = useState(doc_id? doc_id:params.doc_id);

    // Control
    const [loading,setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    );

    const formatBytes = (bytes, decimales = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimales < 0 ? 0 : decimales;
        const tamaños = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        // Calculamos el índice del tamaño (0 para bytes, 1 para KB, etc.)
        // Usamos logaritmos para saber a qué potencia de 1024 pertenece el número
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + tamaños[i];
    };

    const iconDocsContainer = {
        "image/jpeg": <i className="fa-solid fa-file-image fileIcon"/>,
        "image/png": <i className="fa-solid fa-file-image fileIcon"/>,
        "image/gif": <i className="fa-solid fa-file-image fileIcon"/>,
        "image/webp": <i className="fa-solid fa-file-image fileIcon"/>,
        "image/svg+xml": <i className="fa-solid fa-file-image fileIcon"/>,
        "application/pdf": <i className="fa-solid fa-file-pdf fileIcon"/>,
        "application/msword": <i className="fa-regular fa-file-word fileIcon"/>,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": <i className="fa-regular fa-file-excel fileIcon"/>,
        "application/vnd.ms-excel": <i className="fa-regular fa-file-excel fileIcon"/>,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": <i className="fa-regular fa-file-excel fileIcon"/>,
        "application/vnd.ms-powerpoint": <i className="fa-solid fa-file-powerpoint fileIcon"/>,
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": <i className="fa-solid fa-file-powerpoint fileIcon"/>,
        "text/plain": <i className="fa-solid fa-file-lines fileIcon"/>,
        "text/csv": <i className="fa-solid fa-file-image fileIcon"/>,
        "application/zip": <i className="fa-solid fa-file-zipper fileIcon"/>,
        "application/x-rar-compressed": <i className="fa-solid fa-file-zipper fileIcon"/>,
        "application/x-7z-compressed": <i className="fa-solid fa-file-zipper fileIcon"/>,
        "video/mp4": <i className="fa-solid fa-photo-film fileIcon"/>,
        "video/mpeg": <i className="fa-solid fa-photo-film fileIcon"/>,
        "video/quicktime": <i className="fa-solid fa-photo-film fileIcon"/>,
        "audio/mpeg":<i className="fa-solid fa-file-audio fileIcon"/>,
        "audio/wav": <i className="fa-solid fa-file-audio fileIcon"/>,
        "application/json": <i className="fa-solid fa-code fileIcon"/>
    };

    // Functions
    const getDocumentInfo = async()=>{
        setLoading(true)
        let res = await postInfo('/getDocuments',{
            company_id:appInfo.company_id,
            id:id
        });
        if(res[0]){
            setDocInfo(res[1][0])
        }
        setLoading(false);
    }

    const getAttachedDodcs = async(attArray)=>{
        let res = await postInfo('/getAttachedFiles',{
            company_id:appInfo.company_id,
            allowedDocs:attArray
        })
        console.log(res);
        if(res[0]){
            setAttachedFiles(res[1]);
        }
    }

    const getAttachedServices = async()=>{
        let res = await postInfo('/getServiceMovements',{
            company_id:appInfo.company_id,
            doc_id:docInfo.id
        })
        if(res[0]){
            setAttacedServices(res[1])
        }
    }
/*
    useEffect(() => {
        const root = document.documentElement; // <html>
        if (darkMode) root.classList.add('dark');
        else root.classList.remove('dark');
    }, [darkMode]);
*/

    useEffect(()=>{
        if(appInfo.company_id != undefined){
            getDocumentInfo();
        }
    },[appInfo])

    useEffect(()=>{
        console.log(docInfo)
        if(docInfo.id != undefined){
            getAttachedServices();
            let attArray = []
            let docsAtt = JSON.parse(typeof(JSON.parse(docInfo.attached)) == "object"? docInfo.attached:"[]");
            console.log(docsAtt)
            if(docsAtt != undefined && docsAtt.length > 0){
                docsAtt.forEach(element => {
                    attArray.push(element.id);
                });
                getAttachedDodcs(attArray)
            }
        }
    },[docInfo])

    return(
        <div className="PreviewDocument">
            {!loading && (
                <>
                    <div className="titleDocContainer">
                        <i className="fa-regular fa-file-lines"/>
                        <BoldTitle text={`${docInfo.document_type} #${docInfo.ownSerial}`}/>
                    </div>
                    <div className="thirdPartyAndCompanyInfo">
                        <UserCard name={'Nombre del tercero'} desc={'Cliente'} imgSrc={'https://i.pinimg.com/736x/55/62/fb/5562fb835d1de1ea974bdf0039726208.jpg'}/>
                    </div>
                    <DescriptionSpan text={`Descripción: ${docInfo.description}`}/>
                    {docInfo.document_type == 'Client Order' && (
                        <div className="detailsDocument">
                            {attachedServices.length > 0 && attachedServices.map((element,index)=>(
                                <div className="serviceDescriptionCard" key={index}>
                                    <UserCard imgSrc={element.service_img} name={element.service_name} desc={element.service_type}/>
                                    <div className="jobDesc">
                                        <span>Unidades</span>
                                        <strong>{element.units}</strong>
                                    </div>
                                    <div className="jobDesc">
                                        <span>Descripción</span>
                                        <strong>{element.description}</strong>
                                    </div>
                                    <div className="jobDesc">
                                        <span>Fecha</span>
                                        <strong>{(element.created_at).substring(0,10)}</strong>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="attachedDocuments"> 
                        <h6>Archivos adjuntos</h6>
                        <div className="attachedDocumentsGrid">
                            {attachedFiles.map((element,index)=>(
                                <div className="attDocCard" key={index}>
                                    {iconDocsContainer[`${element.type}`]}
                                    <strong className="fileName">{element.name}</strong>
                                    <span>{element.type}</span>
                                    <span>{formatBytes(element.size)}</span>
                                    <span>{(element.created_at).substring(0,10)}</span>
                                    <MoreOptions options={[
                                        {text:'Descargar',icon:<i className="fa-solid fa-download"/>},
                                        {text:'Previsualizar',icon:<i className="fa-regular fa-eye"/>},
                                        {text:'Reportar',icon:<i className="fa-regular fa-flag"/>},
                                        {text:'Eliminar',icon:<i className="fa-solid fa-trash-can"/>}
                                    ]}/>
                                </div>
                            ))}
                            {attachedFiles.length == 0 && (
                                <div className="noResults">
                                    <strong>
                                        <i className="fa-solid fa-ghost"/>
                                        No hay documentos adjuntos
                                    </strong>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
            {loading && (
                <LoadingAppDataPage/>
            )}
        </div>
    )
}