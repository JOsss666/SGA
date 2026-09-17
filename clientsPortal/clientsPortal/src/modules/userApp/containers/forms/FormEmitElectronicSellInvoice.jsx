import { useEffect, useState } from "react";
import { useAlert, useAppInfo } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { SearchinList } from "../../components/SearchInList";
import { postInfo } from "../../../../utils/functions";
import './FormEmitElectronicSellInvoice.css'
import { NoResults } from "../NoResults";
import { SellInvoiceDesign } from "../Alerts/SellInvoiceDesing";
import { InvoiceVisualRepresentation } from "../Alerts/documents render/InvoiceVisualRepresentation";
import { WarningForm } from "../../components/WarningForm";
import { FormButton } from "../../components/FormButton";

export function FormEmitElectronicSellInvoice(){

    // requirements
    const {appInfo} = useAppInfo();
    const {popOutAlert} = useAlert();

    // control
    const [loading,setLoading] = useState(false);
    const [loadingEInfo,setLoadingEinfo] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [aviableInvoices,setAviableInvoices] = useState([]);
    const [invoceInfo,setInvoiceInfo] = useState({});
    const [invoiceElectronicInfo,setInvoiceElectronicInfo] = useState({})

    // Getters of info
    const getInvoices = async()=>{
        setDisabled(true)
        setLoading(true)
        let res = await postInfo('/getDocuments',{
            company_id:appInfo.company_id,
            allowedTypes:['Sell Invoice'],
        })
        console.log(res)
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                C.push({
                    text:`${element.document_type} #${element.ownSerial}`,
                    value:element
                })
            });
            if(C.length == 1){
                console.log('Auto select de ',C[0])
                setInvoiceInfo(C[0].value)
            }
            setAviableInvoices(C)
        }else(
            setAviableInvoices([])
        )
        setLoading(false)
        setDisabled(false)
    }

    const getElectronicInfoDocuemnt = async(id)=>{
        setDisabled(true)
        let res = await postInfo('/electronicFacturation/getDocuments',{
            company_id:appInfo.company_id,
            doc_id:id
        });
        if(res[0] === true){
            setInvoiceElectronicInfo(res[1][0]);
        }
        console.log('EDoc info: ',res);
        setDisabled(false)
    }


    // Events listeners

    useEffect(()=>{
        getInvoices();
    },[])

    useEffect(()=>{
        if(invoceInfo.id == undefined) return;
        getElectronicInfoDocuemnt(invoceInfo.id);
    },[invoceInfo])


    return(
        <div className="FormEmitElectronicSellInvoice">
            <BoldTitle text={'Emitir factura electronica'}/>
            <DescriptionSpan text={'Seleccióne la factura la cual quiere emitir la factura electronica: '}/>
            <form onSubmit={(e)=>{
                e.preventDefault();
                console.warn('Emitiendo factura electronica de...')
            }}>
                <SearchinList action={setInvoiceInfo} title={'Facturas de venta'} disabled={disabled} placeHolder={'Seleccione factura a emitir'} list={aviableInvoices}/>
                <div className="InvoiceInfo">
                    {invoceInfo.id == undefined && (
                        <NoResults title={'Seleccione una factura'} img={'https://cdn-icons-png.flaticon.com/512/2432/2432926.png'} />
                    )}
                    {invoceInfo.id != undefined && (
                        <div className="invoicePreview">
                            <InvoiceVisualRepresentation id={invoceInfo.id}/>
                            {invoiceElectronicInfo.number != undefined && (
                                <WarningForm tittle={'Factura ya emitida'} desc={'Este documento ya tiene una factura electronica emitida y validada por la DIAN'}/>
                            )}
                        </div>
                    )}
                </div>
                {invoceInfo.id != undefined && (
                    <div className={`actionsForn ${invoiceElectronicInfo.number != undefined ? 'disabledActionsForm':''}`}>
                        <FormButton negative={true} text={'Cancelar'} disabled={disabled} onClick={()=>{
                            popOutAlert()
                        }}/>
                        <FormButton disabled={disabled} text={`${loadingEInfo ? 'Verificando...':'Emitir'}`} onClick={()=>{

                        }}/>
                    </div>
                )}
            </form>
        </div>
    )
}