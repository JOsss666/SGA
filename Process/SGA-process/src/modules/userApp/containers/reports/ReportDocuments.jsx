import { useEffect, useState } from "react";
import { useAppInfo } from "../../../../context/context";
import { postInfo } from "../../../../utils/functions";
import { BoldTitle } from "../../components/BoldTitle";
import { ButtonMenu } from "../../components/ButtonMenu";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { FormButton } from "../../components/FormButton";
import { FormInput } from "../../components/FormInput";
import { PathLocation } from "../../components/PathLocation";
import { SearchBar } from "../../components/SearchBar";
import { SelectOptions } from "../../components/SelectOptions";
import { TableReport } from "../TableReport";
import './ReportDocuments.css'

export function ReportDocuments({type}){

    // Prev Info
    const [info,setInfo] = useState([]);
    const {appInfo} = useAppInfo();

    // Settings Report

    const documentTypes = {
        'OC':'Ordenes de Cliente',
        'OP':'Ordenes de Producción',
        'DC':'Documentos de Compra',
        'CI':'Consumos de inventario',
        'FV':'Facturas de venta'
    }

    const columnsOp = [
        "ID",
        "Tienda",
        "Creada por",
        "Cliente",
        "Ingreso Presupuestado",
        "Costo Presupuestado",
        'Costo Ejecutado',
        'Valor Facturado',
        'Fecha de entrega',
        'Estado'
    ]

    const columnsOc = [
        "ID",
        "OP",
        "Tienda",
        "Creada por",
        "Cliente",
        "Descripción",
        "Ingreso Presupuestado",
        'Costo Presupuestado',
        'Fecha creación',
        'Estado'
    ]

    const columnsDc = [
        "ID",
        "OP",
        "Tienda",
        "Creada por",
        "Cliente",
        "Descripción",
        'Valor',
        'Fecha creación',
        'Estado'
    ]

    const columsDictionary = {
        'OP':columnsOp,
        'OC':columnsOc,
        'DC':columnsDc,
        'FV':columnsDc,
        'CI':columnsDc,
    }

    const settingsReport = {
        columns:columsDictionary[type],
        company_id:appInfo.company_id,
        type
    }

    const GetDocuments = async()=>{
        let res = await postInfo('/process/getDocuments',settingsReport);
        if(res[0]){
            setInfo(res[1])
        }
    }

    useEffect(()=>{
        GetDocuments();
    },[])

    return(
        <div className="ReportDocument">
            <PathLocation/>
            <div className="headReport">
                <BoldTitle text={`Informe de ${documentTypes[type]}`}/>
                <DescriptionSpan text={`Informe del estado de todos los documentos (${type}).`}/>
            </div>
            <div className="settingsReport">
                <SearchBar placeholder={'Buscar'}/>
                <div className="rangeInput">
                    <FormInput type={'date'} title={'Fecha Inicial'}/>
                    <span>-</span>
                    <FormInput type={'date'} title={'Fecha Final'}/>
                </div>
                <SelectOptions options={[
                    'Ascendente (fecha)',
                    'Descendente (fecha)',
                    'Ascendente (Nombre)',
                    'Descendente (Nombre)',
                ]} title={'Orden'}/>
                <ButtonMenu title={'Mas Ajustes'} children={<i className="fa-solid fa-sliders"/>} noRotate={true}/>
                <ButtonMenu title={'Agregar a favoritos'} children={<i className="fa-regular fa-star"/>} noRotate={true}/>
                <FormButton text={'Descargar informe'}/>
            </div>
            <div className="SpaceReport">
                <TableReport columns={settingsReport.columns} info={info} type={type}/>
            </div>
        </div>
    )
}