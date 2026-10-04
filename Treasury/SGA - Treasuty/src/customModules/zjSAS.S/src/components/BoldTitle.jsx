
import './BoldTitle.css'

export function BoldTitle({text,children}){
    return(
        <h4 className="BoldTitle">
            {text}
            {children}
        </h4>
    )
}