import { SettingLine } from './SettingLine'
import'./SettingsGroup.css'

export function SettingsGroup({options}){

    return(
        <div className="SettingsGroup">
            {options.map((element,index)=>(
                <SettingLine info={element} key={index}/>
            ))}
        </div>
    )
}