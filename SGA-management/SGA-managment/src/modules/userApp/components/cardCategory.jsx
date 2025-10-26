import { useState } from 'react'
import { ButtonMenu } from './ButtonMenu'
import './CardCategory.css'
import { TreeFormNewAccount } from '../containers/forms/TreeFormNewAccount';

export function CardCategory({info,hidden,reloadFun}){

    const [hiddenFormNewChildren,sethiddenFormNewChildren] = useState(true);

    return(
        <div className="CardCategory" style={{
            marginLeft:`${2 * info.level}vh`,
            display:hidden? 'none':'block'
        }}>
            <div className="contentCardCategory">
                {info.level >1 && (
                    <div className="treeIndicator"/>
                )}
                {info.level == 1 && (
                    <div className="levelIndicator lev1">
                        <span>Grupo</span>
                    </div>
                )}
                {info.level == 2 && (
                    <div className="levelIndicator lev2">
                        <span>Clase</span>
                    </div>
                )}
                {info.level == 4 && (
                    <div className="levelIndicator lev4">
                        <span>Cuentas principales</span>
                    </div>
                )}
                <strong title={`Ver detalles de cuenta ${info.code}`} className='code'>{info.code}</strong>
                <span className='concept'>{info.name}</span>
                <i style={{display:!hiddenFormNewChildren? 'inline':''}} onClick={()=>{
                    sethiddenFormNewChildren(!hiddenFormNewChildren);
                }} title={hiddenFormNewChildren? `Crear subCategoria de ${info.code}`:'Cancelar'} className={`fa-solid fa-${!hiddenFormNewChildren? 'minus':'plus'} createChidren`}/>
            </div>
            {!hiddenFormNewChildren && (
                <TreeFormNewAccount reloadINfo={reloadFun} fatherInfo={info}/>
            )}
        </div>
    )
}