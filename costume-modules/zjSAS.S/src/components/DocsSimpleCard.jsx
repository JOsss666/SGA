
import './DocsSimpleCard.css'

export function DocsSimpleCard({info}){
    return(
        <div title={info.description} className="DocsSimpleCard">
            <h4>{info.type}#{info.id}</h4>
            <strong>{info.description}</strong>
            <span>{(info.created_at).substring(0,10)}</span>
        </div>
    )
}

