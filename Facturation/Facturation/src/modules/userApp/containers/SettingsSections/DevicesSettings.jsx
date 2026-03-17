import { BoldTitle } from "../../components/BoldTitle";
import { PathLocation } from "../../components/PathLocation";
import { isElectron } from "../../../../App";
import { useEffect, useState } from "react";
import { NoResults } from "../NoResults";
import { scanDevices } from "../../../../utils/functions";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import "./DevicesSettings.css"
import { LoadingSpace } from "../LoadingSpace";

export function DevicesSettings(){

    const [printerList,setPrinterList] = useState([]);
    const [loading, setLoading] = useState(false);

    // Getters of info
    const getPrinters = async () => {
        setLoading(true);
        const printers = await scanDevices();
        setPrinterList(printers);
        setLoading(false);
    }

    useEffect(()=>{
        console.log(printerList)
    },[printerList])

    useEffect(()=>{
        getPrinters();
    },[])

    if(isElectron)return(
        <div className="DevicesSettings">
            {!loading && (
                <div className="gridDevicesTypesContainer">
                    {printerList.length>0 && (
                        <div className="deviceTypeGrid">
                            <DescriptionSpan text={'Impresoras'}/>
                            <div className="gridDevices">
                                {printerList.map((printer,index)=>(
                                    <div className={`deviceCard ${printer.status_label}_cardState`} key={index}>
                                        <img src="https://res.cloudinary.com/djjxugmni/image/upload/v1773773820/Gemini_Generated_Image_nw3p98nw3p98nw3p_2_bxd2n2.png" alt={printer.name} />
                                        <div className="infoDevice">
                                            <strong>{printer.name}</strong>
                                            <span>{printer.description? printer.description : 'Sin descripción'}</span>
                                        </div>
                                        <div className={`statusIndicator ${printer.status_label}_statusIndicator`}/>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                </div>
            )}
            {loading && (
                <LoadingSpace title={'Cargando dispositivos'} description={'Esto puede tardar un poco...'}/>
            )}
        </div>
    );else return(
        <NoResults title={'No es posible acceder a tus disposivos fisicos desde la nube'}/>
    )
}