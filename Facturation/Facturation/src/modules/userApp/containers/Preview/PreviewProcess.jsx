import { useEffect, useState, useRef } from "react"
import { useAppInfo } from "../../../../context/context"
import { BoldTitle } from "../../components/BoldTitle"
import { DescriptionSpan } from "../../components/DescriptionSpan"
import { MoreOptions } from "../../components/MoreOptions"
import './PreviewProcess.css'
import { postInfo } from "../../../../utils/functions"
import { useParams } from "react-router-dom"
import { LoadingAppDataPage } from "../LoadingAppDataPage"

export function PreviewProcess({id}){

    //requirements
    const {appInfo,darkMode,setDarkMode} = useAppInfo();
    const params = useParams();
    const instance_id = id? id:params.instance_id;
    const [info,setInfo] = useState({});
    const [docInfo,setDocInfo] = useState({});
    const [processInfo,setProcessInfo] = useState({});
    const [attachedDocuments,setAttachedDocuments] = useState([]);

    // control
    const [loading,setLoading] = useState(true);
    const [loadingDocuments,setLoadingDocuments] = useState(false);
    const [disabled,setDisabled] = useState(true);
    const sheetRef = useRef(null);
    const [sheetY, setSheetY] = useState(60); // % visible (60% inicial)
    const startY = useRef(0);


    // Ordenar los pasos de cada secuencia
    const currentStepData = processInfo.steps?.find(s => s.id == processInfo.step_id);
    const currentOrder = currentStepData ? currentStepData.order : 0;
    const sortedSteps = [...(processInfo.steps || [])].sort((a, b) => a.order - b.order);
    const progressPercentage = ((currentOrder+ .5) / (sortedSteps.length)) * 100;
   // Getters of info

   const getProcessState = async()=>{
        let res  = await postInfo('/process/getProcessState',{
            company_id:appInfo.company_id,
            id:instance_id
        });
        if(res[0]){
            setProcessInfo(res[1][0])
        }
    }
const getElectronicInvoices = async(docsArray) => {

    const invoiceRes = await postInfo('/getDocuments',{
        company_id: appInfo.company_id,
        instance_id: instance_id,
        allowedTypes:['Sell Invoice']
    });

    if(!invoiceRes[0] || !invoiceRes[1]?.length){
        setAttachedDocuments(docsArray);
        return;
    }

    const sellInvoice = invoiceRes[1][0];

    const electronicRes = await postInfo(
        '/electronicFacturation/getDocuments',
        {
            company_id: appInfo.company_id,
            doc_id: sellInvoice.id
        }
    );

    if(!electronicRes[0] || !electronicRes[1]?.length){
        setAttachedDocuments(docsArray);
        return;
    }

    const invoice = electronicRes[1][0];

    console.log("URL FACTURA:", invoice.url);

    setAttachedDocuments([
        ...docsArray,
        {
            id: invoice.id,
            document_type: 'Factura de venta electrónica',
            ownSerial: invoice.number,
            created_at: invoice.created_at,
            electronicData: invoice
        }
    ]);
};
    const getAttachedDocuments = async()=>{
        setDisabled(true)
        setLoadingDocuments(true)
        let res = await postInfo('/getDocuments',{
            company_id:appInfo.company_id,
            allowedTypes:['Cash Recipt','Client Order'],
            instance_id:instance_id
        })
        console.log(res)
        if(res[0]){
            await getElectronicInvoices(res[1])
        }else(
            setAttachedDocuments([])
        )
        setDisabled(false)
        setLoadingDocuments(false)
    }
    const getInstanceInfo = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/process/getProcessInstances',{
            company_id:appInfo.company_id,
            id:instance_id
        })
        console.log(res);
        if(res[0]){
            setInfo(res[1][0])
           await getProcessState();
        }
        setLoading(false);
        setDisabled(false);
    }

    useEffect(()=>{
        if(appInfo.company_id != undefined){
            getInstanceInfo();
            getAttachedDocuments();
        }
    },[appInfo])

    useEffect(()=>{
        setDarkMode(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    },[])

    // Utils functions

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

    const onStart = (e) => {
        startY.current = e.touches ? e.touches[0].clientY : e.clientY;
    };

    const onMove = (e) => {
        const currentY = e.touches ? e.touches[0].clientY : e.clientY;
        const diff = startY.current - currentY;
        const vh = window.innerHeight;
        let newPercent = sheetY + (diff / vh) * 100;

        newPercent = Math.max(10, Math.min(90, newPercent));
        setSheetY(newPercent);
    };

    const onEnd = () => {
        if (sheetY < 30) setSheetY(10);      // colapsado
        else if (sheetY > 70) setSheetY(90); // expandido
    };

    const hideAttD = ()=>{
        setSheetY(10);
    }

    const handleShare = async (info) => {
        // 1. Verificamos si el navegador soporta la API
        if (navigator.share) {
        try {
            await navigator.share({
            title: info.title, // Título del contenido
            text: info.description,   // Descripción breve
            url: info.link      // El link que quieres compartir
            });
        } catch (error) {
            console.log("Error al compartir:", error);
        }
        } else {
        // 2. Fallback: Si el navegador no lo soporta (ej. navegadores viejos o sin HTTPS)
        alert("Tu navegador no soporta la función de compartir. Copia el link: " + url);
        // Aquí podrías abrir un modal propio o copiar al portapapeles
        }
    };

    return(
        <div className="PreviewProcess">
            {!loading && (
                <>
                <div className="optionsProcessPreview">
                    <button className="btnHead">
                        <i className="fa-solid fa-xmark"/>
                    </button>
                    <button className="btnHead">
                        <span>Ayuda</span>
                    </button>
                </div>
                <div className="headProcessPreview">
                    <BoldTitle text={`${processInfo.process_name} #${processInfo.ownSerial}`}/>
                    <DescriptionSpan text={'Entrega estimada:'}/>
                    <h5>{(info.delivery_date).substring(0,10)}</h5>
                </div>
                <div className="ProcesSteps">
                    <div className="lineProgress">
                        <div className="progressIndicador" style={{
                            height:`${progressPercentage}%`
                        }}/>
                    </div>
                    {sortedSteps.map((element,index)=>(
                        <div className={`processStep ${element.id == processInfo.step_id ? 'actualStep':''} ${element.order < currentOrder ? 'checkedStep':''}`} key={index}>
                            <div className="bubbleStep">
                                <i className="fa-solid fa-box-open"/>
                            </div>
                            <h6>{element.name}</h6>
                        </div>
                    ))}
                </div>
                <div 
                    className="processAttached"
                    ref={sheetRef}
                    style={{
                        transform: `translateY(${100 - sheetY}%)`
                    }}
                    onMouseDown={onStart}
                    onMouseMove={onMove}
                    onMouseUp={onEnd}
                    onTouchStart={onStart}
                    onTouchMove={onMove}
                    onTouchEnd={onEnd}
                    onMouseLeave={hideAttD}
                    >
                    <div className="sizeAdjust"/>
                    <div className="headPAtt">
                        <div className="iconC">
                            <i className="fa-solid fa-paperclip"/>
                        </div>
                        <h5>Documentos Adjuntos</h5>
                    </div>
                    <div className="gridAttDocs">
    {attachedDocuments.map((element, index) => (
        <div className={`attDocCard ${element.electronicData ? 'electronicCard' : ''}`} key={index} 
            onClick={() => {
                if (element.electronicData) {
                    window.open(element.electronicData.url, '_blank')
                    return;
                }
                window.open(`https://facturation.sga360.co/documentPreview/${appInfo.company_key}/${element.id}`, '_blank')
            }}>
            
            {element.electronicData 
                ? <i className="fa-solid fa-file-invoice fileIcon"/>
                : <i className="fa-solid fa-file-image fileIcon"/>
            }
            
            <div className="cardDocInfo">
                <strong className="fileName">
                    {`${element.document_type} #${element.ownSerial}`}
                </strong>
                <span>{(element.created_at).substring(0, 10)}</span>
            </div>

            {element.electronicData && (
                <div className="electronicBadge">
                    <i className="fa-solid fa-bolt"/>
                    <span>Electrónica</span>
                </div>
            )}
        </div>
    ))}
</div>
                    <button className="shareProcess" onClick={()=>{
                        handleShare({
                            title:`${processInfo.process_name}#${processInfo.ownSerial}`,
                            description:`Consulta el estado de tu orden de trabajo en ${appInfo.company_name}`,
                            link:`https://facturation.sga360.co/preview/Process/${params.company_key}/${processInfo.id}`
                        })
                    }}>
                        <i className="fa-solid fa-arrow-up-from-bracket"/>
                        Compartir
                    </button>
                </div>
            </>
            )}
            {loading && (
                <LoadingAppDataPage title={'Cargando información'}/>
            )}
        </div>
    )
}