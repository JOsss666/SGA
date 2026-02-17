import { urlSer } from '../../../../App';
import { useAppInfo } from '../../../../context/context';
import './CashReciptDesign.css'
import { QRCodeSVG } from 'qrcode.react';

export function CashReciptDesign(){

    const {appInfo} = useAppInfo();

    const qrUrl = `${urlSer}/preview/${appInfo.company_key}/340`;
    return(
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
            <h1 style={{fontSize:"16px"}}>Z&J S.A.S</h1>
            <h3 style={{
                fontSize:"14px",
                fontFamily:"monospace"
            }}>Recibo de caja #349</h3>
            <span style={{margin:"2mm 0",width:"100%",borderBottom:"dashed .5mm #000"}}></span>
            <span style={{fontSize:"12px"}}>Concepto: Servicio de impresión digital</span>
            <span style={{fontSize:"12px"}}>Tercero: José Murillo</span>
            <span style={{margin:"2mm 0",width:"100%",borderBottom:"dashed .5mm #000"}}></span>
            <div style={{
                display:"flex",
                flexDirection:"column",
                padding:"1mm",
                gap:"1mm"
            }}>
                <div style={{display:"flex",fontSize:"12px"}}>
                    <span>EFECTIVO:</span>
                    <strong style={{margin:"auto",marginRight:"0"}}>20.000</strong>
                </div>
                <div style={{display:"flex",fontSize:"12px"}}>
                    <span>TRANSFERENCIA:</span>
                    <strong style={{margin:"auto",marginRight:"0"}}>20.000</strong>
                </div>
            </div>
            <span style={{margin:"4mm 0",width:"100%",borderBottom:"dashed .5mm #000"}}></span>
            <div style={{display:"flex",fontSize:"12px"}}>
            <span>TOTAL:</span>
                <strong style={{margin:"auto",marginRight:"0"}}>20.000</strong>
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
                    value={qrUrl}
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
                }}>Orden de trabajo #349</h3>
            </div>
            
        </div>
    )
}