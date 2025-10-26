import './AppIcon.css'

export function AppIcon({imgUrl,title,visibleTitle,onClick,children,hidden}){
    if(!hidden){
        return(
            <div onClick={onClick} title={title} className={`AppIcon ${visibleTitle? 'horizontalAppIcon':'onlyAppIcon'}`}>
                <button className="IconButton">
                    {imgUrl != undefined && (<img src={imgUrl}/>)}
                    {children}
                </button>
                {visibleTitle && (
                    <span>{title}</span>
                )}
            </div>
        )
    }
}