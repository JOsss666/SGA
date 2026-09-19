import './OcSimpleCard.css'

export function OcSimpleCard({info}){
    return(
        <div className="OcSimpleCard">
            <div className="ocSContainer">
                <strong>OC#{info.id}</strong>
                <span>{info.description}</span>
            </div>
            <span className='dateOc'>{(info.created_at).substring(0,10)}</span>
        </div>
    )
}