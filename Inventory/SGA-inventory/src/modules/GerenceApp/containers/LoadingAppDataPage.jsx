
import './LoadingAppDataPage.css'

export function LoadingAppDataPage(){
    return(
        <div className="LoadingAppDataPage">
            <img src="https://i.pinimg.com/1200x/4d/6f/05/4d6f05603e71b923d19f78206b51f1af.jpg" />
            <div className="searchServiceAnimal">
                <span>Oso Hormiguero Andino</span>
            </div>
            <div className="loadingDotsA">
                <div className="loadingDot"></div>
                <div className="loadingDot"></div>
                <div className="loadingDot"></div>
                <div className="loadingDot"></div>
                <div className="loadingDot"></div>
                <div className="loadingDot"></div>
                <div className="loadingDot"></div>
                <div className="loadingDot"></div>
            </div>
            <h6>Cargando el contenido de su aplicación...</h6>
            <strong>SGA - Proceso</strong>
        </div>
    )
}