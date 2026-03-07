import { BlueRoundButton } from '../components/BlueRoundButton';
import './HomePage.css';

export function HomePage() {
    return(
        <div className="HomePage">
            <section className="sectionHomePage mainSectionHomePage">
                <div className="saluteMessageContainer">
                    <h4>Bienvenido a</h4>
                    <h2>SGA 360°</h2>
                    <span>Bueno, Bonito y hecho a tu medida</span>
                </div>
                <img id="mainHomePage" src="https://res.cloudinary.com/djjxugmni/image/upload/v1772566974/Gemini_Generated_Image_bdzxvtbdzxvtbdzx-2_svyxej.png" alt="" />
                <BlueRoundButton title={'Comenzar ahora'}/>
            </section>
        </div>
    )
}