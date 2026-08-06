import { useEffect,useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import './PreviewDocument.css'
import { postInfo } from "../../../../utils/functions";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { UserCard } from "../../components/UserCard";
import { MoreOptions } from "../../components/MoreOptions";
import { useParams } from "react-router-dom";
import { LoadingAppDataPage } from "../LoadingAppDataPage";
import { AlertsHolder } from "../AlertsHolder";
import { PreviewFile } from "./PreviewFile";
import { getElectronicDocumentOptions } from "../../components/ElectronicDocumentCard";

export function PreviewDocument({doc_id}){

    // Requirements
    const {appInfo} = useAppInfo();
    const {popInAlert} = useAlert();
    const {addNotification} = useNotifications();
    const [docInfo,setDocInfo] = useState({})
    const [attachedServices,setAttacedServices] = useState([]);
    const [attachedFiles,setAttachedFiles] = useState([]);
    const params = useParams();
    const [thirdParyInfo, setThirdPartyInfo] = useState({});
    const [id,setId] = useState(doc_id? doc_id:params.doc_id);
    const [attachedTransactions,setAttachedTransactions] = useState([]);
    const [electronicInvoices,setElectronicInvoices] = useState([]);

    // Control
    const [loading,setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    );

    const formatBytes = (bytes, decimales = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimales < 0 ? 0 : decimales;
        const tamaños = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        // Calculamos el índice del tamaño (0 para bytes, 1 para KB, etc.)
        // Usamos logaritmos para saber a qué potencia de 1024 pertenece el número
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + tamaños[i];
    };

    const iconDocsContainer = {
        "image/jpeg": <i className="fa-solid fa-file-image fileIcon"/>,
        "image/png": <i className="fa-solid fa-file-image fileIcon"/>,
        "image/gif": <i className="fa-solid fa-file-image fileIcon"/>,
        "image/webp": <i className="fa-solid fa-file-image fileIcon"/>,
        "image/svg+xml": <i className="fa-solid fa-file-image fileIcon"/>,
        "application/pdf": <i className="fa-solid fa-file-pdf fileIcon"/>,
        "application/msword": <i className="fa-regular fa-file-word fileIcon"/>,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": <i className="fa-regular fa-file-excel fileIcon"/>,
        "application/vnd.ms-excel": <i className="fa-regular fa-file-excel fileIcon"/>,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": <i className="fa-regular fa-file-excel fileIcon"/>,
        "application/vnd.ms-powerpoint": <i className="fa-solid fa-file-powerpoint fileIcon"/>,
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": <i className="fa-solid fa-file-powerpoint fileIcon"/>,
        "text/plain": <i className="fa-solid fa-file-lines fileIcon"/>,
        "text/csv": <i className="fa-solid fa-file-image fileIcon"/>,
        "application/zip": <i className="fa-solid fa-file-zipper fileIcon"/>,
        "application/x-rar-compressed": <i className="fa-solid fa-file-zipper fileIcon"/>,
        "application/x-7z-compressed": <i className="fa-solid fa-file-zipper fileIcon"/>,
        "video/mp4": <i className="fa-solid fa-photo-film fileIcon"/>,
        "video/mpeg": <i className="fa-solid fa-photo-film fileIcon"/>,
        "video/quicktime": <i className="fa-solid fa-photo-film fileIcon"/>,
        "audio/mpeg":<i className="fa-solid fa-file-audio fileIcon"/>,
        "audio/wav": <i className="fa-solid fa-file-audio fileIcon"/>,
        "application/json": <i className="fa-solid fa-code fileIcon"/>
    };

    const dictionaryDocTypes = {
        "Sell Invoice": "Factura de Venta",
        "Purchase Invoice": "Factura de Compra",
        "Cash Recipt": "Recibo de Caja",
        "Exit Recipt": "Recibo de Egreso",
        "Accounting Recipt": "Comprobante Contable",
        "Debit Note": "Nota Débito",
        "Credit Note": "Nota Crédito",
        "Beginning Balance": "Saldo Inicial",
        "Price Recipt": "Recibo de Precio",
        "Sales Order": "Orden de Venta",
        "Product Shipment": "Envío de Producto",
        "Sales Returns": "Devolución de Venta",
        "Inventory Booking": "Registro de Inventario",
        "Inventory Transfer": "Transferencia de Inventario",
        "Inventory Entry": "Entrada de Inventario",
        "Inventory Out": "Salida de Inventario",
        "Inventory Return": "Devolución de Inventario",
        "Inventory Donation": "Donación de Inventario",
        "Inventory Loss": "Pérdida de Inventario",
        "Inventory Consume": "Consumo de Inventario",
        "Production Order": "Orden de Producción",
        "Client Order": "Pedido de Cliente",
        "Purchase Document": "Documento de Compra",
        "Transaction": "Transacción",
        "Portfolio Adjustment": "Ajuste de Cartera",
        "Bank Deposit": "Depósito Bancario",
        "Purchase Order": "Orden de Compra",
        "Sales Quotation": "Cotización de Venta",
        "Inventory Adjustment": "Ajuste de Inventario",
        "Cost Transfer": "Transferencia de Costos",
        "Payroll Voucher": "Comprobante de Nómina",
        "Payroll Provision": "Provisión de Nómina",
        "Payroll Adjustment": "Ajuste de Nómina",
        "Amortization": "Amortización",
        "Depreciation": "Depreciación",
        "NIIF Adjustment": "Ajuste NIIF",
        "Equivalent Purchase Document": "Documento Equivalente de Compra",
        "Machine use": "Uso de Máquina"
    };


    // Functions
    const getDocumentInfo = async()=>{
        setLoading(true)
        let res = await postInfo('/getDocuments',{
            company_id:appInfo.company_id,
            id:id
        });
        if(res[0]){
            setDocInfo(res[1][0])
        }
        setLoading(false);
    }

    const getThirdParties = async()=>{
        let res = await postInfo('/getThirdParties',{company_id:appInfo.company_id, id:docInfo.thirdParty_id});
        if(res[0]){
            setThirdPartyInfo(res[1][0]);
        }
    }

    const getAttachedDodcs = async(attArray)=>{
        let res = await postInfo('/getAttachedFiles',{
            company_id:appInfo.company_id,
            allowedDocs:attArray
        })
        console.log(res);
        if(res[0]){
            setAttachedFiles(res[1]);
        }
    }

    const getElectronicInvoices = async() => {

        const res = await postInfo('/electronicFacturation/getDocuments',{
                company_id: appInfo.company_id,
                doc_id:id
            }
        );
        console.log('Facturas electronicas: ',res);
        if(res[0]){
            setElectronicInvoices(res[1]);
        }
    };

    const getAttachedTransactions = async(paymentMethod_id)=>{
        setLoading(true);
        let res = await postInfo('/facturation/getTransactionsOfCashRecord',{
            company_id:appInfo.company_id,
            doc_id:docInfo.id
        })
        console.log(res);
        if(res[0]){
            setAttachedTransactions(res[1]);
        }
        setLoading(false);
    }
    

    const getAttachedServices = async()=>{
        let res = await postInfo('/getServiceMovements',{
            company_id:appInfo.company_id,
            doc_id:docInfo.id
        })
        if(res[0]){
            setAttacedServices(res[1])
        }
    }


const getSellInvoiceServices = async(instance_id)=>{
    let res = await postInfo('/getDocuments',{
        company_id:appInfo.company_id,
        instance_id,
        allowedTypes:['Client Order']
    });

    if(!res[0] || res[1].length === 0) return;

    const clientOrder = res[1][0];

    let services = await postInfo('/getServiceMovements',{
        company_id:appInfo.company_id,
        doc_id: clientOrder.id
    });

    if(services[0]){
        setAttacedServices(services[1]);
    }
}
/*
    useEffect(() => {
        const root = document.documentElement; // <html>
        if (darkMode) root.classList.add('dark');
        else root.classList.remove('dark');
    }, [darkMode]);
*/

    useEffect(()=>{
        if(appInfo.company_id != undefined){
            getDocumentInfo();
        }
    },[appInfo])

    useEffect(()=>{
        console.log(docInfo)
        if(docInfo.id != undefined){
            getThirdParties();
            getElectronicInvoices();
            switch(docInfo.document_type){
                case "Cash Recipt": 
                getAttachedTransactions();
                break;
                case "Client Order": 
                getAttachedServices();
                break;
                case "Sell Invoice":
                getSellInvoiceServices(docInfo.instance_id);
                break;
            }
            let attArray = []
            let docsAtt = JSON.parse(typeof(JSON.parse(docInfo.attached)) == "object"? docInfo.attached:"[]");
            console.log(docsAtt)
            if(docsAtt != undefined && docsAtt.length > 0){
                docsAtt.forEach(element => {
                    attArray.push(element.id);
                });
                getAttachedDodcs(attArray)
            }
        }
    },[docInfo])

    return(
        <div className="PreviewDocument">
            {!loading && (
                <>
                    <div className="titleDocContainer">
                        <i className="fa-regular fa-file-lines"/>
                        <BoldTitle text={`${dictionaryDocTypes[docInfo.document_type]} #${docInfo.ownSerial}`}/>
                    </div>
                    <div className="thirdPartyAndCompanyInfo">
                        <UserCard name={thirdParyInfo.names} desc={thirdParyInfo.type} imgSrc={thirdParyInfo.img? thirdParyInfo.img:'https://i.pinimg.com/736x/55/62/fb/5562fb835d1de1ea974bdf0039726208.jpg'}/>
                    </div>
                    {docInfo.description && (
                    <DescriptionSpan text={`Descripción: ${docInfo.description}`}/>
                    )}
                    {docInfo.document_type == 'Client Order' && (
                        <div className="detailsDocument">
                            {attachedServices.length > 0 && attachedServices.map((element,index)=>(
                        <div className="serviceDescriptionCard" key={index}>
                            <UserCard
                                imgSrc={element.service_img}
                                name={element.service_name}
                                desc={element.service_type}
                            />

                        <div className="jobDesc">
                                <span>Unidades</span>
                            <strong>{element.units}</strong>
                        </div>

                        <div className="jobDesc">
                            <span>Descripción</span>
                            <strong>{element.description}</strong>
                        </div>

                        <div className="jobDesc">
                            <span>Fecha</span>
                        <strong>{(element.created_at).substring(0,10)}</strong>
                            </div>
                        </div>
                    ))}
                </div>
            )}
                    {docInfo.document_type == 'Sell Invoice' && (
                        <div className="detailsDocument">
                            {attachedServices.map((element,index)=>(
                                <div className="serviceDescriptionCard" key={index}>
                                    <UserCard imgSrc={element.service_img} name={element.service_name} desc={element.service_type}/>

                                    <div className="jobDesc">
                                        <span>Unidades</span>
                                        <strong>{element.units}</strong>
                                    </div>

                                    <div className="jobDesc">
                                        <span>Descripción</span>
                                        <strong>{element.description}</strong>
                                    </div>

                                    <div className="jobDesc">
                                        <span>Total</span>
                                        <strong>
                            ${Number(element.total).toLocaleString('es-CO', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                                </strong>
                            </div>
                        </div>
                        ))}
                    </div>
                    )}
 
                    {docInfo.document_type == 'Cash Recipt' && attachedTransactions.length > 0 && (
                        <div className="deatialCashRecipt">

                            {attachedTransactions.map((tx,index)=>(
                                <div className="paymentCard" key={index}>
                                    <span className="paymentName">
                                        {tx.payment_name}
                                    </span>

                                    <strong className="paymentValue">
                                        ${Number(tx.total).toLocaleString()}
                                    </strong>
                                </div>
                            ))}

                            <div className="paymentTotalCard">
                                <span>Total</span>
                                <strong>
                                    ${attachedTransactions
                                        .reduce((sum,t)=>sum + Number(t.total),0)
                                        .toLocaleString()}
                                </strong>
                            </div>

                        </div>
                    )}

                    <div className="attachedDocuments"> 
                        <h6>Archivos adjuntos</h6>
                        <div className="attachedDocumentsGrid">
                            {attachedFiles.map((element,index)=>(
                                <div className="attDocCard" key={index} onClick={()=>{
                                    popInAlert(<PreviewFile id={element.id}/>)
                                }}>
                                    {iconDocsContainer[`${element.type}`]}
                                    <strong className="fileName">{element.name}</strong>
                                    <span>{element.type}</span>
                                    <span>{formatBytes(element.size)}</span>
                                    <span>{(element.created_at).substring(0,10)}</span>
                                    <MoreOptions options={[
                                        {text:'Descargar',icon:<i className="fa-solid fa-download"/>},
                                        {text:'Previsualizar',icon:<i className="fa-regular fa-eye"/>},
                                        {text:'Reportar',icon:<i className="fa-regular fa-flag"/>},
                                        {text:'Eliminar',icon:<i className="fa-solid fa-trash-can"/>}
                                    ]}/>
                                </div>
                            ))}
                            {electronicInvoices.map((element,index)=>(
                                <div className="electronicInvoiceCard" key={index}>
                                    <i className="fa-solid fa-file-invoice iconSellInvoice"/>
                                    <h6>Factura electronica {element.number}</h6>
                                    <MoreOptions options={getElectronicDocumentOptions(element, addNotification)}/>
                                </div>
                            ))}
                            {attachedFiles.length == 0 && electronicInvoices.length ==0 && (
                                <div className="noResults">
                                    <strong>
                                        <i className="fa-solid fa-ghost"/>
                                        No hay documentos adjuntos
                                    </strong>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
            {loading && (
                <LoadingAppDataPage/>
            )}
            <AlertsHolder/>
        </div>
    )
}
