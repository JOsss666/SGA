import './TableClicks.css'
import {UserCard} from '../components/UserCard'
import { moneyFormat } from '../../utils/functions'
import {PreviewFile} from './Preview/PreviewFile'
import { useEffect } from 'react';


export function TableClicks({columns,info,disabled, useAlert, appInfo}){

    const {popInAlert} = useAlert();

    const extractIdFromAttached = (attachedValue) => {
        try {
            if (!attachedValue) return null;

            let data = attachedValue;

            // 1. Limpieza de strings malformados con llaves dobles {"{...}"}
            if (typeof data === 'string') {
                let cleanStr = data.trim();
                
                // Detectamos si el string está envuelto en el formato corrupto {"{...}"}
                if (cleanStr.startsWith('{"{')) {
                    // Extraemos lo que hay entre la primera y última llave de ese envoltorio
                    cleanStr = cleanStr.substring(1, cleanStr.length - 1);
                }

                // 2. Parseo recursivo para deshacer la "triple serialización"
                let safetyCounter = 0; // Evita bucles infinitos si el JSON es inválido
                while (typeof cleanStr === 'string' && safetyCounter < 5) {
                    try {
                        cleanStr = JSON.parse(cleanStr);
                    } catch (e) {
                        // Si el parseo estándar falla por escapes, intentamos limpiar manualmente
                        cleanStr = JSON.parse(cleanStr.replace(/\\"/g, '"'));
                    }
                    safetyCounter++;
                }
                data = cleanStr;
            }

            // 3. Retornar únicamente el ID
            // Si es un array, devolvemos el ID del primer elemento
            if (Array.isArray(data) && data.length > 0) {
                return data[0].id ? String(data[0].id) : null;
            } 
            
            // Si es un objeto directo
            if (data && data.id) {
                return String(data.id);
            }

            return null;
        } catch (error) {
            console.error("Error al extraer ID del attached:", error);
            return null;
        }
    };

    return(
        <div className="TableClicks">
            <div className="headTable">
                {columns.map((element,index)=>(
                    <span className="thTitle" key={index}>
                        {element}
                    </span>
                ))}
            </div>
            <div className="bodyTable">
                {info.map((element,index)=>(
                    <div className="rowClicks" key={index} onClick={()=>{
                        popInAlert(<PreviewFile id={extractIdFromAttached(element.attached)} useAlert={useAlert} appInfo={appInfo} />)
                    }}>
                        <UserCard name={element.asset_name} desc={element.asset_model} imgSrc={element.asset_img}/>
                        <span className='rowTable'>{moneyFormat(parseInt(element.initialClicks))}</span>
                        <span className='rowTable'>{element.responsable}</span>
                        <span className='rowTable'>{element.description}</span>
                        <span className='rowTable'>{element.created_at ? (element?.created_at)?.substring(0,16):'---'}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}