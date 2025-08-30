import { AboutUsGalery } from "../components/AboutUsGalery";
import { Titles } from "../components/Titles";
import './AboutUs.css';


export function AboutUs(){
    return(
        <div className="AboutUs">
            <div className="AboutUsTitle">
                <h1>SGA - <span className="highlight">INVENTARIOS</span></h1>
            </div>
            <div className="AboutUsGalery">
                <AboutUsGalery/>
            </div>
        </div>

    )
}

