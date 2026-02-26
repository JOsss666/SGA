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
        {title:'Orden de Cliente',docType:'Client Order',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766076220/Cuadricula3Documentos_5_she308.png',alert:<FormNewClientOrder canRepeatServices={true} params={info} reloadFun={endProcess}/>},
        {title:'Factura de venta',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766014163/ChatGPT_Image_17_dic_2025_18_27_41_1_a3acbd.png',alert:<FormNewFV info={info} reloadFun={endProcess}/>},
        {title:'Documento de compra',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766072385/ChatGPT_Image_17_dic_2025_18_27_41_3_nph10p.png',alert:<FormNewDC info={info} reloadFun={endProcess}/>},
        {title:'Recibo de caja',docType:'Cash Recipt',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766072385/ChatGPT_Image_17_dic_2025_18_27_41_4_ioz7jp.png',alert:<FormNewCashRecipt InfoParams={info} reloadFun={endProcess} />},
        {title:'Recibo de salida',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766072385/ChatGPT_Image_17_dic_2025_18_27_41_5_fvbrtz.png',alert:<span>No disponible aún</span>},
        {title:'Comprobante contable',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766072385/ChatGPT_Image_17_dic_2025_18_27_41_6_uh2t9n.png',alert:<span>No disponible aún</span>},
        {title:'Nota débito',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766072386/ChatGPT_Image_17_dic_2025_18_27_41_7_jpbmlq.png',alert:<span>No disponible aún</span>},
        {title:'Nota de crédito',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766072386/ChatGPT_Image_17_dic_2025_18_27_41_8_bn5s5o.png',alert:<span>No disponible aún</span>},
        {title:'Saldo inicial',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766072387/ChatGPT_Image_17_dic_2025_18_27_41_11_xywpmt.png',alert:<span>No disponible aún</span>},
        {title:'Recibo de precio',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766072385/ChatGPT_Image_17_dic_2025_18_27_41_2_vkujiv.png',alert:<span>No disponible aún</span>},
        {title:'Recibo de precio',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766072385/ChatGPT_Image_17_dic_2025_18_27_41_2_vkujiv.png',alert:<span>No disponible aún</span>},
        {title:'Orden de venta',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766075161/Cuadricula2Documentos_1_m60kqy.png',alert:<span>No disponible aún</span>},
        {title:'Envío de producto',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766075162/Cuadricula2Documentos_2_vvohzf.png',alert:<span>No disponible aún</span>},
        {title:'Devolución de venta',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766075162/Cuadricula2Documentos_3_qktrem.png',alert:<span>No disponible aún</span>},
        {title:'Conteo de inventario',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766075163/Cuadricula2Documentos_4_upxtqv.png',alert:<span>No disponible aún</span>},
        {title:'Transferencia de inventario',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766075162/Cuadricula2Documentos_5_lv2weo.png',alert:<FormNewMovement info={{type:'Inventory Transfer'}}/>},
        {title:'Entrada de mercancia',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766075163/Cuadricula2Documentos_6_pqxoh2.png',alert:<FormNewMovement info={{type:'Inventory Entry'}}/>},
        {title:'Salida de inventario',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766075210/Cuadricula2Documentos_8_ueftuc.png',alert:<FormNewMovement info={{type:'Inventory Out'}}/>},
        {title:'Devolución de inventario',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766075186/Cuadricula2Documentos_7_nxrlfb.png',alert:<span>No disponible aún</span>},
        {title:'Donación de inventario',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766075211/Cuadricula2Documentos_9_h3eovd.png',alert:<span>No disponible aún</span>},
        {title:'Perdida de inventario',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766076215/Cuadricula3Documentos_1_bdy63r.png',alert:<span>No disponible aún</span>},
        {title:'Consumo de inventario',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766076220/Cuadricula3Documentos_4_jcodbi.png',alert:<FormNewMovement info={{type:'Inventory Consume'}}/>},
        {title:'Orden de producción',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766076216/Cuadricula3Documentos_3_q2hsc4.png',alert:<span>No disponible aún</span>},
        {title:'Transacciónes',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766076220/Cuadricula3Documentos_6_fvpiav.png',alert:<span>No disponible aún</span>},
        {title:'Transacciónes',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766076220/Cuadricula3Documentos_6_fvpiav.png',alert:<span>No disponible aún</span>},
        {title:'Seleccionar Maquinaria',docType:'Machine use',img:'https://res.cloudinary.com/djjxugmni/image/upload/v1766076220/Cuadricula3Documentos_6_fvpiav.png',alert:<FormSelectMachine instance_id={info?.instance_id} appInfo={appInfo} userConfig={userConfig} popOutAlert={popOutAlert} userInfo={userInfo}/>,icon:<i className="fa-solid fa-tractor"/>},
    ]

    const handleAutoSelectDocType = (type)=>{
        console.log('Encontrando tipo: ',type)
        const document = documents.find(doc => doc.docType === type);
        console.log('Formulario entontrado: ',document);
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