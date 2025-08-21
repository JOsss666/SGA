import './LabelValue.css'

export function LabelValue({title,value}){
    return(
        <div className="LabelValue">
            <span>{title}</span>
            <strong>{value}</strong>
        </div>
    )
}