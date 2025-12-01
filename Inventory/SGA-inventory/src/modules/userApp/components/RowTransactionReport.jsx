
import { moneyFormat } from '../../../utils/functions'
import './RowTransactionReport.css'

export function RowTransactionReport({info}){
    return(
        <div className="RowTransactionReport">
            <span>{`${info.type=='departure'?'S':'E'}_`+info.transaction_id}</span>
            <span>{info.store_id}</span>
            <span>{info.cellar_id}</span>
            <span>{info.third_party_id}</span>
            <span>{info.type == "departure"? '-':''}{info.units}</span>
            <span>$ {moneyFormat(info.value)}</span>
            <span>{info.status}</span>
            <span>{(info.created_at).substring(0,10)}</span>
            <span><i className="fa-regular fa-pen-to-square"/></span>
        </div>
    )
}