import './LabelValue.css'

export function LabelValue({title,value,children}){
    return(
        <div className="LabelValue">
            <span className='lab'>{title}</span>
            <strong className='val'>{value}</strong>
            {children}
        </div>
    )
}