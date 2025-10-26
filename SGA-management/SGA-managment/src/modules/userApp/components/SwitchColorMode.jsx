
import './SwitchColorMode.css'
import { useAppInfo } from '../../../context/context'

export function SwitchColorMode(){

    const {darkMode,setDarkMode} = useAppInfo();

    return(
        <div onClick={()=>{
            setDarkMode(!darkMode)
        }} className={`SwitchColorMode ${darkMode? 'SwitchColorMode_darkMode':'SwitchColorMode_lightMode'}`}>
            <i className="fa-solid fa-sun SwitchIcon"/>
            <i className="fa-solid fa-moon SwitchIcon"/>
            <div className="switchIndicator"/>
        </div>
    )
}