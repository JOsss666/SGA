import { BoldTitle } from '../components/BoldTitle'
import { DescriptionSpan } from '../components/DescriptionSpan'
import './QuickActions.css'

export function QuickActions(){
    return(
        <div className="QuickActions">
            <div className="searchContent">
                <BoldTitle text={'Acciones Rapidas'}/>
                <DescriptionSpan text={'Escanee el codigo QR o el codigo de barras'}/>
                <input type="text" placeholder="Escanear o digitar codigo" autoFocus/>
            </div>
            <div className="img1C">
                <img src="https://res.cloudinary.com/djjxugmni/image/upload/v1772629039/unnamed-2_rg2vg1.png" alt="" />
            </div>
            <div className="img2C">
                <img src="https://res.cloudinary.com/djjxugmni/image/upload/v1772630354/Gemini_Generated_Image_ovmwk1ovmwk1ovmw-2_a3j4iw.png" alt="" />
            </div>
        </div>
    )
}