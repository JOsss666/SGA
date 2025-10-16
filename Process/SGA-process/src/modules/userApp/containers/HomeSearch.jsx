import { AppIcon } from "../components/AppIcon";
import { SearchBar } from "../components/SearchBar";
import './HomeSearch.css'

export function HomeSearch(){
    return(
        <div className="HomeSearch">
            <SearchBar placeholder={'Buscar'}/>
            <div className="resultsContainer">
                <AppIcon title={'Buscar'} imgUrl={'https://cdn-icons-png.flaticon.com/512/5968/5968517.png'} visibleTitle={true}/>
                <AppIcon title={'Archivos'} imgUrl={'https://icons.iconarchive.com/icons/custom-icon-design/flatastic-1/512/folder-icon.png'} visibleTitle={true}/>
                <AppIcon title={'Almacenamiento'} imgUrl={'https://images.seeklogo.com/logo-png/42/2/apple-icloud-logo-png_seeklogo-426388.png'} visibleTitle={true}/>
                <AppIcon title={'Asistente IA'} imgUrl={'https://us1.discourse-cdn.com/openai1/original/4X/3/2/1/321a1ba297482d3d4060d114860de1aa5610f8a9.png'} visibleTitle={true}/>
                <AppIcon title={'Informes'} imgUrl={'https://cdn-icons-png.freepik.com/512/8276/8276278.png'} visibleTitle={true}/>
                <AppIcon title={'Estadisticas'} imgUrl={'https://cdn-icons-png.freepik.com/512/15197/15197517.png'} visibleTitle={true}/>
            </div>
        </div>
    )
}