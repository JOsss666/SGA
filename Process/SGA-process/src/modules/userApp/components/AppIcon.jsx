import './AppIcon.css'

export function AppIcon({imgUrl,title,visibleTitle,onClick}){
    return(
        <div onClick={onClick} title={title} className="AppIcon">
            <button className="IconButton">
                <img src={imgUrl}/>
            </button>
            {visibleTitle && (
                <span>{title}</span>
            )}
        </div>
    )
}