

import { NormalCard } from '../../GerenceApp/componets/NormalCard';
import './ConcatCard.css';

export function ConcatCard({icon,title,description,children,onClick}){
    return(
        <div className="ConcatCard" onClick={onClick}>
            <div className="ConcatCardIcon">
                {icon}
            </div>
            <NormalCard title={'¿Cómo puedo crear una cuenta?'} description={'Atención L-V 6AM - 10PM'}/>
            <div className="ConcatCardLink">
                <strong><a href="#">{children}</a></strong>
            </div>
        </div>
    )
}