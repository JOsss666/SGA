

import './BoldButton.css'

export function BoldButton({children,title,onClick}){
    return(
        <div onClick={onClick} title={title} className="BoldButton">
            {children}
        </div>
    )
}