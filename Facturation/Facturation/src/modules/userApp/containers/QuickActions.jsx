import { useRef, useState } from 'react'
import { BoldTitle } from '../components/BoldTitle'
import {useAlert} from '../../../context/context'
import { DescriptionSpan } from '../components/DescriptionSpan'
import './QuickActions.css'
import { ProcessStatusAlert } from './Alerts/ProcessStatusAlert'

export function QuickActions(){

    // Requirements
    const inRef = useRef();
    const {popInAlert} = useAlert()

    // Control
    const [disabled,setDisabled] = useState(false);


    // Functions

    const normalizeUrl = (raw) => {
        return raw
            .replace('https&]]', 'https://')
            .replaceAll(']', '/')
            .replaceAll('-', '.');
    };

    const handleCodeAction = async(code)=>{
       // Caso Lectura de QR
        if(code.startsWith('https&]]')){
            const fixedUrl = normalizeUrl(code);
            window.open(fixedUrl, '_blank', 'noopener,noreferrer');
            return;
        }
        // Caso lectura cod Barras
        let action = code.split('n')[0];
        let value = code.split('n')[1];
        if(action == undefined || value == undefined){
            alert('Accion no valida')
            return;
        }

        switch (action){
            case '1026': popInAlert(<ProcessStatusAlert instance_id={value}/>); break;
        }
    }

    const handleCodeInteraction = ()=>{
        setDisabled(true)
        console.log(inRef.current.value);
        // funcion para procesar codigos
            handleCodeAction(inRef.current.value);
        setDisabled(false)
        inRef.current.value = "";
        inRef.current.focus;
    }
    
    return(
        <div className="QuickActions">
            <div className="searchContent">
                <BoldTitle text={'Acciones Rapidas'}/>
                <DescriptionSpan text={'Escanee el codigo QR o el codigo de barras'}/>
                <form onSubmit={(e)=>{
                    e.preventDefault();
                    handleCodeInteraction();
                }}>
                    <input ref={inRef} type="text" placeholder="Escanear o digitar codigo" autoFocus disabled={disabled}/>
                    <i title='Buscar' className="fa-solid fa-magnifying-glass searchIcon" onClick={()=>{
                        handleCodeInteraction();
                    }}/>
                </form>
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