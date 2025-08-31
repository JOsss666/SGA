import { useNotifications } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { ButtonMenu } from "../../components/ButtonMenu";
import './DocumentPreview.css'

export function DocumentPreview({children,info}){

    const {addNotification} = useNotifications();

    return(
        <div className="DocumentPreview">
            <header>
                <div className="CloseDocPrev">
                    <i class="fa-solid fa-xmark"/>
                </div>
                <div className="docInfo">
                    {info.type == 'Document' && (
                        <>
                            <i class="fa-solid fa-file-code "/>
                            <strong>{info.docType}# {info.id}</strong>
                        </>
                    )}
                </div>
                <div className="MenuPreviewOptions">
                    <ButtonMenu title={'Guardar'}><i className="fa-solid fa-floppy-disk"/></ButtonMenu>
                    <ButtonMenu title={'Descargar'}><i className="fa-solid fa-cloud-arrow-down"/></ButtonMenu>
                    <ButtonMenu title={'Imprimir'}><i className="fa-solid fa-print"/></ButtonMenu>
                    <ButtonMenu noRotate={true} title={'Compartir'}><i className="fa-solid fa-share-nodes"/></ButtonMenu>
                    <ButtonMenu noRotate={true} title={'Comentarios'}><i className="fa-regular fa-comments"/></ButtonMenu>
                    <ButtonMenu title={'Reportar'}><i className="fa-regular fa-flag"/></ButtonMenu>
                    <ButtonMenu noRotate={true} title={'Fijar En Favoritos'}><i className="fa-regular fa-bookmark"/></ButtonMenu>
                </div>
            </header>
        </div>
    )
}