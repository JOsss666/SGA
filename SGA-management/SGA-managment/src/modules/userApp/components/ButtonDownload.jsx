import { useState } from 'react';
import './ButtonDownload.css';

export function ButtonDownload() {
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

    const handleFormatClick = (format) => {
        setStatus("loading");
        setShowMenu(false);

        console.log(`Descargando archivo en formato: ${format}`);

        setTimeout(() => {
            setStatus("success");
            setTimeout(() => setStatus("default"), 2000); 
        }, 2000);
    };

    return (
        <div className="ButtonDownload">
            <button onClick={() => setShowMenu(!showMenu)} disabled={status === "loading"} className={current.className}> {current.text} {current.icon} </button>

            {showMenu && status === "default" && (
                <div className="downloadMenu">
                    <button onClick={() => handleFormatClick("xlsx")}><i className="fa-regular fa-file"/> XLSX</button>
                    <button onClick={() => handleFormatClick("csv")}><i className="fa-regular fa-file"/> CSV</button>
                </div>
            )}
        </div>
    );
}
