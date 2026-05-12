

import { BoldTitle } from './BoldTitle';
import './CardReport.css';
import { DescriptionSpan } from './DescriptionSpan';

export function CardReport({type, title, description, onClick}){

    const t = (type || '').toLowerCase();

    const typeConfig = {
        documento: {
            icon: "fa-regular fa-file-lines",
            color: "#61ADFF" 
        },
        estadistico: {
            icon: "fa-solid fa-chart-simple",
            color: "#FF9800" 
        },
        inventarios: {
            icon: "fa-solid fa-chart-simple",
            color: "#FF9800" 
        },
        contable: {
            icon: "fa-solid fa-file-invoice-dollar",
            color: "#05D57E" 
        },
        processes: {
            icon: "fa-solid fa-people-carry-box",
            color: '#AD46FF'
        }
    };

    const { icon, color } = typeConfig[t] || {
        icon: "fa-regular fa-file",
        color: "#555"
    };


    return(
        <div className="CardReport" onClick={onClick} >
            <div className="IconReport" style={{ 
                    backgroundColor:color,
                    boxShadow:`0 0 1dvh ${color}`
                }}>
                <i className={icon}></i>
            </div>
            <div className="titleReport">
                <BoldTitle text={title}/>
            </div>
            <div className="descripctionReport">
                <DescriptionSpan text={description}/>
            </div>
            <div className="actionReport">
                <button onClick={onClick}><i className="fa-regular fa-star"/></button>
                <button onClick={onClick}><i className="fa-solid fa-arrow-up-from-bracket"/></button>
                <button onClick={onClick}><i className="fa-solid fa-download"/></button>
                <button onClick={onClick}><i className="fa-regular fa-comment"/></button>
            </div>
        </div>
    )
}