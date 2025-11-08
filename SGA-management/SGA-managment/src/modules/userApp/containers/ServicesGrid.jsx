import { useNavigate } from "react-router-dom"
import './ServicesGrid.css'
import certiLogo from '../../../assets/certiLogo.png';

export function ServicesGrid(){
    return(
        <div className="ServicesGrid">
            <div className="serviceBubble">
                <img src="https://i.pinimg.com/736x/fc/55/78/fc557891f4587e03e4eaaea18a4bc9c3.jpg" alt="" />
                <span>Cuenta</span>
            </div>
            <div className="serviceBubble">
                <img src="https://res.cloudinary.com/djjxugmni/image/upload/v1761512639/ChatGPT_Image_26_oct_2025_16_03_39_d7hmbb.png" alt="" />
                <span>SGA</span>
            </div>
            <div className="serviceBubble">
                <img src="https://res.cloudinary.com/djjxugmni/image/upload/v1759181476/ChatGPT_Image_25_ago_2025_15_43_35_s9jwrf.png" alt="" />
                <span>Inventario</span>
            </div>
            <div className="serviceBubble">
                <img src="https://res.cloudinary.com/djjxugmni/image/upload/v1759181339/ChatGPT_Image_7_sept_2025_13_29_09_v2xl9a.png" alt="" />
                <span>Procesos</span>
            </div>
            <div className="serviceBubble">
                <img src="https://i.pinimg.com/1200x/99/65/82/996582960c20e3b60a90ca86a74eedd4.jpg" alt="" />
                <span>Contabilidad</span>
            </div>
            <div className="serviceBubble">
                <img src="https://res.cloudinary.com/djjxugmni/image/upload/v1761582964/ChatGPT_Image_7_sept_2025_16_39_37_pc79hk.png" alt="" />
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