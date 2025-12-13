import { ButtonDownload } from '../components/ButtonDownload'
import { SearchBar } from '../components/SearchBar'
import { SelectOptions } from '../components/SelectOptions'
import { TablePrices } from '../components/TablePrices'
import './ListPriceProducts.css'

export function ListPriceProducts({info}){

    const columnsList = [
        'Código','Producto','Proveedor','Categoria','Costo','Precio Venta','Stock','Unidad','Margen','Stock minimo'
    ]

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
            <div className="filtersList">
                <SearchBar placeholder={'Buscar Producto'}/>
                <SelectOptions title={'Filtros'} options={['No','Valor','Fecha']}/>
                <SelectOptions title={'Ordenar'} options={['No','Valor','Fecha']}/>
                <div title='limpiar filtros' className="clearFilters">
                    <i className="fa-solid fa-trash"></i>
                </div>
            </div>
            <div className="tablePrices">
                <TablePrices columns={columnsList} info={info}/>
            </div>
        </div>
    )
}