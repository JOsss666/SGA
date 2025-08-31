

import { MediaHandler } from '../../../../media/MediaHandler';
import './AboutUsGalery.css';

export function AboutUsGalery(){
    return(
        <div className="AboutUsGalery">
            <div className="AboutUsGaleryContainer Container1">
                <div className="Container1Galery">
                    <div className="GaleryContainer1Grid1">
                        <div className="text">
                            <img src="https://freelogopng.com/images/all_img/1681142315open-ai-logo.png" alt="" />
                            <h3>Opinión generada por IA</h3>
                            <p>“ Impulsado por IA, conectado con todo tu equipo, un inventario en tiempo real como nunca antes. ”</p>
                        </div>
                        <div className="image">
                            <div className="imagen1">imagen1</div>
                        </div>
                    </div>
                    <div className="GaleryContainer1Grid2">
                        <div className="image">
                            <div className="image1">imagen1</div>
                            <div className="image2">imagen2</div>
                        </div>
                    </div>
                </div>
                <MediaHandler name={'Boxes'}/>
            </div>
            <div className="AboutUsGaleryContainer Container2">
                <div className="image">Imagen</div>
                <div className="btnMision">
                    <li><a href="#" className="btnMisionTitle">Nuestra Mision</a>
                        <ul className="btnMisionOptions">
                            <li><a href="#">Opcion 1</a></li>
                            <li><a href="#">Opcion 2</a></li>
                            <li><a href="#">Opcion 3</a></li>
                            <li><a href="#">Opcion 4</a></li>
                        </ul>
                    </li>
                </div>
            </div>
            <div className="AboutUsGaleryContainer Container3">
                <div className="Container3Galery">
                    <div className="GaleryContainer3Grid2">
                        <div className="image">
                            <div className="image2">imagen2</div>
                            <div className="image1">imagen1</div>
                        </div>
                    </div>
                    <div className="GaleryContainer3Grid1">
                        <div className="BoxesTools">
                            <MediaHandler name={'BoxTools'}/>
                        </div>
                        <div className="image">
                            <MediaHandler name={'TabletUseApp'}/>
                        </div>
                    </div>
                </div>
                <div className="Container3Text">
                    <p className="text">" Creamos el módulo de Inventarios para que tu empresa controle productos, insumos y stock en tiempo real."</p>
                    <a href="#">Vér más reseñas y opicniones</a>
                </div>
            </div>
        </div>

    )
}