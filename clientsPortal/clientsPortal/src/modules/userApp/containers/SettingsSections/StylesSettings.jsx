import { useAppInfo } from "../../../../context/context";
import { SettingsGroup } from "../../components/SettingsGroup"
import './GeneralSettings.css'

export function StylesSettings(){
    const {userInfo,userConfig} = useAppInfo();
    const {darkMode} = useAppInfo();

    const sec1 = [
        {text:'Tema y colores',path:'style',value:darkMode? 'Oscuro':'Claro',type:'functionality',icon:darkMode?<i className="fa-solid fa-moon"/>:<i className="fa-solid fa-sun"/>},
        {text:'Tipo y tamaño de letra',path:'letterSize',value:
            `${userConfig.styles.typography.style}`
            ,type:'accesibility',icon:<i className="fa-solid fa-t"/>},
        {text:'Iconografía e imágenes',path:'cloudStorage',value:'',type:'accesibility',icon:<i className="fa-solid fa-icons"/>},
        {text:'Animaciones y efectos',path:'cloudStorage',value:'Activado',type:'functionality',icon:<i className="fa-solid fa-wand-magic-sparkles"/>}
    ]

    const sec2 = [
        {text:'Fondo de pantalla',path:'cloudStorage',value:'',type:'accesibility',icon:<i className="fa-solid fa-image"/>},
        {text:'Dashboard',path:'cloudStorage',value:
            `${userConfig.styles.dashboard.distribution}`
            ,type:'accesibility',icon:<i className="fa-solid fa-grip"/>},
        {text:'Widgets',path:'cloudStorage',value:
            `${userConfig.styles.widgets["only-escentials"] ? 'Solo escenciales':'Todos'}`
            ,type:'accesibility',icon:<i className="fa-solid fa-square-poll-vertical"/>},
        {text:'Diseño del layout',path:'cloudStorage',value:'',type:'accesibility',icon:<i className="fa-solid fa-table-columns"/>},
        {text:'Tablas y listados',path:'cloudStorage',value:'',type:'functionality',icon:<i className="fa-solid fa-table"/>}
    ]

    return(
        <div className="GeneralSettings">
            <SettingsGroup options={sec1}/>
            <SettingsGroup options={sec2}/>
        </div>
    )
}