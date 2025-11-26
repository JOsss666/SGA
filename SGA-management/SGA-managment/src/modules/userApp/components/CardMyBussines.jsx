
import { BoldTitle } from './BoldTitle';
import './CardMyBussines.css';
import { DescriptionSpan } from './DescriptionSpan';
import { FormButton } from './FormButton';
import imageMyBussines from '../../../assets/imageCardMyBussines.png';

export function CardMyBussines({info, onClick}) {
    return (
        <div className="CardMyBussines" onClick={onClick}>
            <div className="imageCardMyBussines">
                <img src={info.image} alt="" />
            </div>

            <div className="infoCardMyBussines">
                <BoldTitle text={info.name} />
                <DescriptionSpan text={info.text} />
            </div>

            <div className="buttonCardMyBussines">        
                <FormButton text={"Crear Nueva"}/>
            </div>
            <div className="linkCardMyBussines">
                <FormButton text={"Ver todos >"}/>
            </div>
        </div>
    );
}