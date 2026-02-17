import { useAlert } from '../../../context/context'
import { ProgressBar } from '../components/ProgressBar';
import { ProcessStatusAlert } from './Alerts/ProcessStatusAlert';
import './TableReportProcesses.css'

export function TableReportProcesses({settingsReport,info,searchValue}){

    const {popInAlert} = useAlert();

    const formatDate = (date)=>{
        if(date != undefined){
            let x = date.split('T');
            let newDate = `${x[0]}`;
            if(settingsReport.showHour == undefined){
                newDate += ` ${x[1].substring(0,5)}`
            }
            return newDate;
        }
        return `--/--/--`
    }

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
                {info != undefined && info.map((rowInfo,index)=>(
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