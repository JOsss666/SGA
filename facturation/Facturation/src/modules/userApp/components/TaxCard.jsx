import { useAlert, useNotifications } from "../../../context/context";
import { moneyFormat, postInfo } from "../../../utils/functions";
import { FormNewTax } from "../containers/forms/FormNewTax";
import { MoreOptions } from "./MoreOptions";
import { TagIndicator } from "./TagIndicator";
import './TaxCard.css'

export function TaxCard({hidden,info,reloadFun}){

    const {addNotification} = useNotifications();
    const {popInAlert} = useAlert();

    const deleteTax = async()=>{
        let res = await postInfo('/deleteTax',{
            taxes:[info.id]
        })
        if(res){
            addNotification({
                type:'aproved',
                title:'Impuesto Eliminado',
                description:`Se ha eliminado el impuesto ${info.name}.`
            })
            if(reloadFun != undefined){
                reloadFun();
            }
        }else{
            addNotification({
                type:'error',
                title:'Error al eliminar impuesto',
                description:`Hubo un error al intentar eliminar el impuesto ${info.name}.`
            })
        }
    }

    const editTax = ()=>{
        popInAlert(
            <FormNewTax/>
        )
    }

    if(!hidden){
        return(
            <div className="TaxCard">
                <TagIndicator title={`# ${info.tax_id}`} type={'indicator'}/>
                <strong>{info.name}</strong>
                <TagIndicator title={`${info.rate}%`} type={'active'} desc={`Tasa de impuesto: ${info.rate}%`}/>
                <TagIndicator title={`$ ${moneyFormat(info.base)}`} desc={`Base de cobro del impuesto: $ ${moneyFormat(info.base)}`}/>
                <MoreOptions options={[
                    {text:'Editar',icon:<i className="fa-solid fa-pencil"/>,action:editTax},
                    {text:'Eliminar',icon:<i class="fa-solid fa-trash"></i>,action:deleteTax},
                    {text:'Ver estadisticas',icon:<i className="fa-solid fa-chart-column"/>},
                    {text:'Ver movimientos',icon:<i className="fa-solid fa-eye"/>}
                ]}/>
            </div>
        )
    }
}