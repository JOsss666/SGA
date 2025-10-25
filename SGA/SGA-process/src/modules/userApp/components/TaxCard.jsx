import { moneyFormat } from "../../../utils/functions";
import { MoreOptions } from "./MoreOptions";
import { TagIndicator } from "./TagIndicator";
import './TaxCard.css'

export function TaxCard({hidden,info}){
    if(!hidden){
        return(
            <div className="TaxCard">
                <TagIndicator title={`# ${info.tax_id}`} type={'indicator'}/>
                <strong>{info.name}</strong>
                <TagIndicator title={`${info.rate}%`} type={'active'} desc={`Tasa de impuesto: ${info.rate}%`}/>
                <TagIndicator title={`$ ${moneyFormat(info.base)}`} desc={`Base de cobro del impuesto: $ ${moneyFormat(info.base)}`}/>
                <MoreOptions options={[
                    {text:'Editar',icon:<i className="fa-solid fa-pencil"/>},
                    {text:'Eliminar',icon:<i class="fa-solid fa-trash"></i>},
                    {text:'Ver estadisticas',icon:<i className="fa-solid fa-chart-column"/>},
                    {text:'Ver movimientos',icon:<i className="fa-solid fa-eye"/>}
                ]}/>
            </div>
        )
    }
}