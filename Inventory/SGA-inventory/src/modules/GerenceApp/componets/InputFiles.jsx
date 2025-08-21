
import './InputFiles.css'

export function InputFiles({title}){
    return(
        <div className="InputFiles">
            <label htmlFor="">{title}</label>
            <div className="spaceInput">
                <input type="file" hidden/>
                <i className="fa-solid fa-cloud-arrow-up"/>
                <span>Seleccionar Archivo</span>
            </div>
        </div>
    )
}