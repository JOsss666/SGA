import { useEffect, useState, useMemo } from 'react';
import { isElectron, urlSer } from '../../../../App';
import { useAppInfo } from '../../../../context/context';
import './CashReciptDesign.css'
import { QRCodeSVG } from 'qrcode.react';
import { BoldTitle } from '../../components/BoldTitle';
import { moneyFormat, postInfo, printSellInvoice } from '../../../../utils/functions';
import { SearchinList } from '../../components/SearchInList';
import { ButtonMenu } from '../../components/ButtonMenu';
import { printCashRecipt } from '../../../../utils/functions';
import JsBarcode from 'jsbarcode';
import { useRef } from 'react';

export function SellInvoiceDesign(){

    // requirements
    const {appInfo} = useAppInfo();
    const [instances,setInstances] = useState([]);
    const [cashRecipts,setCashRecipts] = useState([]);
    const [instance_id,setInstaceId] = useState();
    const [instanceOwnSerial,setInstanceOwnSerial] = useState();
    const [docInfo,setDocInfo] = useState({});
    const [paymentMethods,setPaymentMethods] = useState([]);
    const [electronInfo,setElectronInfo] = useState({});
    const total = useMemo(() => {
        console.log('///////// ',paymentMethods);
        if(paymentMethods.length == 0) return docInfo.total;
        return paymentMethods.reduce((acc, el) => acc + parseFloat(el.value || 0), 0);
    }, [paymentMethods]);
    const [thirdPartyInfo,setThirdPartyInfo] = useState({});

    // Control
    const barcodeRef = useRef();
    const [stage,setStage] = useState(0);
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [barcodeBase64, setBarcodeBase64] = useState(null);


    // Invoice Info
    const [totalTaxes,setTotalTaxes] = useState(0);
    const [attachedItems,setAttachedItems] = useState([]);
    const [taxes,setTaxes] = useState([]);


    // utils

    const handleTaxes = (items) => {
        const groupedTaxes = items.reduce((acc, item) => {
            if (!item.tax_id) return acc;
            const taxTotal = (item.total * item.tax_rate) / 100;
            if (!acc[item.tax_id]) {
                acc[item.tax_id] = {
                    id: item.tax_id,
                    rate: item.tax_rate,
                    name: item.tax_name,
                    total: taxTotal
                };
            } else {
                acc[item.tax_id].total += taxTotal;
            }
            return acc;
        }, {});
        setTaxes(Object.values(groupedTaxes));
    };

    // Getters of info
    const getInstances = async(allowedInstances,allowedTypes)=>{
        let res = await postInfo('/process/getProcessInstances',{
            company_id:appInfo.company_id,
            status:['active']
        })
        console.log(res);
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                C.push({
                    text:`${element.process_code}#${element.ownSerial}`,
                    value:element
                })
            });
            setInstances(C);
        }
    }

    const getAttachedDocuments = async()=>{
        setDisabled(true)
        setLoading(true)
        let res = await postInfo('/getDocuments',{
            company_id:appInfo.company_id,
            allowedTypes:['Sell Invoice'],
            instance_id
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
                handleSelectDoc(C[0])
            }
            setCashRecipts(C)
        }else(
            setCashRecipts([])
        )
        setLoading(false)
        setDisabled(false)
    }

    const getAttachedTransactions = async()=>{
        setLoading(true);
        let res = await postInfo('/facturation/getTransactionsOfCashRecord',{
            company_id:appInfo.company_id,
            doc_id:docInfo.id
        })
        console.log(res);
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                C.push({
                    name:element.payment_name,
                    value:element.total
                })
            });
            console.log('------> ', C);
            setPaymentMethods(C);
        }else{
            setAttachedItems([])
        }
        setLoading(false);
    }

    const getThirdParties = async()=>{
            let res = await postInfo('/getThirdParties',{company_id:appInfo.company_id, id:docInfo.thirdParty_id});
            if(res[0]){
                setThirdPartyInfo(res[1][0]);
            }
    }

    const getAttachedServices = async(doc_id)=>{
            let res = await postInfo('/getServiceMovements',{
                company_id:appInfo.company_id,
                doc_id
            })
            if(res[0]){
                return(res[1])
            }
        }
    
    const getDocuments = async(instance_id)=>{
        let res = await postInfo('/getDocuments',{
            company_id:appInfo.company_id,
            instance_id,
            thirdParty_id:docInfo.thirdParty_id,
            status:'active',
            // Arreglo temporal de tipo de documentos
            allowedTypes:['Client Order']
        })
        console.log(res)
        if(res[0]){
            let C = [];
            for (const element of res[1]) {
            console.log('Procesando elemento:', element.id);
                let attachedItems = await getAttachedServices(element.id);
                if(attachedItems != undefined){
                    attachedItems.forEach(item => {
                        C.push(item);
                    });
                }
                
            }
            setAttachedItems(C);
        }
    }

    const getElectronInfo = async()=>{
        let res = await postInfo('/electronicFacturation/getDocuments',{
            company_id:appInfo.company_id,
            doc_id:docInfo.id
        });
        console.log(res);
        if(res[0]){
            setElectronInfo(res[1][0]);
        }
    }

    // Functions

    const handleSelectinstance = (element)=>{
        if(element.id != undefined){
            setInstaceId(element.id)
            setInstanceOwnSerial(element.ownSerial)
        }
    }

    const handleSelectDoc = (element)=>{
        console.log(element)
        if(element.id == undefined) return;
        setDocInfo(element);
        setInstaceId(element.instance_id)
        setInstanceOwnSerial(element.instanceOwnSerial)
        setStage(1);
    }

    useEffect(()=>{
        console.log(paymentMethods);
    },[paymentMethods])

    useEffect(()=>{
        console.log(instance_id)
        if(instance_id == undefined && instance_id != '') return;
        getAttachedDocuments();
    },[instance_id])

    useEffect(()=>{
        getInstances();
        getAttachedDocuments();
    },[])

    useEffect(()=>{
        console.log(attachedItems)
        handleTaxes(attachedItems);
    },[attachedItems])

    useEffect(()=>{
        console.log(docInfo)
        if(docInfo.id == undefined) return;
        if(stage == 1){
            getAttachedTransactions();
        };
        getThirdParties()
        getDocuments(docInfo.instance_id);
        getElectronInfo();
    },[docInfo,stage])

    useEffect(()=>{
        let totalTax = 0;
        taxes.forEach(element => {
            totalTax += element.total;
        });
        setTotalTaxes(totalTax);
    },[taxes])

    useEffect(() => {
        if (!instance_id) return;
        if (stage !== 1) return;
        if (!barcodeRef.current) return;

        // Limpia SVG anterior
        barcodeRef.current.innerHTML = '';

        JsBarcode(barcodeRef.current, `1026n${docInfo.instance_id}`, {
            format: "CODE128",
            width: 2,
            height: 60,
            displayValue: false,
            margin: 0
        });

    }, [docInfo, stage]);


    const qrUrl = `https://facturation.sga360.co/preview/Document/${appInfo.company_key}/${docInfo.id}`;
    const qrUrlProcess = `https://facturation.sga360.co/preview/Process/${appInfo.company_key}/${instance_id}`;
    if(stage == 0)return(
        <div className="SelectCashRecipt">
            <BoldTitle text={'Seleccione factura a imprimir'} />  
            <SearchinList title={'Proceso adjunto'} placeHolder={'(Opcional)'} action={handleSelectinstance} list={instances}/>
            <SearchinList title={'Factura de venta'} placeHolder={'Seleccione la Factura de venta a imprimir'} action={handleSelectDoc} list={cashRecipts}/>
        </div>
    )
    if(stage == 1)return(
        <>
        <span className='CashReciptDesign_goBackBtn' onClick={()=>{
            setStage(0);
            setInstaceId();
        }}><i className="fa-solid fa-arrow-left"/>Volver</span>
        <div className="CashReciptDesign_suitElectronOptions">
            {isElectron && (
                <ButtonMenu title={"Imprimir"} noRotate={true} onClick={async()=>{
                    await printSellInvoice({
                        // FormInfo
                        docInfo:{
                            doc_id:docInfo.id,
                            doc_type:docInfo.document_type,
                            instance_id,
                            thirdParty_name:thirdPartyInfo.names,
                            description:docInfo.description,
                            ownSerial:docInfo.ownSerial,
                            total,
                            paymentMethod:paymentMethods,
                            instanceOwnSerial
                        },
                        electronInfo,
                        thirdPartyInfo:thirdPartyInfo,
                        total,
                        totalTaxes,
                        taxes,
                        attachedItems,
                        paymentMethods
                    },appInfo,true)
                    await printSellInvoice({
                        // FormInfo
                        docInfo:{
                            doc_id:docInfo.id,
                            doc_type:docInfo.document_type,
                            instance_id,
                            thirdParty_name:thirdPartyInfo.names,
                            description:docInfo.description,
                            ownSerial:docInfo.ownSerial,
                            total,
                            paymentMethod:paymentMethods,
                            instanceOwnSerial
                        },
                        electronInfo,
                        thirdPartyInfo:thirdPartyInfo,
                        total,
                        totalTaxes,
                        taxes,
                        attachedItems,
                        paymentMethods
                    },appInfo,false)
                }} children={
                    <i className="fa-solid fa-print"/>
                }/>
            )}
            <ButtonMenu title={"Compartir"} noRotate={true} children={
                <i className="fa-solid fa-arrow-up-from-bracket"/>
            }/>
            <ButtonMenu title={"Descargar"} noRotate={true} children={
                <i className="fa-solid fa-download"/>
            }/>
        </div>
        <div className="CashReciptDesign" style={{
            width:"72mm",
            display:"flex",
            flexDirection:'column',
            boxSizing: "border-box",
            padding:"2mm",
            fontFamily:"sans-serif"
        }}>
            <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                marginBottom: "4mm",
                padding: "2mm"
            }}>
                <QRCodeSVG 
                    value={qrUrl} 
                    size={128} // Tamaño en píxeles para el renderizado
                    level={"M"} // Nivel de corrección de errores (M es ideal para térmicas)
                    includeMargin={false}
                    imageSettings={{
                        src: "", // Puedes poner un logo aquí, pero en térmicas no se recomienda
                        excavate: true,
                    }}
                />
            </div>
            <h1 style={{fontSize:"16px"}}>{appInfo.legal_name}</h1>
            <h3 style={{
                fontSize:"14px",
                fontFamily:"monospace"
            }}>Factura de venta #{docInfo.ownSerial}</h3>
            <span style={{margin:"2mm 0",width:"100%",borderBottom:"dashed .5mm #000"}}></span>
            <span style={{fontSize:"12px"}}>Concepto: Servicio de impresión digital</span>
            <span style={{fontSize:"12px"}}>Tercero: {thirdPartyInfo.names}</span>
            <span style={{margin:"2mm 0",width:"100%",borderBottom:"dashed .5mm #000"}}></span>
            <div
    style={{
        width: "100%",
        fontSize: "10px",
        marginTop: "2mm",
        display: "flex",
        flexDirection: "column",
        gap: "1mm"
    }}
