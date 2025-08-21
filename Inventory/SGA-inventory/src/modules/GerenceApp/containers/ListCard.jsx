import './ListCard.css'

export function ListCard({onClick,info}){

    console.log(info)
    return(
        <div className="ListCard" title='Ver detalles de lista' onClick={onClick}>
            <h3>{info.list_name}</h3>
            <strong><i class="fa-solid fa-box-open"/> 500</strong>
            <span>{info.store_name}: {info.list_description}.
            </span>
            <b><i className="fa-regular fa-calendar"/>{(info.created_at).substring(0,10)}</b>
            <div className="downloadList" title='Descargar lista'>
                <i className="fa-solid fa-file-arrow-down"/>
            </div>
        </div>
    )
} 