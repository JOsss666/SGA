import './TagIndicator.css'

export function TagIndicator({desc,title,type,children,classN}){
    return(
        <div title={desc} className={`TagIndicator ${type}_color ${classN}`}>
            <h5>{title}</h5>
            {children}
        </div>
    )
}