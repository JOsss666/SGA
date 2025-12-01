import './SubSectionTitle.css'

export function SubSectionTitle({text}){
    return(
        <div className="SubSectionTitle">
            <h3>{text}</h3>
            <div className="decorationDot"></div>
        </div>
    )
}