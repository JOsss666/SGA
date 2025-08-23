import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { DespleList } from "../components/DespleList";
import './Reports.css'

export function Reports(){
    return(
        <div className="Reports appSection">
            <div className="headSection">
                <BoldTitle text={'Informes de procesos'}/>
                <DescriptionSpan text={'Selecciona el informe que necesites'}/>
            </div>
            <div className="spaceSelectReports">
                <DespleList children={<i className="fa-solid fa-book"/>} father={{
                    title:'Informes de Documentos'
                }} options={[
                    {title:'Ordenes de cliente (OC)',children:<i className="fa-solid fa-file-contract"/>},
                    {title:'Ordenes de producción (OP)',children:<i className="fa-solid fa-file-lines"/>},
                    {title:'Documentos de compra (DC)',children:<i className="fa-solid fa-file-lines"/>},
                    {title:'Consumos de inventario (CI)',children:<i className="fa-solid fa-file-lines"/>},
                    {title:'Facturas de venta (FV)',children:<i className="fa-solid fa-file-invoice"/>},
                    {title:'Informes adicionales',options:[
                        {title:'Informe Costos Operativos',children:<i className="fa-solid fa-book"/>}
                    ]}
                ]}/>
                <DespleList children={<i className="fa-solid fa-book"/>} father={{
                    title:'Informes por estado'
                }} options={[
                    {title:'Documentos reportados',children:<i className="fa-solid fa-book"/>},
                    {title:'Estado Ordenes de producción',children:<i className="fa-solid fa-file-lines"/>},
                    {title:'Volumen ordenes de clientes',children:<i className="fa-solid fa-file-lines"/>},
                    {title:'Informes adicionales',options:[
                        {title:'Informe Costos Operativos',children:<i className="fa-solid fa-book"/>}
                    ]}
                ]}/>
                <DespleList children={<i className="fa-solid fa-calendar-check"/>} father={{
                    title:'Informes de aplicación'
                }} options={[
                    {title:'Productividad usuarios',children:<i className="fa-solid fa-chart-line"/>},
                    {title:'Eficiencia procesos',children:<i className="fa-solid fa-business-time"/>},
                    {title:'Estado de ejecución',children:<i class="fa-solid fa-list-check"/>}
                ]}/>
            </div>
        </div>
    )
}