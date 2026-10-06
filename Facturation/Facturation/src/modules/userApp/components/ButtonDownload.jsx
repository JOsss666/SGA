import { useState } from 'react';
import './ButtonDownload.css';
import { componentToPdf, parseToCsv, parseToXlsx,ScreenShotElement } from '../../../utils/functions';

export function ButtonDownload({
    info,
    columns,
    formats,
    formatHandlers = {},
    title,
    component,
    xlsxOptions,
    text,
    onDownload,
}) {
    const [status, setStatus] = useState("default");
    const [showMenu, setShowMenu] = useState(false);
    const availableFormats = formats?.length ? formats : ["xlsx", "csv"];
    const formatOptions = {
        xlsx: { label: "XLSX", icon: "fa-regular fa-file-excel" },
        csv: { label: "CSV", icon: "fa-solid fa-file-csv" },
        pdf: { label: "PDF", icon: "fa-regular fa-file-pdf" },
    };

    const states = [
        {
            key: "default",
            text: text? text:'Descargar',
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

    // Descarga con acción personalizada (ej. informe consolidado por periodo).
    const handleCustomDownload = async () => {
        setStatus("loading");
        try {
            await onDownload();
            setStatus("success");
        } catch (e) {
            console.error("Error en la descarga:", e);
            setStatus("default");
            return;
        }
        setTimeout(() => {
            setStatus("default");
        }, 2000);
    };

    const handleFormatClick = async (format) => {
        const customHandler = formatHandlers[format];
        if (!customHandler && info === undefined) return;

        setStatus("loading");
        setShowMenu(false);

        try {
            if (customHandler) {
                await customHandler();
            } else {
                switch (format) {
                    case "csv":
                        await parseToCsv(info, true, title);
                        break;
                    case "xlsx":
                        await parseToXlsx(
                            info,
                            true,
                            columns,
                            title,
                            typeof xlsxOptions === "function" ? xlsxOptions() : xlsxOptions,
                        );
                        break;
                    case "pdf":
                        await componentToPdf(component, true, {}, title);
                        break;
                    case "jpg":
                        await ScreenShotElement(component, title);
                        break;
                    default:
                        setStatus("default");
                        return;
                }
            }

            setStatus("success");
            setTimeout(() => setStatus("default"), 2000);
        } catch (error) {
            console.error("Error en la descarga:", error);
            setStatus("default");
        }
    };

    return (
        <div className="ButtonDownload">
            <button
                type="button"
                onClick={() => onDownload ? handleCustomDownload() : setShowMenu(!showMenu)}
                disabled={status === "loading"}
                className={current.className}
                aria-expanded={showMenu}
                aria-haspopup={onDownload ? undefined : "menu"}
            > {current.text} {current.icon} </button>

            {!onDownload && showMenu && status === "default" && (
                <div className="downloadMenu" role="menu">
                    {availableFormats.map((format) => {
                        const option = formatOptions[format];
                        if (!option) return null;

                        return (
                            <button
                                key={format}
                                type="button"
                                className="optionListFormat"
                                role="menuitem"
                                onClick={() => handleFormatClick(format)}
                            >
                                <i className={option.icon} aria-hidden="true" />
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
