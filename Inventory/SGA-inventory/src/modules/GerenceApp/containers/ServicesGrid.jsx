import { useNavigate } from "react-router-dom"
import './ServicesGrid.css'

export function ServicesGrid(){
    return(
        <div className="ServicesGrid">
            <div className="serviceBubble">
                <img src="https://i.pinimg.com/736x/fc/55/78/fc557891f4587e03e4eaaea18a4bc9c3.jpg" alt="" />
                <span>Cuenta</span>
            </div>
            <div className="serviceBubble">
                <img src="https://i.pinimg.com/736x/d5/a6/de/d5a6decbe101b77eedb640cd1cc04255.jpg" alt="" />
                <span>SGA</span>
            </div>
            <div className="serviceBubble">
                <img src="https://i.pinimg.com/1200x/7a/3e/d6/7a3ed6703f8bde43539b68bb39754dde.jpg" alt="" />
                <span>Inventario</span>
            </div>
            <div className="serviceBubble">
                <img src="https://i.pinimg.com/1200x/4d/6f/05/4d6f05603e71b923d19f78206b51f1af.jpg" alt="" />
                <span>Procesos</span>
            </div>
            <div className="serviceBubble">
                <img src="https://i.pinimg.com/1200x/99/65/82/996582960c20e3b60a90ca86a74eedd4.jpg" alt="" />
                <span>Contabilidad</span>
            </div>
            <div className="serviceBubble">
                <img src="https://i.pinimg.com/736x/d9/62/d6/d962d6da21e49cd40d94d4fa244d153e.jpg" alt="" />
                <span>Facturación</span>
            </div>
            <div className="serviceBubble">
                <img src="https://i.pinimg.com/1200x/0a/5b/83/0a5b8348a20c7f9e2eb608fd76719ed4.jpg" alt="" />
                <span>Tesoreria</span>
            </div>
            <div className="serviceBubble">
                <img src={'https://res.cloudinary.com/djjxugmni/image/upload/v1759160717/logo_certicloud-_perfil_azul_2_ljka0q.png'} alt="" />
                <span>CertiCloud</span>
            </div>
        </div>
    )
}