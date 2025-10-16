
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
                    <AppIcon title={'Buscar'} imgUrl={'https://cdn-icons-png.flaticon.com/512/5968/5968517.png'}/>
                    <AppIcon title={'Archivos'} imgUrl={'https://icons.iconarchive.com/icons/custom-icon-design/flatastic-1/512/folder-icon.png'}/>
                    <AppIcon onClick={()=>{setVisibleSearch(!visibleSearch)}} title={'Buscar'} imgUrl={'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Search_Icon.svg/1200px-Search_Icon.svg.png'}/>
                    <AppIcon title={'Informes'} imgUrl={'https://cdn-icons-png.freepik.com/512/8276/8276278.png'}/>
                    <AppIcon title={'Estadisticas'} imgUrl={'https://cdn-icons-png.freepik.com/512/15197/15197517.png'}/>
                    <AppIcon title={'Asistente IA'} imgUrl={'https://us1.discourse-cdn.com/openai1/original/4X/3/2/1/321a1ba297482d3d4060d114860de1aa5610f8a9.png'}/>
                    <AppIcon title={'Ajustes'} imgUrl={'https://icons.iconarchive.com/icons/graphicloads/100-flat-2/256/settings-icon.png'}/>
                    <AppIcon title={'Ayuda'} imgUrl={'https://icon-library.com/images/info-icon-svg/info-icon-svg-5.jpg'}/>
                </div>
            </div>
            {visibleSearch && (
                <HomeSearch/>
            )}
        </div>
    )
}