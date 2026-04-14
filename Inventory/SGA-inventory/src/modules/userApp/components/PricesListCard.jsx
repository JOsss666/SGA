import { TagIndicator } from "./TagIndicator";
import './PricesListCard.css';
import { formatDate } from "../../../utils/functions";
import { MoreOptions } from "./MoreOptions";

export function PricesListCard({info, onClick}){
    return(
        <div className="PricesListCard" onClick={onClick}>
            <div className="headCard">
                <div className="tagContainer">
                    <TagIndicator children={<i className="fa-solid fa-tag"/>}/>
                </div>
                <div className="optionsCard">
                    <MoreOptions options={[
                        {text:'Editar',icon:<i className="fa-solid fa-pen"/>},
                        {text:'Comentar',icon:<i className="fa-solid fa-pen"/>},
                        {text:'Eliminar',icon:<i className="fa-solid fa-trash"/>},
                        {text:'Descargar xlsx',icon:<i className="fa-regular fa-file-excel"/>},
                        {text:'Descargar csv',icon:<i className="fa-solid fa-file-csv"/>},
                    ]}/>
                </div>
                <div className="titleList">
                    <h6 className="listName">{info.name}</h6>
                    <TagIndicator type={'active'} title={info.status}/>
                </div>
                <span className="descriptionList">
                    {info.description}
                </span>
                <span className="lastUpdated">
                    <i className="fa-regular fa-clock"/>
                    Ultima actualización: {formatDate(info.updated_at)}
                </span>
                 <span className="lastUpdated">
                    <i className="fa-regular fa-calendar"/>
                    Fecha de creación: {formatDate(info.created_at)}
                </span>
            </div>
        </div>
    )
}