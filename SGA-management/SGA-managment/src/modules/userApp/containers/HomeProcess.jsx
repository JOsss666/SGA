
import { useState } from "react";
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import './HomeProcess.css'
import { HomeSearch } from "./HomeSearch";
import { AppIcon } from "../components/AppIcon";
import { AiResume } from "../components/AiResume";

export function HomeProcess(){

    const [visibleSearch,setVisibleSearch] = useState(false);

    return(
        <div className="HomeProcess">
            <div className="widgetsSpace">
                <AiResume/>
            </div>
            <div className="bottomBarC">
                <div className="appsBar">
                    <AppIcon title={'Documentos'} imgUrl={'https://res.cloudinary.com/djjxugmni/image/upload/v1760913629/DocumentosLogo_fuofdc.png'}/>
                    <AppIcon title={'Archivos'} imgUrl={'https://res.cloudinary.com/djjxugmni/image/upload/v1760911292/CarpetaLogo1_zzjnut.png'}/>
                    <AppIcon title={'Informes'} imgUrl={'https://res.cloudinary.com/djjxugmni/image/upload/v1760908279/InformesLogo1_iisxav.png'}/>
                    <AppIcon title={'Estadisticas'} imgUrl={'https://res.cloudinary.com/djjxugmni/image/upload/v1760908554/EstadisticasLogo1_bjc8fv.png'}/>
                    <AppIcon onClick={()=>{setVisibleSearch(!visibleSearch)}} title={'Buscar'} imgUrl={'https://res.cloudinary.com/djjxugmni/image/upload/v1760909160/BuscarLogo1_jf8ij8.png'}/>
                    <AppIcon title={'Cuenta'} imgUrl={'https://res.cloudinary.com/djjxugmni/image/upload/v1760910902/CuentaLogo1_aqqot5.png'}/>
                    <AppIcon title={'Mensajes'} imgUrl={'https://res.cloudinary.com/djjxugmni/image/upload/v1760910097/MensajesLogo1_rhku5p.png'}/>
                    <AppIcon title={'Asistente IA'} imgUrl={'https://res.cloudinary.com/djjxugmni/image/upload/v1760911291/AiLogo1_qg2zvm.png'}/>
                    <AppIcon title={'Calendario'} imgUrl={'https://res.cloudinary.com/djjxugmni/image/upload/v1760913184/LogoCalendario1_ig0avt.png'}/>
                    <AppIcon title={'Ajustes'} imgUrl={'https://res.cloudinary.com/djjxugmni/image/upload/v1760908821/AjustesLogo1_zfyoil.png'}/>
                    <AppIcon title={'Ayuda'} imgUrl={'https://res.cloudinary.com/djjxugmni/image/upload/v1760911291/AyudaLogo1_v362of.png'}/>
                </div>
            </div>
            {visibleSearch && (
                <HomeSearch/>
            )}
        </div>
    )
}