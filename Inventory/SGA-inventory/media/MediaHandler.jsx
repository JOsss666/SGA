
import imgOso1 from './oso1.png'
import imgOso2 from './oso2.png'
import imgOso3 from './oso3.png'
import imgOso4 from './oso4.png'
import imgOso5 from './oso5.png'
import Boxes from './Boxes.png'
import BoxTools from './BoxTools.png'
import TabletUseApp from './TabletUseApp.jpg'

export function MediaHandler({name,className}){

    const arrayFiles = {
        'oso1':imgOso1,
        'oso2':imgOso2,
        'oso3':imgOso3,
        'oso4':imgOso4,
        'oso5':imgOso5,
        'Boxes':Boxes,
        'BoxTools':BoxTools,
        'TabletUseApp':TabletUseApp
    }

    return(
        <img className={`MediaHandler ${className}`} src={arrayFiles[name]} alt="" />
    )
}