import { useEffect,useState } from "react";
import { postInfo } from "../../../../utils/functions";
import { useAppInfo } from "../../../../context/context";
import { useParams } from "react-router-dom";

export function PreviewDocument({doc_id}){

    const {appInfo} = useAppInfo();
    const params = useParams();

    const [id,setId] = useState(doc_id ?? params.doc_id);

    const [docInfo,setDocInfo] = useState(null);
    const [attachedServices,setAttachedServices] = useState([]);
    const [attachedFiles,setAttachedFiles] = useState([]);

    console.log("%c[PreviewDocument Render]","color:#00bcd4",{
        id,
        company:appInfo.company_id
    });

    // detectar cambios externos
    useEffect(()=>{
        if(doc_id){
            console.log("%cProp doc_id cambió","color:orange",doc_id);
            setId(doc_id);
        }
    },[doc_id]);

    // -------- DOCUMENTO ----------
    const getDocumentInfo = async()=>{
        console.group("📄 REQUEST DOCUMENTO");

        console.log("ID enviado:",id);
        console.log("Company:",appInfo.company_id);

        let res = await postInfo('/getDocuments',{
            company_id:appInfo.company_id,
            id
        });

        console.log("Respuesta cruda:",res);

        if(res?.[0]){
            console.log("Documento obtenido:");
            console.table(res[1]);
            setDocInfo(res[1][0]);
        }else{
            console.warn("No se obtuvo documento");
        }

        console.groupEnd();
    };

    // -------- SERVICIOS ----------
    const getAttachedServices = async(docId)=>{
        let res = await postInfo('/getServiceMovements',{
            company_id:appInfo.company_id,
            doc_id:docId
        });

        console.log("Respuesta servicios RAW:",res);

        if(!res?.[0]){
            console.warn("⚠️ Backend dice que no hay servicios para este documento");
            setAttachedServices([]);
            return;
        }

        console.log("Servicios cargados:",res[1]);
        setAttachedServices(res[1]);
    };

    // -------- ARCHIVOS ----------
    const getAttachedDocs = async(ids)=>{
        console.group("📎 REQUEST ARCHIVOS");

        console.log("IDs enviados:",ids);

        let res = await postInfo('/getAttachedFiles',{
            company_id:appInfo.company_id,
            allowedDocs:ids
        });

        console.log("Respuesta:",res);

        if(res?.[0]){
            console.table(res[1]);
            setAttachedFiles(res[1]);
        }else{
            console.warn("Sin archivos");
        }

        console.groupEnd();
    };

    // cargar documento
    useEffect(()=>{
        if(appInfo.company_id && id){
            console.log("%cEmpresa lista → solicitando documento","color:green");
            getDocumentInfo();
        }
    },[appInfo.company_id,id]);

    // cuando llega docInfo
    useEffect(()=>{
        if(!docInfo) return;

        console.group("📦 DOCUMENTO CARGADO");
        console.log("Objeto documento:",docInfo);

        getAttachedServices(docInfo.id);

        let docsAtt=[];

        try{
            const parsed = JSON.parse(docInfo.attached ?? "[]");

            if(Array.isArray(parsed)){
                docsAtt = parsed;
            }else{
                console.warn("Adjuntos no es array:",parsed);
                docsAtt = [];
            }

        }catch(err){
            console.warn("Error parseando adjuntos:",err);
            docsAtt=[];
        }

        console.log("Adjuntos parseados:",docsAtt);

        if(docsAtt.length){
            getAttachedDocs(docsAtt.map(x=>x.id));
        }else{
            console.warn("No hay adjuntos en documento");
        }

        console.groupEnd();

    },[docInfo]);

    // ver cambios finales
    useEffect(()=>{
        console.group("📊 ESTADO SERVICIOS");
        console.table(attachedServices);
        console.groupEnd();
    },[attachedServices]);

    useEffect(()=>{
        console.group("📁 ESTADO ARCHIVOS");
        console.table(attachedFiles);
        console.groupEnd();
    },[attachedFiles]);

    return null;
}