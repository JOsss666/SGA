
import './CardMyBussinesUnits.css';
import { BoldTitle } from './BoldTitle';
import { DescriptionSpan } from './DescriptionSpan';

export function CardMyBussinesUnits({onClick,title,text,image,children}){
    return(
        <div onClick={onClick} className="CardMyBussinesUnits">
            <img src={image} alt="ImageBackground" />
            <BoldTitle text={title}/>
            <DescriptionSpan text={text}/>
        </div>
    )
}