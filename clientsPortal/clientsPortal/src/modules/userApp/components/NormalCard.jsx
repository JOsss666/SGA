
import './NormalCard.css'

export function NormalCard({title,description,onClick,onlyTitle,img}){
    return(
        <div className={`NormalCard ${onlyTitle? 'NormalCard_onlyTitle':'NormalCard_complete'}`}
        onClick={onClick}
        style={{
            backgroundImage:`${img!= undefined? `url(${img})`:'none'}`
        }}
        >
                <strong>{title}</strong>
                {!onlyTitle && (
                    <span>{description}</span>
                )}
        </div>
    )
}