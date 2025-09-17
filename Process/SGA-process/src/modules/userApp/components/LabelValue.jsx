import './LabelValue.css'

export function LabelValue({title,value,children}){
    return(
        <div className="LabelValue">
            <span>{title}</span>
            <strong>{value}</strong>
            {children}
        </div>
    )
}