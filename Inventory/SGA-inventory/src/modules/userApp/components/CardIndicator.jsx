
import './CardIndicator.css'

export function CardIndicator({loading,info,children}){

    if(info == undefined){
        info = {}
    }

    return(
        <div className="CardIndicator">
            <div className="infoContainer">
                <i title={`Haz click para mas información de "${info.title}"`} class="fa-solid fa-circle-info"></i>
                <span hidden={true}>{info.description}</span>
            </div>
            <div className="iconContainer">
                {!loading && (children)}
                {loading && (
                    <i className="loadingCardicon fa-solid fa-spinner"/>
                )}
            </div>
            <strong>{info.icon}{info.title}</strong>
        </div>
    )
}