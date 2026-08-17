import './LinkPreviewMessage.css'

export function LinkPreviewMessage({icon,title,subtitle}){
    return(
        <div className="LinkPreviewMessage">
            <div className="linkIcon">
                {icon != undefined? icon : <i className="fa-solid fa-video"/>}
            </div>
            <div className="linkInfo">
                <strong>{title}</strong>
                <span>{subtitle}</span>
            </div>
        </div>
    )
}
