import { useEffect, useState } from "react";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { SearchinList } from "../../components/SearchInList";
import { getNumberingRangesElectronicInvoices, newElectronicSellInvoiceReemision, postInfo } from "../../../../utils/functions";
import './FormEmitElectronicSellInvoice.css'
import { NoResults } from "../NoResults";
import { InvoiceVisualRepresentation } from "../Alerts/documents render/InvoiceVisualRepresentation";
import { WarningForm } from "../../components/WarningForm";
import { FormButton } from "../../components/FormButton";
import { LoadingSpace } from "../LoadingSpace";
import { MoreOptions } from "../../components/MoreOptions";
import { getElectronicDocumentOptions } from "../../components/ElectronicDocumentCard";

export function FormEmitElectronicSellInvoice(){

    // requirements
    const {appInfo,userConfig} = useAppInfo();
    const {popOutAlert} = useAlert();
    const {addNotification} = useNotifications();

    // control
    const [loading,setLoading] = useState(false);
    const [loadingEInfo,setLoadingEinfo] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [aviableInvoices,setAviableInvoices] = useState([]);
    const [invoceInfo,setInvoiceInfo] = useState({});
    const [invoiceElectronicInfo,setInvoiceElectronicInfo] = useState({})
    const [invoiceCheckError,setInvoiceCheckError] = useState(false);
        // Numbering ranges
    const [numberingRange_id,setNumberingRange_id] = useState();
    const [numberingRanges,setNumberingRanges] = useState([]);
    const [numberingRangesBlocked,setNumberingRangesBlocked] = useState(false);

    // Getters of info
    const getInvoices = async()=>{
        setDisabled(true)
        setLoading(true)
        try {
            const res = await postInfo('/getDocuments',{
                company_id:appInfo.company_id,
                allowedTypes:['Sell Invoice'],
            });
            if(res[0]){
                const invoices = res[1].map(element => ({
                    text:`${element.document_type} #${element.ownSerial}`,
                    value:element
                }));
                if(invoices.length === 1) setInvoiceInfo(invoices[0].value);
                setAviableInvoices(invoices);
            }else{
                setAviableInvoices([]);
            }
        } catch(error) {
            setAviableInvoices([])
            addNotification({type:'error', title:'No se pudieron cargar las facturas', description:error?.message ?? 'Intenta nuevamente.'});
        } finally {
            setLoading(false)
            setDisabled(false)
        }
    }

    const getElectronicInfoDocuemnt = async(id)=>{
        setLoadingEinfo(true)
        setDisabled(true)
        setInvoiceCheckError(false)
        try {
            const res = await postInfo('/electronicFacturation/getDocuments',{
                company_id:appInfo.company_id,
                doc_id:id,
                type:'electronic invoice'
            });
            if(res[0] === true){
                setInvoiceElectronicInfo(res[1][0] ?? {});
            }else{
                setInvoiceElectronicInfo({});
            }
        } catch(error) {
            setInvoiceElectronicInfo({});
            setInvoiceCheckError(true);
            setInvoiceInfo({});
            addNotification({type:'error', title:'No se pudo verificar el documento', description:error?.message ?? 'No se consultó el estado de emisión.'});
        } finally {
            setLoadingEinfo(false)
            setDisabled(false)
        }
    }

    const findNumberingPolicy = (obj) => {
        if(!obj || typeof obj !== 'object') return undefined;
        if(obj.electronicFacturation?.numberingRanges) return obj.electronicFacturation.numberingRanges;
        for(const key of Object.keys(obj)){
            const found = findNumberingPolicy(obj[key]);
            if(found) return found;
        }
        return undefined;
    }

     const getInvoiceNumberingRanges = async () => {
        setDisabled(true)
        const policy = userConfig?.services?.sga?.electronicFacturation?.numberingRanges
            ?? findNumberingPolicy(userConfig);
        const enabled = Array.isArray(policy?.enabled) ? policy.enabled.map((v)=>`${v}`) : [];

        let ranges = [];
        try{
            ranges = await getNumberingRangesElectronicInvoices(appInfo?.company_id);
        }catch(error){
            console.error('No fue posible consultar los rangos de numeración:',error);
            setNumberingRangesBlocked(true);
            setDisabled(false);
            return;
        }

        const invoiceRanges = (ranges || []).filter(
            (r)=> r.document === 'Factura de Venta' || r.document_name === 'Factura de Venta'
        );

        // La lista `enabled` es autoritativa: si tiene elementos, solo esos rangos
        // aplican. Sin lista blanca, `overAll` decide (true/sin config => todos).
        let allowed;
        if(enabled.length > 0){
            allowed = invoiceRanges.filter((r)=> enabled.includes(`${r.id ?? r.provider_range_id}`));
        }else if(!policy || policy.overAll === true){
            allowed = invoiceRanges;
        }else{
            allowed = [];
        }

        const options = allowed.map((r)=>({
            text: `${r.document ?? 'Factura de Venta'}${r.prefix ? ` (${r.prefix})` : ''}`,
            value: r
        }));

        setNumberingRanges(options);
        setNumberingRangesBlocked(allowed.length === 0);
        setNumberingRange_id(undefined);

        // Un solo rango permitido => se asume seleccionado y no se muestra el selector.
        if(allowed.length === 1){
            setNumberingRange_id(allowed[0].id ?? allowed[0].provider_range_id);
        }
        setDisabled(false);
    }

    const handleNumberingRangeChange = (range) => {
        setNumberingRange_id(range?.id ?? range?.provider_range_id);
    }

    const handleReemision = async () => {
        if (!invoceInfo?.id || disabled || loadingEInfo || invoiceCheckError) return;
        if (numberingRangesBlocked) {
            addNotification({type:'error', title:'Sin rango de numeración', description:'Tu usuario no tiene un rango de factura electrónica autorizado.'});
            return;
        }
        if (numberingRanges.length > 1 && !numberingRange_id) {
            addNotification({type:'error', title:'Selecciona un rango', description:'Selecciona el rango de numeración para emitir la factura.'});
            return;
        }

        setDisabled(true);
        setLoading(true);
        try {
            const response = await newElectronicSellInvoiceReemision({
                company_id: appInfo.company_id,
                doc_id: invoceInfo.id,
                numbering_range_id:numberingRange_id
            });
            const bill = response?.data?.bill;
            if (response?.status !== 'Created' || !bill) {
                throw new Error(response?.message ?? 'Factus no confirmó la emisión de la factura.');
            }
            setInvoiceElectronicInfo({
                ...(response.electronicDocument ?? {
                    number: bill.number,
                    url: bill.public_url,
                    code: bill.cufe
                }),
                company_id: appInfo.company_id,
                type: 'electronic invoice'
            });
            addNotification({
                type:'aproved',
                title:`Factura electrónica #${bill.number} emitida`,
                description:'La factura quedó asociada al documento de venta.',
                onClick:()=> bill.public_url && window.open(bill.public_url,'_blank','noopener,noreferrer')
            });
        } catch (error) {
            addNotification({
                type:'error',
                title:'No se pudo emitir la factura electrónica',
                description:error?.providerAccepted
                    ? 'Factus aceptó la factura, pero SGA no confirmó su asociación. Vuelve a consultar el documento antes de intentar otra emisión.'
                    : (error?.message ?? 'Intenta nuevamente o consulta el estado de la factura en Factus.')
            });
        } finally {
            setLoading(false);
            setDisabled(false);
        }
    }


    // Events listeners

    useEffect(()=>{
        getInvoices();
    },[])

    useEffect(()=>{
        if(appInfo?.company_id) getInvoiceNumberingRanges();
    },[appInfo?.company_id,userConfig])

    useEffect(()=>{
        if(invoceInfo.id == undefined) return;
        getElectronicInfoDocuemnt(invoceInfo.id);
    },[invoceInfo])


    return(
        <div className="FormEmitElectronicSellInvoice" aria-busy={loading || loadingEInfo}>
            <BoldTitle text={'Emitir factura electronica'}/>
            <DescriptionSpan text={'Seleccióne la factura la cual quiere emitir la factura electronica: '}/>
            <form onSubmit={(e)=>{
                e.preventDefault();
                handleReemision();
            }}>
                <div className="parameters">
                <SearchinList action={(invoice)=>{
                    setInvoiceElectronicInfo({});
                    setInvoiceCheckError(false);
                    setInvoiceInfo(invoice);
                }} title={'Facturas de venta'} disabled={disabled} placeHolder={'Seleccione factura a emitir'} list={aviableInvoices}/>
                <SearchinList action={handleNumberingRangeChange} title={'Rango de numeración'} placeHolder={'Seleccione el rango de numeración'} list={numberingRanges} disabled={numberingRanges.length > 1 ? disabled:true}/>
                </div>
                {numberingRangesBlocked && (
                    <WarningForm tittle={'Sin rango autorizado'} desc={'Tu usuario no tiene un rango de numeración de factura electrónica vigente autorizado.'}/>
                )}
                {!loading && !loadingEInfo && (
                    <div className="InvoiceInfo">
                        {invoceInfo.id == undefined && (
                            <NoResults title={'Seleccione una factura'} img={'https://cdn-icons-png.flaticon.com/512/2432/2432926.png'} />
                        )}
                        {invoceInfo.id != undefined && (
                            <div className="invoicePreview">
                                <InvoiceVisualRepresentation id={invoceInfo.id}/>
                                {invoiceElectronicInfo.number != undefined && (
                                    <>
                                        <div className="reemisionElectronicCard">
                                            <i className="fa-solid fa-file-invoice"/>
                                            <div>
                                                <strong>Factura electrónica</strong>
                                                <span>{invoiceElectronicInfo.number}</span>
                                            </div>
                                            <MoreOptions options={getElectronicDocumentOptions({
                                                ...invoiceElectronicInfo,
                                                company_id: invoiceElectronicInfo.company_id ?? appInfo.company_id
                                            }, addNotification)}/>
                                        </div>
                                        <WarningForm tittle={'Factura ya emitida'} desc={'Este documento ya tiene una factura electronica emitida y validada por la DIAN'}/>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {(loading || loadingEInfo) && (
                    <LoadingSpace title={'Cargando'} description={'Esto no debe tardar mucho...'}/>
                )}
                {invoceInfo.id != undefined && (
                    <div className={`actionsForn ${invoiceElectronicInfo.number != undefined ? 'disabledActionsForm':''}`}>
                        <FormButton type={'button'} negative={true} text={'Cancelar'} disabled={disabled} onClick={()=>{
                            popOutAlert()
                        }}/>
                        <FormButton type={'submit'} disabled={disabled || loading || loadingEInfo || invoiceCheckError || invoiceElectronicInfo.number != undefined || numberingRangesBlocked} loading={loading} text={`${loadingEInfo ? 'Verificando...':loading ? 'Emitiendo...':'Emitir'}`}/>
                    </div>
                )}
                {invoiceCheckError && <WarningForm tittle={'No se pudo verificar'} desc={'Vuelve a seleccionar la factura para consultar si ya tiene una factura electrónica asociada.'}/>}
            </form>
        </div>
    )
}
