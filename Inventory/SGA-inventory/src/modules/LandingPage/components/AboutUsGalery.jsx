

import './AboutUsGalery.css';

export function AboutUsGalery(){
    return(
        <div className="AboutUsGalery">
            <div className="AboutUsGaleryContainer Container1">
                <div className="Container1Galery">
                    <div className="GaleryContainer1Grid1">
                        <div className="text">
                            <h3>Texto AI</h3>
                            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Laudantium, sunt! Sapiente saepe inventore tenetur adipisci vel minus, quidem voluptas optio incidunt maiores deleniti?</p>
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
                <div className="Container1ImageBackground">
                    <div className="imageBackground">Imagen Background</div>
                </div>
            </div>
            <div className="AboutUsGaleryContainer Container2">
                <div className="image">Imagen</div>
                <div className="btnMision">
                    <li><a href="#" className="btnMisionTitle">Mision</a>
                        <ul className="btnMisionOptions">
                            <li><a href="#">Op1</a></li>
                            <li><a href="#">Op2</a></li>
                            <li><a href="#">Op3</a></li>
                            <li><a href="#">Op4</a></li>
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
                        <div className="imageTop">
                            <div className="imagenTop">imagen1</div>
                        </div>
                        <div className="image">
                            <div className="imagen1">imagen1</div>
                        </div>
                    </div>
                </div>
                <div className="Container3Text">
                    <div className="text">Lorem ipsum dolor sit amet consectetur adipisicing elit. Omnis id, quis vel autem dolores, accusamus debitis libero non eveniet labore maxime, tempore eligendi corporis provident ullam? Tempore totam reiciendis nam.</div>
                    <a href="#">Vér más reseñas y opicniones</a>
                </div>
            </div>
        </div>

    )
}