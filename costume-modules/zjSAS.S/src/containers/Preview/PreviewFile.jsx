import { useEffect, useState } from 'react';
import { postInfo } from '../../../utils/functions';
import './PreviewFile.css'
import { LoadingSpace } from '../LoadingSpace';
import { ButtonMenu } from '../../components/ButtonMenu';
import { MoreOptions } from '../../components/MoreOptions';

export function PreviewFile({id,useAlert,appInfo}){

    // Requirements
    console.log(id)
    const {popOutAlert} = useAlert();

    // Control
    const [info,setInfo] = useState([]);
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);

    // utils

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
    
    const getFileInfo = async(attArray)=>{
        console.log('Obtenido archivo')
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/getAttachedFiles',{
            company_id:appInfo.company_id,
            allowedDocs:attArray,
            id:id
        })
        console.log(res);
        if(res[0]){
            setInfo(res[1][0]);
        }
        setLoading(false);
        setDisabled(false);
    }

    const renderContent = () => {
        if (!info?.url) return <div className="no-file">No se pudo cargar el recurso</div>;

        const type = info.type;

        // Si es imagen, usamos <img> para mejor escalado
        if (type?.includes('image')) {
            return (
                <div className="img-container">
                    <img src={info.url} alt={info.name} className="img-preview" />
                </div>
            );
        }

        // Si es PDF, usamos iframe
        if (type === 'application/pdf') {
            return (
                <iframe
                    src={`${info.url}#toolbar=0`}
                    title={info.name}
                    frameBorder="0"
                    width="100%"
                    height="100%"
                />
            );
        }

        // Fallback para otros archivos
        return (
            <div className="unsupported-file">
                <i className="fa-solid fa-file-circle-exclamation fa-3x"></i>
                <p>La previsualización no está disponible para este tipo de archivo.</p>
                <a href={info.url} target="_blank" rel="noreferrer" className="btn-download-alt">
                    Abrir en nueva pestaña
                </a>
            </div>
        );
    };

    // Events triggers

    useEffect(()=>{
        getFileInfo([id]);
    },[])

    useEffect(()=>{
        console.log(info);
    },[info])


    return(
        <div className="PreviewFile">
            {!loading && (
                <>
                    <div className="headPreview">
                        <div className="nameIconContainer">
                            {iconDocsContainer[`${info.type}`]}
                            <strong>{info.name}</strong>
                        </div>
                        <div className="optionsDoc">
                            <ButtonMenu title={'Descargar'} children={<i className="fa-solid fa-cloud-arrow-down"/>} noRotate={true} />
                            <ButtonMenu title={'Imprimir'} children={<i className="fa-solid fa-print"/>} noRotate={true} />
                            <ButtonMenu title={'Compartir'} children={<i className="fa-solid fa-arrow-up-from-bracket"/>} noRotate={true}/>
                            <div className="moreOptC">
                                <MoreOptions options={[
                                    {text:'Descargar',icon:<i className="fa-solid fa-cloud-arrow-down"/>},
                                    {text:'Imprimir',icon:<i className="fa-solid fa-print"/>},
                                    {text:'Compartir',icon:<i className="fa-solid fa-arrow-up-from-bracket"/>}
                                ]}/>
                            </div>
                        </div>
                        <i className="fa-solid fa-xmark closePreview" title='Cerrar previsualización de archivo' onClick={()=>{
                            popOutAlert();
                        }}/>
                    </div>
                    <div className="contentContainer">
                        <div className="fileC">
                            {renderContent()}
                        </div>
                    </div>
                </>
            )}
            {loading && (
                <LoadingSpace title={'Cargando archivo'}/>
            )}
        </div>
    )
}