
import './MyBussines.css';
import { BoldTitle } from '../components/BoldTitle';
import { DescriptionSpan } from '../components/DescriptionSpan';
import { CardMyBussines } from '../components/CardMyBussines';
import image from '../../../assets/imageCardMyBussines.png';

export function MyBussines(){
    
    const info={
        name: "Nombre Empresa",
        text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles.",
        image: image
    }
    
    return(
        <div className="MyBussines">
            <div className="headMyBussines">
                <DescriptionSpan text={'¿Que hay de nuevo?'}/>
                <BoldTitle text={info.name}/>
            </div>
            <div className='carouselMyBussines'>
                <CardMyBussines info={info}/>
                <CardMyBussines info={info}/>
                <CardMyBussines info={info}/>
                <CardMyBussines info={info}/>
            </div>
        </div>
    )
}