
import './ServiceSgaCard.css'

export function ServiceSgaCard({visbleInfo,title,desc,imgRef}){
    return(
        <div className="ServiceSgaCard">
            <img src={imgRef} alt="" />
            {visbleInfo && (
                <div className="serviceInfo">
                    <h2>{title}</h2>
                    <span>{desc}</span>
                </div>
            )}
        </div>
    )
}