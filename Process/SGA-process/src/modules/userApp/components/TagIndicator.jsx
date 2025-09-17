import './TagIndicator.css'

export function TagIndicator({title,type,children,classN}){
    return(
        <div className={`TagIndicator ${type}_color ${classN}`}>
            <h5>{title}</h5>
            {children}
        </div>
    )
}