import { useState } from "react"
import { FormInput } from "./FormInput";
import { copyToClipBoard } from "../../../utils/functions";
import { useNotifications } from "../../../context/context";
import './KeyRow.css'

const MASK = '••••••••••••';

export function KeyRow({info = {label:'Titulo', value:'sensitive-key'}}){

    const [visible,setVisible] = useState(false);
    const {addNotification} = useNotifications();

    const hasValue = Boolean(info.value);
    const sensitive = info.sensitive !== false;
    const shown = !hasValue ? '' : (sensitive && !visible ? MASK : info.value);

    const copy = ()=>{
        copyToClipBoard(info.value);
        addNotification({
            type:'info',
            description:`${info.label}: se ha copiado en el portapapeles`
        });
    }

    return(
        <div className="KeyRow">
            <FormInput
                disabled={true}
                required={false}
                value={info.label}
            />
            <FormInput
                disabled={true}
                required={false}
                placeholder={info.hint ?? '—'}
                value={shown}
            />
            <div className="KeyRowActions">
                <button type="button" className="itemAction" disabled={!hasValue}
                    title="Copiar" aria-label={`Copiar ${info.label}`} onClick={copy}>
                    <i className="bi bi-copy"/>
                </button>
                {sensitive && (
                    <button type="button" className="itemAction" disabled={!hasValue}
                        title={visible ? 'Ocultar' : 'Mostrar'}
                        aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${info.label}`}
                        onClick={()=>setVisible(!visible)}>
                        <i className={`bi bi-eye${visible ? '':'-slash'}`}/>
                    </button>
                )}
            </div>
        </div>
    )
}
