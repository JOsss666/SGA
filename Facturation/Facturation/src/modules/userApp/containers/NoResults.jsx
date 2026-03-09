import { useAlert } from "../../../context/context"
import './NoResults.css'

export function NoResults({title,newOption,children,img}){
    const {popInAlert} = useAlert()
    return(
        <div className="NoResults">
            <img src={img? img:"https://res.cloudinary.com/djjxugmni/image/upload/v1765478102/undraw_no-signal_nqfa_z0tcwz.svg"}/>
            <h6>
                {title}
                {newOption != undefined && (
                    <b onClick={()=>{
                        if(children != undefined){{
                            popInAlert(children);
                        }}
                    }}>{newOption}</b>
                )}
            </h6>
        </div>
    )
}