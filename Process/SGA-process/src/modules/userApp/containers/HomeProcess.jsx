
import { useState } from "react";
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import './HomeProcess.css'
import { HomeSearch } from "./HomeSearch";
import { AppIcon } from "../components/AppIcon";

export function HomeProcess(){

    const [visibleSearch,setVisibleSearch] = useState(false);

    return(
        <div className="HomeProcess">
            <div className="bottomBarC">
                <div className="appsBar">
                    <AppIcon title={'Documentos'} imgUrl={'https://cdnmain.sga360.co/static/DocumentosLogo_fuofdc.webp'}/>
                    <AppIcon title={'Archivos'} imgUrl={'https://cdnmain.sga360.co/static/CarpetaLogo1_zzjnut.webp'}/>
                    <AppIcon title={'Informes'} imgUrl={'https://cdnmain.sga360.co/static/InformesLogo1_iisxav.webp'}/>
                    <AppIcon title={'Estadisticas'} imgUrl={'https://cdnmain.sga360.co/static/ChatGPT_Image_27_oct_2025_10_28_59_2_u5cama.webp'}/>
                    <AppIcon onClick={()=>{setVisibleSearch(!visibleSearch)}} title={'Buscar'} imgUrl={'https://cdnmain.sga360.co/static/BuscarLogo1_jf8ij8.webp'}/>
                    <AppIcon title={'Cuenta'} imgUrl={'https://cdnmain.sga360.co/static/CuentaLogo1_aqqot5.webp'}/>
                    <AppIcon title={'Mensajes'} imgUrl={'https://cdnmain.sga360.co/static/MensajesLogo2_y4fjoa.webp'}/>
                    <AppIcon title={'Asistente IA'} imgUrl={'https://cdnmain.sga360.co/static/ChatGPT_Image_29_sept_2025_16_21_31_shjyfv.webp'}/>
                    <AppIcon title={'Calendario'} imgUrl={'https://cdnmain.sga360.co/static/LogoCalendario1_ig0avt.webp'}/>
                    <AppIcon title={'Ajustes'} imgUrl={'https://cdnmain.sga360.co/static/ChatGPT_Image_27_oct_2025_10_28_59_1_vfix8g.webp'}/>
                    <AppIcon title={'Ayuda'} imgUrl={'https://cdnmain.sga360.co/static/AyudaLogo1_v362of.webp'}/>
                </div>
            </div>
            {visibleSearch && (
                <HomeSearch/>
            )}
        </div>
    )
}