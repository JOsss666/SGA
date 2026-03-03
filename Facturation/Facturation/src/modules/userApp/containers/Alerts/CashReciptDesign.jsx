import { useEffect, useState, useMemo } from 'react';
import { isElectron, urlSer } from '../../../../App';
import { useAppInfo } from '../../../../context/context';
import './CashReciptDesign.css'
import { QRCodeSVG } from 'qrcode.react';
import { BoldTitle } from '../../components/BoldTitle';
import { moneyFormat, postInfo } from '../../../../utils/functions';
import { SearchinList } from '../../components/SearchInList';
import { ButtonMenu } from '../../components/ButtonMenu';
import { printCashRecipt } from '../../../../utils/functions';
import JsBarcode from 'jsbarcode';
import { useRef } from 'react';

export function CashReciptDesign(){

    // requirements
    const {appInfo} = useAppInfo();
    const [instances,setInstances] = useState([]);
    const [cashRecipts,setCashRecipts] = useState([]);
    const [instance_id,setInstaceId] = useState();
    const [instanceOwnSerial,setInstanceOwnSerial] = useState();
    const [docInfo,setDocInfo] = useState({});
    const [paymentMethods,setPaymentMethods] = useState([]);
    const total = useMemo(() => {
        return paymentMethods.reduce((acc, el) => acc + parseFloat(el.value || 0), 0);
    }, [paymentMethods]);
    const [thirdPartyInfo,setThirdPartyInfo] = useState({});

    // Control
    const barcodeRef = useRef();
    const [stage,setStage] = useState(0);
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [barcodeBase64, setBarcodeBase64] = useState(null);


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
        console.log({
            company_id:appInfo.company_id,
            allowedTypes:['Cash recipt'],
            instance_id
        })
        let res = await postInfo('/getDocuments',{
            company_id:appInfo.company_id,
            allowedTypes:['Cash Recipt'],
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
            setPaymentMethods(C);
        }
        setLoading(false);
    }

    const getThirdParties = async()=>{
            let res = await postInfo('/getThirdParties',{company_id:appInfo.company_id, id:docInfo.thirdParty_id});
            if(res[0]){
                setThirdPartyInfo(res[1][0]);
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
        setStage(1);
    }

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
        if(docInfo.id == undefined) return;
        getAttachedTransactions();
        getThirdParties()
    },[docInfo])

    useEffect(() => {
        if (!instance_id) return;
        if (stage !== 1) return;
        if (!barcodeRef.current) return;

        // Limpia SVG anterior
        barcodeRef.current.innerHTML = '';

        JsBarcode(barcodeRef.current, `1026n${instance_id}`, {
            format: "CODE128",
            width: 2,
            height: 60,
            displayValue: false,
            margin: 0
        });

    }, [instance_id, stage]);


    const qrUrl = `https://facturation.sga360.co/preview/Document/${appInfo.company_key}/${docInfo.id}`;
    const qrUrlProcess = `https://facturation.sga360.co/preview/Process/${appInfo.company_key}/${instance_id}`;
    if(stage == 0)return(
        <div className="SelectCashRecipt">
            <BoldTitle text={'Seleccione recibo a imprimir'} />  
            <SearchinList title={'Proceso adjunto'} placeHolder={'(Opcional)'} action={handleSelectinstance} list={instances}/>
            <SearchinList title={'Recibo de caja'} placeHolder={'Seleccione el recibo de caja a imprimir'} action={handleSelectDoc} list={cashRecipts}/>
        </div>
    )
    if(stage == 1)return(
        <>
        <span className='CashReciptDesign_goBackBtn' onClick={()=>{
            setStage(0);
        }}><i className="fa-solid fa-arrow-left"/>Volver</span>
        <div className="CashReciptDesign_suitElectronOptions">
            {isElectron && (
                <ButtonMenu title={"Imprimir"} noRotate={true} onClick={async()=>{
                    await printCashRecipt({
                        // FormInfo
                        doc_id:docInfo.id,
                        doc_type:docInfo.document_type,
                        instance_id,
                        thirdParty_name:thirdPartyInfo.names,
                        description:docInfo.description,
                        ownSerial:docInfo.ownSerial,
                        total,
                        paymentMethod:paymentMethods,
                        instanceOwnSerial
                    },appInfo,true)
                    await printCashRecipt({
                        // FormInfo
                        doc_id:docInfo.id,
                        doc_type:docInfo.document_type,
                        instance_id,
                        thirdParty_name:thirdPartyInfo.names,
                        description:docInfo.description,
                        ownSerial:docInfo.ownSerial,
                        total,
                        paymentMethod:paymentMethods,
                        instanceOwnSerial
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
            }}>Recibo de caja #{docInfo.ownSerial}</h3>
            <span style={{margin:"2mm 0",width:"100%",borderBottom:"dashed .5mm #000"}}></span>
            <span style={{fontSize:"12px"}}>Concepto: Servicio de impresión digital</span>
            <span style={{fontSize:"12px"}}>Tercero: {thirdPartyInfo.names}</span>
            <span style={{margin:"2mm 0",width:"100%",borderBottom:"dashed .5mm #000"}}></span>
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
            <span style={{margin:"4mm 0",width:"100%",borderBottom:"dashed .5mm #000"}}></span>
            <div style={{display:"flex",fontSize:"12px"}}>
            <span>TOTAL:</span>
                <strong style={{margin:"auto",marginRight:"0"}}>{moneyFormat(total)}</strong>
            </div>
            <span style={{marginTop:"8mm",width:"100%",borderBottom:"solid .2mm #000"}}></span>
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