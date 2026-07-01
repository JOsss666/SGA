import { TagIndicator } from "./TagIndicator";
import './PricesListCard.css';
import { formatDate } from "../../../utils/functions";
import { MoreOptions } from "./MoreOptions";
import { useRef } from "react";

export function PricesListCard({ info, onClick, onDelete }) {
    const optionsContainer = useRef();

    const handleDelete = () => {
        if (window.confirm(`¿Eliminar la lista "${info.name}"?`)) {
        onDelete(info.id);
        }
    };

    return (
        <div className="PricesListCard" onClick={(e) => {
            if (optionsContainer.current && optionsContainer.current.contains(e.target)) {
                return;
            }
            onClick();
        }}>
            <div className="headCard">
                <div className="tagContainer">
                    <TagIndicator children={<i className="fa-solid fa-tag"/>} />
                </div>
                <div className="optionsCard" ref={optionsContainer}>
                    <MoreOptions options={[
                        { text: 'Editar', icon: <i className="fa-solid fa-pen"/>, action: () => {} },
                        { text: 'Comentar', icon: <i className="fa-solid fa-comment"/>, action: () => {} },
                        { text: 'Eliminar', icon: <i className="fa-solid fa-trash"/>, action: handleDelete },
                        { text: 'Descargar xlsx', icon: <i className="fa-regular fa-file-excel"/>, action: () => {} },
                        { text: 'Descargar csv', icon: <i className="fa-solid fa-file-csv"/>, action: () => {} },
                    ]} />
                </div>
                <div className="titleList">
                    <h6 className="listName">{info.name}</h6>
                    <TagIndicator type={'active'} title={info.status} />
                </div>
                <span className="descriptionList">
                    {info.description}
                </span>
                <span className="lastUpdated">
                    <i className="fa-regular fa-clock" />
                    Última actualización: {formatDate(info.updated_at)}
                </span>
                <span className="lastUpdated">
                    <i className="fa-regular fa-calendar" />
                    Fecha de creación: {formatDate(info.created_at)}
                </span>
            </div>
        </div>
    );
}