
import { useState } from "react";
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import './HomeProcess.css'
import { HomeSearch } from "./HomeSearch";
import { AppIcon } from "../components/AppIcon";
import { AiResume } from "../components/AiResume";
import { useAlert } from "../../../context/context";
import { SearchResultsPannel } from "./Alerts/SearchResultsPannel";

export function HomeProcess(){

    const {popInAlert} = useAlert();
    const [visibleSearch,setVisibleSearch] = useState(false);

    return(
        <div className="HomeProcess">
            <div className="widgetsSpace">
                <AiResume/>
            </div>
            <div className="bottomBarC">
                <div className="appsBar">
                    <AppIcon title={'Documentos'} imgUrl={'https://cdnmain.sga360.co/static/DocumentosLogo_fuofdc.webp'}/>
                    <AppIcon title={'Archivos'} imgUrl={'https://cdnmain.sga360.co/static/CarpetaLogo1_zzjnut.webp'}/>
                    <AppIcon title={'Informes'} imgUrl={'https://cdnmain.sga360.co/static/InformesLogo1_iisxav.webp'}/>
                    <AppIcon onClick={()=>{
                        //setVisibleSearch(!visibleSearch)
                        popInAlert(<SearchResultsPannel searchValue={""}/>)
                    }} title={'Buscar'} imgUrl={'https://cdnmain.sga360.co/static/BuscarLogo1_jf8ij8.webp'}/>
                    <AppIcon title={'Cuenta'} imgUrl={'https://cdnmain.sga360.co/static/CuentaLogo1_aqqot5.webp'}/>
                </div>
            </div>
            {visibleSearch && (
                <HomeSearch/>
            )}
        </div>
    )
}