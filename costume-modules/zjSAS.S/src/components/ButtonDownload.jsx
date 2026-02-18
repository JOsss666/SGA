import { useState } from 'react';
import './ButtonDownload.css';
import { componentToPdf, parseToCsv, parseToXlsx,ScreenShotElement } from '../../../utils/functions';

export function ButtonDownload({info,columns,formats,title,component}) {
    const [status, setStatus] = useState("default");
    const [showMenu, setShowMenu] = useState(false);

    const states = [
        {
            key: "default",
            text: "Descargar",
            icon: <i className="fa-solid fa-arrow-down" />,
            className: "buttonDownloadDefault",
        },
        {
            key: "loading",
            text: "Descargando...",
            icon: <i className="fa-solid fa-spinner fa-spin" />,
            className: "buttonDownloadLoading",
        },
        {
            key: "success",
            text: "Descargado",
            icon: <i className="fa-regular fa-circle-check" />,
            className: "buttonDownloadSuccess",
        },
    ];

    const current = states.find((s) => s.key === status);

    const handleFormatClick = async(format) => {
        if(info != undefined){
            setStatus("loading");
            setShowMenu(false);
            console.log(`Descargando archivo en formato: ${format}`);
            switch (format){
                case "csv": await parseToCsv(info,true,title); break;
                case "xlsx": await parseToXlsx(info,true,null,title);break;
                case "pdf": await componentToPdf(component,true,{},title);break;
                case "jpg": await ScreenShotElement(component,title);
            }
            setStatus("success");
            setTimeout(() => {
                setStatus("default");
            }, 2000);
        }
    };

    return (
        <div className="ButtonDownload">
            <button onClick={() => setShowMenu(!showMenu)} disabled={status === "loading"} className={current.className}> {current.text} {current.icon} </button>

            {showMenu && status === "default" && (
                <div className="downloadMenu">
                    <button className='xlsxFormat' onClick={() => handleFormatClick("xlsx")}><i className="fa-regular fa-file-excel"/> XLSX</button>
                    <button className="csvFormat" onClick={() => handleFormatClick("csv")}><i className="fa-solid fa-file-csv"/> CSV</button>
                    <button className="pdfFormat" onClick={() => handleFormatClick("pdf")}><i className="fa-regular fa-file-pdf"/> PDF</button>
                    <button className="jpgFormat" onClick={() => handleFormatClick("jpg")}><i className="fa-solid fa-image"/>JPG</button>
                </div>
            )}
        </div>
    );
}
