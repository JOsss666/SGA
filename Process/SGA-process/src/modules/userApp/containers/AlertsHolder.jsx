import { useEffect } from 'react';
import { useAlert } from '../../../context/context'
import './AlertsHolder.css'
import { AlertContainer } from './AlertContainer';

export function AlertsHolder({}){

    const {tailAlerts} = useAlert();

    return(
        <div className="AlertsHolder">
            {tailAlerts.length>0 && tailAlerts.map((element,index)=>(
                <AlertContainer children={element} key={index}/>
            ))}
        </div>
    )
}