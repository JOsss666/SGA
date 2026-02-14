import './CashReciptDesign.css'

export function CashReciptDesign(){
    return(
        <div className="CashReciptDesign" style={{
            width:"72mm",
            display:"flex",
            flexDirection:'column',
            boxSizing: "border-box",
            padding:"2mm",
            fontFamily:"sans-serif"
        }}>
            <h3 style={{
                fontSize:"14px",
                fontFamily:"monospace"
            }}>Recibo de caja #349</h3>
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
            <span style={{margin:"2mm 0",width:"100%",borderBottom:"dashed .5mm #000"}}></span>
            <div style={{display:"flex",fontSize:"12px"}}>
            <span>TOTAL:</span>
                <strong style={{margin:"auto",marginRight:"0"}}>20.000</strong>
            </div>
        </div>
    )
}