
import './LoadingAppDataPage.css'

export function LoadingAppDataPage(){
    return(
        <div className="LoadingAppDataPage">
            <img src="https://res.cloudinary.com/djjxugmni/image/upload/v1759181339/ChatGPT_Image_7_sept_2025_13_29_09_v2xl9a.png" />
            <div className="searchServiceAnimal">
                <span>Orquidea Morada <i className="fa-solid fa-share-from-square"/></span>
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
            <strong>SGA - Procesos</strong>
        </div>
    )
}