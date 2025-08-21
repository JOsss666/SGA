
import { useEffect, useRef, useState } from 'react'
import { useAlert } from '../../../context/context';
import './AlertsApp.css'
import { AlertContainer } from './AlertContainer';

export function AlertsApp(){
    const { tailAlerts, popOutAlert } = useAlert()
    const container = useRef();

    window.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            console.log(tailAlerts)
            console.log(tailAlerts.length -1);
            popOutAlert(tailAlerts.length -1)
        }
    });

    useEffect(()=>{
        console.log(tailAlerts)
    },[tailAlerts])

    return(
        <div ref={container} className="AlertsApp">
            <div className="spaceActualAlert">
                {tailAlerts.length > 0 && tailAlerts.map((element,index)=>(
                    <AlertContainer children={element} key={index} index={index}/>
                ))}
                {tailAlerts.length == 0 && (
                    <span>Este es el contenido de AlertsApp</span>
                )}
            </div>
        </div>
    )
}