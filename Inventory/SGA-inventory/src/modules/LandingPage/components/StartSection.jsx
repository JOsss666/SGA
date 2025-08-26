

import { Titles } from './Titles';
import './StartSection.css'

export function StartSection(){
    return (
        <div className="StartSection">
            <>
                <Titles text={'Es un gran momento para ordenar tu negocio'}/>
            </>
            <a href="#" class="btnStartSection" >
                Como empezar en SGA - Inventarios
            </a>
        </div>
    )
}