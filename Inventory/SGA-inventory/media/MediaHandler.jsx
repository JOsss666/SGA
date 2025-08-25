
import imgOso1 from './oso5.png'
import imgOso2 from './oso5.png'
import imgOso3 from './oso5.png'
import imgOso4 from './oso5.png'
import imgOso5 from './oso5.png'

export function MediaHandler({name}){

    const arrayFiles = {
        'oso1':imgOso1,
        'oso2':imgOso2,
        'oso3':imgOso3,
        'oso4':imgOso4,
        'oso5':imgOso5,
    }

    return(
        <img src={arrayFiles[name]} alt="" />
    )
}