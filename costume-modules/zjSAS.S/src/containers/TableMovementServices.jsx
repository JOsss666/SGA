import './TableClicks.css'
import { useMemo } from 'react'
import {UserCard} from '../components/UserCard'
import { moneyFormat } from '../../utils/functions'
import { useParams } from 'react-router-dom'
import './TableMovementServices.css'

export function TableMovmentServices({columns,info,disabled,searchValue}){

    const params = useParams();
    console.log(info)

    const filteredInfo = useMemo(() => {
        if (!searchValue || searchValue.trim() === '') {
            return info;
        }

        const lowerSearch = searchValue.toLowerCase();

        return info.filter(element => {

            return (
                element.service_name?.toLowerCase().includes(lowerSearch) ||
                element.service_code?.toLowerCase().includes(lowerSearch) ||
                element.process_code?.toLowerCase().includes(lowerSearch) ||
                element.instance_serial?.toString().toLowerCase().includes(lowerSearch) ||
                element.machine_name?.toLowerCase().includes(lowerSearch) ||
                element.thirdparty_name?.toLowerCase().includes(lowerSearch) ||
                element.machine_model?.toLowerCase().includes(lowerSearch) ||
                element.description?.toLowerCase().includes(lowerSearch)
            );

        });

    }, [info, searchValue]);

    return(
        <div className="TableClicks TableMovmentServices">
            <div className="headTable">
                {columns.map((element,index)=>(
                    <span className="thTitle" key={index}>
                        {element}
                    </span>
                ))}
            </div>
            <div className="bodyTable">
                {filteredInfo.map((element,index)=>(
                    <div className="rowClicks" key={index}>
                        <UserCard name={element.service_name} desc={element.service_code} imgSrc={element.service_img}/>
                        <span className='rowTable redirect idHolder' onClick={()=>{
                            window.open(`https://facturation.sga360.co/preview/Process/${params.company_key}/${element.instance_id}`,'_blank','noopener,noreferrer')
                        }}>{`${element.process_code}#${element.instance_serial}`}</span>
                        <span className='rowTable rightAl'>{element.thirdparty_name}</span>
                        <span className='rowTable rightAl idHolder'>{0}</span>
                        <span className='rowTable rightAl idHolder'>{moneyFormat(parseInt(element.units))}</span>
                        <span className='rowTable rightAl'>{moneyFormat(parseFloat(element.unit_value))}</span>
                        <span className='rowTable rightAl'>{moneyFormat(parseFloat(element.total))}</span>
                        <span className='rowTable '>{element.description}</span>
                        <UserCard name={element.machine_name ? element.machine_name:'---'} desc={element.machine_model? element.machine_model:'---'} imgSrc={element.machine_img}/>
                        <span className='rowTable'>{(element.created_at).substring(0,16)}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
