
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
                    <AppIcon onClick={()=>{setVisibleSearch(!visibleSearch)}} title={'Buscar'} imgUrl={'https://res.cloudinary.com/djjxugmni/image/upload/v1760909160/BuscarLogo1_jf8ij8.png'}/>
                    <AppIcon title={'Cuenta'} imgUrl={'https://res.cloudinary.com/djjxugmni/image/upload/v1760910902/CuentaLogo1_aqqot5.png'}/>
                </div>
            </div>
            {visibleSearch && (
                <HomeSearch/>
            )}
        </div>
    )
}