import { Paragraph } from '../components/Paragraph'
import { Titles } from '../components/Titles'
import './Home.css'

export function Home(){
    return(
        <div className="Home">
            <Titles text={'Bienvenidos'}/>
            <Paragraph text={'Estructura para parrafos <br/> texto por defecto'}/>
        </div>
    )
}