import { useAlert } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { FormNewDC } from "./FormNewDC";
import { FormNewDocument } from "./FormNewDocument";
import { FormNewFV } from "./FormNewFV";
import { FormNewOc } from "./FormNewOc";
import './SelectTypeNewDoc.css'

export function SelectTpeNewDoc({info,reloadFun}){

    const {popInAlert,popOutAlert} = useAlert();

    const endProcess = ()=>{
        popOutAlert();
        if(reloadFun != undefined){
            reloadFun();
        }
    }

    return(
        <div className="SelectTpeNewDoc">
            <BoldTitle text={'Seleccione documento'}/>
            <div className="gridTypes">

                <div onClick={()=>{
                    popInAlert(<FormNewOc info={info} reloadFun={endProcess}/>)
                }} className="typeDoc">
                    <img src="" alt="" className="typeSerI" />
                    <div className="infoContaier">
                        <strong>Orden de cliente</strong>
                        <span>Añadir una nueva Orden de cliente.</span>
                    </div>
                </div>

                <div onClick={()=>{
                    popInAlert(<FormNewDC info={info} reloadFun={endProcess}/>)
                }} className="typeDoc">
                    <img src="" alt="" className="typeSerI" />
                    <div className="infoContaier">
                        <strong>Orden de compra</strong>
                        <span>Añadir una nueva Orden de compra.</span>
                    </div>
                </div>

                <div onClick={()=>{
                    popInAlert(<FormNewFV info={info} reloadFun={endProcess}/>)
                }} className="typeDoc">
                    <img src="" alt="" className="typeSerI" />
                    <div className="infoContaier">
                        <strong>Factura de venta</strong>
                        <span>Añadir una nueva factura de venta.</span>
                    </div>
                </div>

                <div onClick={()=>{
                    popInAlert(<FormNewDocument type={'consuption'} info={info} reloadFun={endProcess}/>)
                }} className="typeDoc">
                    <img src="" alt="" className="typeSerI" />
                    <div className="infoContaier">
                        <strong>Consumo de inventario</strong>
                        <span>Añadir un nuevo consumo de inventario.</span>
                    </div>
                </div>

            </div>
        </div>
    )
}