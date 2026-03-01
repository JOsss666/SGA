import { useAlert } from '../../../context/context'
import { ProgressBar } from '../components/ProgressBar';
import { ProcessStatusAlert } from './Alerts/ProcessStatusAlert';
import { formatDate } from '../../../utils/functions';
import { useMemo } from 'react';
import './TableReportProcesses.css'

export function TableReportProcesses({settingsReport,info,searchValue}){
    const {popInAlert} = useAlert();

    const filteredInfo = useMemo(() => {
            if (!searchValue?.trim()) return info;
    
            const lower = searchValue.toLowerCase();
    
            return info.filter(row =>
                Object.values(row).some(val =>
                    val?.toString().toLowerCase().includes(lower)
                )
            );
        }, [info, searchValue]);

    const handleElementRow = (column,info)=>{
        let elementsRow = {
            'ID':<span>{info.process_code}#{info.ownSerial}</span>,
            'Proceso':<span>{info.process_name}</span>,
            'Descripción':<span>{info.id}</span>,
            'Tercero':<span>{info.thirdParty_name}</span>,
            'Responsable':<span>{info.responsable_name != undefined? info.responsable_name:'---'}</span>,
            'Etapa':<span>{info.step_name}</span>,
            'Avance':<ProgressBar progress={((info.current_step_order/(info.total_steps - 1))*100).toFixed(1)}/>,
            'Fecha de entrega':<span>{formatDate(info.delivery_date)}</span>,
            'Fecha de inicio':<span>{formatDate(info.start_date)}</span>,
            'Ultima modificación':<span>{formatDate(info.updated_at)}</span>,
            'Estado':<span>{info.status}</span>
        }
        return (elementsRow[column])
    }

    console.log(info)

    return(
        <div className="TableReportProcesses">
            <div className="headTable">
                {settingsReport.columns != undefined && settingsReport.columns.map((element,index)=>(
                    <span className={`TH_${element}`} key={index} >{element}</span>
                ))}
            </div>
            <div className="gridResultsTable">
                {filteredInfo.map((rowInfo,index)=>(
                    <div key={index} className={`RowResults rowStatus_${rowInfo.status}`} onClick={()=>{
                        popInAlert(<ProcessStatusAlert instance_id={rowInfo.id}/>)
                    }}>
                        {settingsReport.columns != undefined && settingsReport.columns.map((element,index)=>(
                            <div key={index} className={`elementRow TH_${element}`}>
                                {handleElementRow(element,rowInfo)}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}