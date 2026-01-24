import { ButtonDownload } from '../components/ButtonDownload'
import { ButtonMenu } from '../components/ButtonMenu'
import { AiButton } from '../components/ChatAiComponents/AiButton'
import { SearchBar } from '../components/SearchBar'
import { SelectOptions } from '../components/SelectOptions'
import { TablePrices } from '../components/TablePrices'
import { FormInput } from '../components/FormInput'
import './ListPriceProducts.css'
import { TableReport } from './TableReport'
import { useState } from 'react'
import { useAppInfo } from '../../../context/context'
import { TablePricesList } from './TablePricesList'

export function ListPriceProducts({info}){
    const {appInfo} = useAppInfo();
    const [searchValue,setSearchValue] = useState("");
    const [initial_date,setInitialDate] = useState();
    const [final_date,setFinalDate] = useState();
    const columnsList = [
        'SKU',
        'Producto',
        'Categoria',
        'Unidades',
        'Costo',
        'Gravado',
        "MOQ",
        'Precio Venta',
        'Margen',
    ]

    const formSettings = {
        initial_date,
        final_date,
        company_id:appInfo.company_id
    }

    const testinfo = [
        {
            list_id:1,
            code:1223,
            product_name:"producto de prueba",
            category_name:"Category",
            unit_cost:120000,
            units:2,
            cost:120000,
            taxed:true,
        },
    ]

    // <TablePrices columns={columnsList} info={info}/>

    return(
        <div className="ListPriceProducts">
            <div className="headDataLsit">
                <div className="informationList">
                    <span>Fecha creación: <strong>{info!=undefined? info.created_at:"29/05/2025"}</strong></span>
                    <span>Implementación: <strong>29/05/2025</strong></span>
                    <span>Creado por: <strong>José Murillo</strong></span>
                    <span>Productos: <strong>2,300</strong></span>
                </div>
                <div className="actionsList">
                    <ButtonDownload title={'Descargar listas'}/>
                </div>
            </div>
            <div className="settingsReport">
                <SearchBar placeholder={"Buscar"} action={setSearchValue}/>
                <div className="rangeInput">
                <FormInput type={"date"} max={final_date} title={"Fecha Inicial"} action={setInitialDate} />
                <span>-</span>
                <FormInput type={"date"} min={initial_date} title={"Fecha Final"} action={setFinalDate}/>
                </div>
                <SelectOptions
                options={[
                    "Ascendente (fecha)",
                    "Descendente (fecha)",
                    "Ascendente (Nombre)",
                    "Descendente (Nombre)",
                ]}
                title={"Orden"}
                />
                <ButtonMenu title={"Mas Ajustes"} children={<i className="fa-solid fa-sliders" />} noRotate={true} />
                <AiButton attached={info} sugerence={[
                    {text:'¿Que representa este informe?',context:``},
                    {text:'Realiza un analisis de este informe',context:``},
                    {text:'¿Que acciones me recomiendas basado en este informe?',context:``}
                ]}/>
            </div>
            <div className="tablePrices">
                <TablePricesList columns={columnsList} info={testinfo}/>
            </div>
        </div>
    )
}