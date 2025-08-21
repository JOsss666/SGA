
import { useAlert } from '../../../context/context'
import './AlertContainer.css'

export function AlertContainer({children,index}){
    const {popOutAlert} = useAlert();
    return(
        <div style={{
            zIndex:`${15 + index}`
        }} className={`AlertContainer ${index > 0 && "superiorAlert"}`} key={index}>
            <div className="closeAlert" onClick={()=>{popOutAlert(1)}}><i className="fa-solid fa-xmark"/></div>
            {children} <b>{`No. ${index}`}</b>
        </div>
    )
}