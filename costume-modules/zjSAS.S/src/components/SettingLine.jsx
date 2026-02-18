import './SettingLine.css'

export function SettingLine({info,onClick}){

    const asingColor = (type)=>{
        switch (type){
            case "general":
                return "#A29E9E"
            case "functionality":
                return "#007AFF"
            case "system":
                return "#FF8C00"
            case "accesibility":
                return "#C6185C"
            case "mode":
                return "#7B00FF"
            case undefined:
                return "#A29E9E"
        }
    }

    return(
        <div className="SettingLine" onClick={onClick}>
            <div className="iconContainer" style={{
                backgroundColor:`${asingColor(info.type)}`
            }}>
                {info.icon}
            </div>
            <strong>{info.text}</strong>
            <span>{info.value}</span>
            <i className="fa-solid fa-angle-right navigateIcon"/>
        </div>
    )
}