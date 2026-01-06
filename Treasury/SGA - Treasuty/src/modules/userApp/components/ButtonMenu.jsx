
import './ButtonMenu.css'

export function ButtonMenu({children,title,noRotate,onClick}){
    return(
        <div onClick={onClick} title={title} className={`ButtonMenu ${noRotate? '':'rotateIcon'}`}>
            {children}
        </div>
    )
}