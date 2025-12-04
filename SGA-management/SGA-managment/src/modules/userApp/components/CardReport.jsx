

import { BoldTitle } from './BoldTitle';
import './CardReport.css';
import { DescriptionSpan } from './DescriptionSpan';

export function CardReport({type, title, description,onClick}){

    const t = (type || '').toLowerCase();

    const typeConfig = {
        documento: {
            icon: "fa-regular fa-file",
            color: "#2D72D9" 
        },
        estadistico: {
            icon: "fa-solid fa-chart-simple",
            color: "#FF9800" 
        },
        contable: {
            icon: "fa-solid fa-file-invoice-dollar",
            color: "#4CAF50" 
        }
    };

    const { icon, color } = typeConfig[t] || {
        icon: "fa-regular fa-file",
        color: "#555"
    };


    return(
        <div className="CardReport" style={{ borderColor: color }}>
            <div className="IconReport" style={{ color }}>
                <i className={icon}></i>
            </div>
            <div className="titleReport">
                <BoldTitle text={title}/>
            </div>
            <div className="descripctionReport">
                <DescriptionSpan text={description}/>
            </div>
            <hr />
            <div className="actionReport">
                <button onClick={onClick}><i className="fa-regular fa-star"/></button>
                <button onClick={onClick}><i className="fa-solid fa-upload"/></button>
                <button onClick={onClick}><i className="fa-solid fa-download"/></button>
                <button onClick={onClick}><i className="fa-regular fa-comment"/></button>
            </div>
        </div>
    )
}