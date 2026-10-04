
import { BoldTitle } from './BoldTitle';
import './CardMyBussines.css';
import { DescriptionSpan } from './DescriptionSpan';
import { FormButton } from './FormButton';

export function CardMyBussines({info, onClick, navigate}) {

    return (
        <div className="CardMyBussines">
            <div className="imageCardMyBussines">
                <img src={info.image} alt="" />
            </div>

            <div className="infoCardMyBussines">
                <BoldTitle text={info.name} />
                <DescriptionSpan text={info.text} />
            </div>

            <div className="buttonCardMyBussines">        
                <FormButton text={"Crear Nueva"} onClick={onClick}/>
            </div>
            <div className="linkCardMyBussines">
                <FormButton text={"Ver todos "} children={<i className="fa-solid fa-arrow-right"/>} onClick={navigate}/>
            </div>
        </div>
    );
}