>
    <table
            style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed"
            }}
        >
            <thead>
                <tr
                    style={{
                        borderBottom: "solid .3mm #000"
                    }}
                >
                    <th
                        style={{
                            textAlign: "left",
                            width: "40%",
                            paddingBottom: "1mm",
                            fontSize: "10px"
                        }}
                    >ITEM</th>
                    <th
                        style={{
                            textAlign: "center",
                            width: "15%",
                            paddingBottom: "1mm",
                            fontSize: "10px"
                        }}
                    >UND</th>
                    <th
                        style={{
                            textAlign: "right",
                            width: "20%",
                            paddingBottom: "1mm",
                            fontSize: "10px"
                        }}
                    >PRECIO</th>
                    <th
                        style={{
                            textAlign: "right",
                            width: "25%",
                            paddingBottom: "1mm",
                            fontSize: "10px"
                        }}
                    >TOTAL</th>
                </tr>
            </thead>
            <tbody>
                {attachedItems.map((item, index) => {
                    const quantity = Number(item.units || 1);
                    const price = Number(item.unit_value || 0).toFixed(2);
                    const total = Number(parseFloat(item.units) * parseFloat(item.unit_value) || 0).toFixed(2);
                    return (
                        <tr
                            key={index}
                            style={{
                                borderBottom: "dashed .2mm #ccc"
                            }}
                        >
                            <td
                                style={{
                                    padding: "1.5mm 0",
                                    fontSize: "10px",
                                    wordBreak: "break-word",
                                    paddingRight: "1mm"
                                }}
                            >
                                {item.service_name}
                            </td>
                            <td
                                style={{
                                    textAlign: "center",
                                    fontSize: "10px"
                                }}
                            >
                                {quantity}
                            </td>
                            <td
                                style={{
                                    textAlign: "right",
                                    fontSize: "10px",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {moneyFormat(price)}
                            </td>
                            <td
                                style={{
                                    textAlign: "right",
                                    fontSize: "10px",
                                    fontWeight: "bold",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {moneyFormat(total)}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
        </div>
        <span style={{margin:"2mm 0",width:"100%",borderBottom:"dashed .5mm #000"}}></span>
            <div style={{display:"flex",fontSize:"12px"}}>
                <div style={{display:'flex',flexDirection:'column',gap:'10px 0',width:'100%'}}>
                {taxes.map((element,index)=>(
                    <div key={index} style={{display:"flex",fontSize:"12px"}}>
                            <span style={{margin:'auto 0'}}>{element.name} ({element.rate}%):</span>
                            <strong style={{margin:"auto",marginRight:"0"}}>{moneyFormat(element.total)}</strong>
                    </div>
                    ))}
                    <div style={{display:"flex",fontSize:"12px", width:'100%'}}>
                        <span style={{margin:'auto 0',fontSize:"12px"}}>Base impuestos: </span>
                        <strong style={{margin:"auto",marginRight:"0",textAlign:'right'}}>{moneyFormat(total-totalTaxes)}</strong>
                    </div>
                    <div style={{display:"flex",fontSize:"12px", width:'100%'}}>
                        <span style={{margin:'auto 0',fontSize:"12px"}}>TOTAL: </span>
                        <strong style={{margin:"auto",marginRight:"0",textAlign:'right'}}>{moneyFormat(total)}</strong>
                    </div>
                </div>
            </div>
            <span style={{margin:"4mm 0",width:"100%",borderBottom:"dashed .5mm #000"}}></span>
            <div style={{
                display:"flex",
                flexDirection:"column",
                padding:"1mm",
                gap:"1mm"
            }}>
                {paymentMethods.map((element,index)=>(
                    <div key={index} style={{display:"flex",fontSize:"12px"}}>
                        <span>{element.name}:</span>
                        <strong style={{margin:"auto",marginRight:"0"}}>{moneyFormat(element.value)}</strong>
                    </div>
                ))}
            </div>
            <span style={{marginTop:"8mm",width:"100%",borderBottom:"solid .2mm #000"}}></span>
            {instance_id != undefined && (
                <div style={{ 
                    display: "flex",
                    flexDirection:"column",
                    justifyContent: "center", 
                    marginBottom: "4mm",
                    padding: "4mm 2mm"
                }}>
                    <QRCodeSVG 
                        value={qrUrlProcess}
                        size={128} // Tamaño en píxeles para el renderizado
                        level={"M"} // Nivel de corrección de errores (M es ideal para térmicas)
                        includeMargin={false}
                        imageSettings={{
                            src: "", // Puedes poner un logo aquí, pero en térmicas no se recomienda
                            excavate: true,
                        }}
                        style={{
                            margin:"2mm auto"
                        }}
                    />
                    <h3 style={{
                        fontSize:"14px",
                        fontFamily:"monospace",
                        textAlign:"center",
                        marginTop:"2mm"
                    }}>Orden de trabajo #{instanceOwnSerial}</h3>
                </div>
            )}
            {electronInfo.id != undefined && (
                <div style={{ 
                    display: "flex",
                    flexDirection:"column",
                    justifyContent: "center",
                    alignItems:"center",
                    marginBottom: "4mm",
                    padding: "2mm",
                    width:"100%"
                }}>

                    <QRCodeSVG 
                        value={electronInfo.url} 
                        size={138}
                        level={"M"}
                        includeMargin={false}
                    />

                    <h3 style={{
                        fontSize:"10px",
                        fontFamily:"monospace",
                        textAlign:"center",
                        marginTop:"4mm",
                        width:"100%",
                        wordBreak:"break-all",
                        overflowWrap:"break-word",
                        whiteSpace:"normal",
                        lineHeight:"1.3"
                    }}>
                        CUFE: {electronInfo.code}
                    </h3>

                </div>
            )}
            <div style={{ margin: "0 auto", textAlign: "center" }}>
                <svg ref={barcodeRef} style={{
                    width:'50mm',
                    height:'40mm'
                }}></svg>
            </div>
            <div
                style={{
                    width: "100%",
                    padding: "4mm",
                    boxSizing: "border-box",
                    borderRadius:'4mm',
                    outline:'solid .5mm #ddd',
                    display: "flex",
                    alignItems: "center",
                    gap: "4mm",
                }}
                >
                <div
                    style={{
                    width: "22mm",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    }}
                >
                    <img
                    src="https://res.cloudinary.com/djjxugmni/image/upload/v1761582964/ChatGPT_Image_7_sept_2025_16_39_37_pc79hk.png"
                    alt="SGA"
                    style={{
                        width: "100%",
                        height: "25mm",
                        display: "block",
                        objectFit:'cover',
                    }}
                    />
                </div>

                <div
                    style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    }}
                >
                    <span
                    style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        lineHeight: 1.1,
                    }}
                    >
                    SGA 360°
                    </span>

                    <span
                    style={{
                        fontSize: "13px",
                        marginTop: "1mm",
                    }}
                    >
                    SGA Desarrollos.
                    </span>

                    <span
                    style={{
                        fontSize: "12px",
                        marginTop: "2mm",
                    }}
                    >
                    Tel: 321 4221021
                    </span>

                    <span style={{ fontSize: "12px" }}>
                    www.sga360.co
                    </span>
                </div>
                </div>
        </div>
        </>
    )
} 