
import './BeutyReciptContainer.css'

export function BeutyReciptContainer({color,children}){
    return(
        <div className="BeutyReciptContainer">
            <div className="mainSpace">
                {children}
            </div>
            <div className="curvyDiv"></div>
            <div className="curvyDiv2"></div>
            <div className="postColor"></div>
        </div>
    )
}