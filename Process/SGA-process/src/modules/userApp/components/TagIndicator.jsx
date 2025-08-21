import './TagIndicator.css'

export function TagIndicator({title,color,children}){
    return(
        <div style={{
            backgroundColor:color.length == 4? `${color}3`:`${color}30`,
            color:color,
            outline:`solid .1vh ${color.length == 4? `${color}7`:`${color}70`}`
        }} className="TagIndicator">
            <h5>{title}</h5>
            {children}
        </div>
    )
}