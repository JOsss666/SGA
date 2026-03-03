import './TableClicks.css'
import {UserCard} from '../components/UserCard'
import { moneyFormat } from '../../utils/functions'

export function TableClicks({columns,info,disabled}){

    console.log(info)

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
                    <div className="rowClicks" key={index}>
                        <UserCard name={element.asset_name} desc={element.asset_model} imgSrc={element.asset_img}/>
                        <span className='rowTable'>{moneyFormat(parseInt(element.initialClicks))}</span>
                        <span className='rowTable'>{element.responsable}</span>
                        <span className='rowTable'>{element.description}</span>
                        <span className='rowTable'>{(element.created_at).substring(0,16)}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}