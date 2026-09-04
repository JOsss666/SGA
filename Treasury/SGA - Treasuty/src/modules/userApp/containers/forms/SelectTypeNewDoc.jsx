import { useState } from "react";
import { useAlert, useAppInfo } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { FormNewDC } from "./FormNewDC";
import { FormNewDocument } from "./FormNewDocument";
import { FormNewFV } from "./FormNewFV";
import { FormNewOc } from "./FormNewOc";
import './SelectTypeNewDoc.css'
import { SearchBar } from "../../components/SearchBar";
import { FormNewMovement } from "./FormNewMovement";
import { FormNewClientOrder } from "./FormNewClientOrder";
import { FormNewCashRecipt } from "./FormNewCashRecipt";
import { FormSelectMachine } from "../../../../../../../costume-modules/zjSAS.S/src/containers/forms/FormSelectMachine";
import { FormNewInvoice } from "./FormNewInvoice";
import { FormNewBudget } from "./FormNewBudget";

export function SelectTpeNewDoc({info,docType,reloadFun}){
    const {userConfig,appInfo,userInfo} = useAppInfo();
    const {popInAlert,popOutAlert} = useAlert();
    const [searchValue,setSearchVal] = useState('');

    const endProcess = ()=>{
        popOutAlert();
        if(reloadFun != undefined){
            reloadFun();
        }
    }

    const filterOptions = (value) => {
        if (!searchValue) return true; 
            return value.toLowerCase().includes(searchValue.toLowerCase());
    }

    const documents = [
        {title:'Orden de Cliente',docType:'Client Order',img:'https://cdnmain.sga360.co/static/Cuadricula3Documentos_5_she308.webp',alert:<FormNewClientOrder canRepeatServices={true} params={info} reloadFun={endProcess}/>},
        {title:'Factura de venta',docType:'Sell Invoice',img:'https://cdnmain.sga360.co/static/ChatGPT_Image_17_dic_2025_18_27_41_1_a3acbd.webp',alert:<FormNewInvoice info={info} reloadFun={endProcess}/>},
        {title:'Documento de compra',img:'https://cdnmain.sga360.co/static/ChatGPT_Image_17_dic_2025_18_27_41_3_nph10p.webp',alert:<FormNewDC info={info} reloadFun={endProcess}/>},
        {title:'Recibo de caja',docType:'Cash Recipt',img:'https://cdnmain.sga360.co/static/ChatGPT_Image_17_dic_2025_18_27_41_4_ioz7jp.webp',alert:<FormNewCashRecipt InfoParams={info} reloadFun={endProcess} />},
        {title:'Recibo de salida',img:'https://cdnmain.sga360.co/static/ChatGPT_Image_17_dic_2025_18_27_41_5_fvbrtz.webp',alert:<span>No disponible aún</span>},
        {title:'Comprobante contable',img:'https://cdnmain.sga360.co/static/ChatGPT_Image_17_dic_2025_18_27_41_6_uh2t9n.webp',alert:<span>No disponible aún</span>},
        {title:'Nota débito',img:'https://cdnmain.sga360.co/static/ChatGPT_Image_17_dic_2025_18_27_41_7_jpbmlq.webp',alert:<span>No disponible aún</span>},
        {title:'Nota de crédito',img:'https://cdnmain.sga360.co/static/ChatGPT_Image_17_dic_2025_18_27_41_8_bn5s5o.webp',alert:<span>No disponible aún</span>},
        {title:'Presupuesto',docType:'Budget',img:'https://cdnmain.sga360.co/static/Cuadricula3Documentos_5_she308.webp',alert:<FormNewBudget info={info} reloadFun={endProcess}/>},
        {title:'Saldo inicial',img:'https://cdnmain.sga360.co/static/ChatGPT_Image_17_dic_2025_18_27_41_11_xywpmt.webp',alert:<span>No disponible aún</span>},
        {title:'Recibo de precio',img:'https://cdnmain.sga360.co/static/ChatGPT_Image_17_dic_2025_18_27_41_2_vkujiv.webp',alert:<span>No disponible aún</span>},
        {title:'Recibo de precio',img:'https://cdnmain.sga360.co/static/ChatGPT_Image_17_dic_2025_18_27_41_2_vkujiv.webp',alert:<span>No disponible aún</span>},
        {title:'Orden de venta',img:'https://cdnmain.sga360.co/static/Cuadricula2Documentos_1_m60kqy.webp',alert:<span>No disponible aún</span>},
        {title:'Envío de producto',img:'https://cdnmain.sga360.co/static/Cuadricula2Documentos_2_vvohzf.webp',alert:<span>No disponible aún</span>},
        {title:'Devolución de venta',img:'https://cdnmain.sga360.co/static/Cuadricula2Documentos_3_qktrem.webp',alert:<span>No disponible aún</span>},
        {title:'Conteo de inventario',img:'https://cdnmain.sga360.co/static/Cuadricula2Documentos_4_upxtqv.webp',alert:<span>No disponible aún</span>},
        {title:'Transferencia de inventario',img:'https://cdnmain.sga360.co/static/Cuadricula2Documentos_5_lv2weo.webp',alert:<FormNewMovement info={{type:'Inventory Transfer'}}/>},
        {title:'Entrada de mercancia',img:'https://cdnmain.sga360.co/static/Cuadricula2Documentos_6_pqxoh2.webp',alert:<FormNewMovement info={{type:'Inventory Entry'}}/>},
        {title:'Salida de inventario',img:'https://cdnmain.sga360.co/static/Cuadricula2Documentos_8_ueftuc.webp',alert:<FormNewMovement info={{type:'Inventory Out'}}/>},
        {title:'Devolución de inventario',img:'https://cdnmain.sga360.co/static/Cuadricula2Documentos_7_nxrlfb.webp',alert:<span>No disponible aún</span>},
        {title:'Donación de inventario',img:'https://cdnmain.sga360.co/static/Cuadricula2Documentos_9_h3eovd.webp',alert:<span>No disponible aún</span>},
        {title:'Perdida de inventario',img:'https://cdnmain.sga360.co/static/Cuadricula3Documentos_1_bdy63r.webp',alert:<span>No disponible aún</span>},
        {title:'Consumo de inventario',img:'https://cdnmain.sga360.co/static/Cuadricula3Documentos_4_jcodbi.webp',alert:<FormNewMovement info={{type:'Inventory Consume'}}/>},
        {title:'Orden de producción',img:'https://cdnmain.sga360.co/static/Cuadricula3Documentos_3_q2hsc4.webp',alert:<span>No disponible aún</span>},
        {title:'Transacciónes',img:'https://cdnmain.sga360.co/static/Cuadricula3Documentos_6_fvpiav.webp',alert:<span>No disponible aún</span>},
        {title:'Transacciónes',img:'https://cdnmain.sga360.co/static/Cuadricula3Documentos_6_fvpiav.webp',alert:<span>No disponible aún</span>},
        {title:'Seleccionar Maquinaria',docType:'Machine use',img:'https://cdnmain.sga360.co/static/Cuadricula3Documentos_6_fvpiav.webp',alert:<FormSelectMachine instance_id={info?.instance_id} appInfo={appInfo} userConfig={userConfig} popOutAlert={popOutAlert} userInfo={userInfo} reloadFun={endProcess}/>,icon:<i className="fa-solid fa-tractor" />,},
    ]

    const handleAutoSelectDocType = (type)=>{
        const document = documents.find(doc => doc.docType === type);
        // Retornamos el alert si existe, de lo contrario un mensaje por defecto o null
        return document ? document.alert : <span>Documento no encontrado</span>;
    }

    if(docType == undefined){
        return(
            <div className="SelectTpeNewDoc">
                <BoldTitle text={'Seleccione documento'}/>
                <SearchBar placeholder={'Buscar documentos'} action={setSearchVal}/>
                <div className="gridTypes">
                    {documents.map((element,index)=>(
                        <div className={`typeDoc ${!filterOptions(element.title)? 'hiddenDoc':''}`} key={index} onClick={()=>{
                            popInAlert(element.alert)
                        }}>
                            <img src={element.img} alt="" className="typeSerI" />
                            <div className="infoContaier">
                                <strong>{element.title}</strong>
                                <span>Añadir un nuevo {element.title}.</span>
                            </div>
                        </div>
                    ))}

                </div>
            </div>
        )
    }else{
        return  handleAutoSelectDocType(docType);
    }
    
}