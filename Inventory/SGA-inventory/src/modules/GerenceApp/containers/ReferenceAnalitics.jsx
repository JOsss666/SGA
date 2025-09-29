import { useLocation, useParams } from "react-router-dom"
import { PathLocation } from "../componets/PathLocation";
import { SectionTitle } from "../componets/SectionTitle";
import { useEffect, useState } from "react";
import { useAppInfo } from "../../../context/context";
import { postInfo } from "../../../utils/functions";
import { PreviewProduct } from "./alerts/PreviewProduct";
import './ReferenceAnalitics.css'
import { TableMovements } from "./TableMovements";
import { SearchBar } from "../componets/SearchBar";
import { SelectOptions } from "../componets/SelectOptions";
import { CardIndicator } from "../componets/CardIndicator";
import { FormInput } from "../componets/FormInput";
import { WarningForm } from "../componets/WarningForm";


export function ReferenceAnalitics({}){

    const {appInfo} = useAppInfo();
    const location = useLocation();
    const [transactions,setTransactions] = useState([])
    const [loading,setLoading] = useState(false);
    const [rotation,setRotation] = useState();
    const [chartsLoading,setCahrtsLoading] = useState(false);
    const [averageUnits,setAverageUnits] = useState();
    const [sellUnits,setSellUnits] = useState();
    const [initialDate,setInitialDate] = useState();
    const [finalDate,setFinalDate] = useState();
    const [marginUtility,setMarginutility] = useState();
    const params = useParams();

    var info = location.state != null? location.state:{};

    const getTransactions = async()=>{
        setLoading(true);
        let res = await postInfo('/getDepartures',{company_id:appInfo.company_id,product_id:info.product_id});
        console.log(res);
        if(res[0]){
            setTransactions(res[1]);
        }
        setLoading(false);
    }

    const getRotation = async()=>{
        setCahrtsLoading(true);
        let res = await postInfo('/getRotation',{
            company_id:appInfo.company_id,
            product_id:info.product_id,
            initialDate,
            finalDate
        })
        console.log(res);
        setAverageUnits((res[0]+res[1])/2);
        if(res[2] == null){
            res[2] = 0;
        }
        setSellUnits(res[2]);
        if(res[3] != null){
            setMarginutility((((res[3]-res[4])/res[3])*100).toFixed(1));
        }else{
            setMarginutility(0)
        }
        let r = (calcRotation(res[0],res[1],res[2]))
        setRotation(r.toFixed(1));
        setCahrtsLoading(false);
    }

    const calcRotation = (initialBalance,finalBalance,totalCost)=>{
        return(
            totalCost/((initialBalance + finalBalance)/2)
        )
    }

    const columsTrans = ["#","Tienda","Bodega","Destinatario","Unidades","Valor Total","Estado","Fecha"]

    useEffect(()=>{
        getTransactions();
    },[])

    useEffect(()=>{
        if(initialDate != null && initialDate != '' && finalDate!= null && finalDate!= ''){
            getRotation()
        }
    },[initialDate,finalDate])

    return(
        <div className="ReferenceAnalitics appSection">
            <PathLocation/>
            <div className="bodyAnaliticReference">
                <PreviewProduct info={info}/>
                <div className="movementsReference">
                    <div className="menuFilterTable">
                        <FormInput action={setInitialDate} type={"date"} title={"Fecha inicial"} max={finalDate}/>
                        <FormInput action={setFinalDate} type={"date"} title={"Fecha final"} min={initialDate}/>
                        <SearchBar placeholder={"Buscar transacción"}/>
                        <SelectOptions options={[
                            "Fecha Ascendente",
                            "Fecha descendente",
                            "Valor Ascendente",
                            "Valor descendente"
                        ]}/>
                        <SelectOptions options={[
                            "Filtrar",
                        ]}/>
                    </div>
                    <TableMovements type={'transactions'} columns={columsTrans}  movements={transactions}/>
                    <div className="secondaryIndicators">
                        <CardIndicator loading={chartsLoading} children={
                            <div className="inficRot">
                                {rotation != null && (<h6>{rotation}</h6>)}
                                {rotation == null && (
                                    <WarningForm tittle={"Seleccione un periodo para calcular la rotación"}/>
                                )}
                            </div>
                        } info={{
                            title:"Rotación",
                            description:"La rotación de un Inventario representa la eficiencia de uno o varios productos",
                            icon:<i className="fa-solid fa-rotate"/>
                        }}/>
                        <CardIndicator loading={chartsLoading} children={
                            <div className="inficRot">
                                {averageUnits != null && (<h6>{averageUnits}</h6>)}
                                {averageUnits == null && (
                                    <WarningForm tittle={"Seleccione un periodo para calcular el promedio"}/>
                                )}
                            </div>
                        } info={{
                            title:"Unidades promedio",
                            description:"El promedio de unidades durante este periodo",
                            icon:<i className="fa-solid fa-boxes-packing"/>
                        }}/>
                        <CardIndicator loading={chartsLoading} children={
                            <div className="inficRot">
                                {sellUnits != null && (<h6>{sellUnits}</h6>)}
                                {sellUnits == null && (
                                    <WarningForm tittle={"Seleccione un periodo para calcular el promedio"}/>
                                )}
                            </div>
                        } info={{
                            title:"Unidades vendidas",
                            description:"Total de unidades vendidas durante este periodo",
                            icon:<i className="fa-solid fa-cart-shopping"/>
                        }}/>
                        <CardIndicator loading={chartsLoading} children={
                            <div className="inficRot">
                                {marginUtility != null && (<h6>{marginUtility}%</h6>)}
                                {marginUtility == null && (
                                    <WarningForm tittle={"Seleccione un periodo para calcular el margen de ganacia"}/>
                                )}
                            </div>
                        } info={{
                            title:"Margen ganancia",
                            description:"Total de unidades vendidas durante este periodo",
                            icon:<i className="fa-solid fa-hand-holding-dollar"/>
                        }}/>
                    </div>
                </div>
            </div>
        </div>
    )
}