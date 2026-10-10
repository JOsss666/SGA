import { useEffect, useRef, useState } from "react"
import { uploadFiles } from '../../../utils/functions'
import './FileInput.css'
import { useAppInfo } from "../../../context/context";

// --- Helpers ---------------------------------------------------------------

// Un valor subido puede ser un string (url) o un objeto { url, id, ... }.
const getUrl = (entry) => (typeof entry === 'string' ? entry : entry?.url ?? '');

const getFileName = (entry) => {
    if (entry?.file?.name) return entry.file.name;
    if (entry?.name) return entry.name;
    const url = getUrl(entry);
    if (!url) return 'Archivo';
    try {
        const clean = url.split('?')[0].split('#')[0];
        const base = clean.substring(clean.lastIndexOf('/') + 1);
        return decodeURIComponent(base) || 'Archivo';
    } catch {
        return 'Archivo';
    }
};

const formatSize = (bytes) => {
    if (bytes == null || Number.isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
};

const getFileIcon = (name = '') => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'fa-file-pdf';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif'].includes(ext)) return 'fa-file-image';
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'fa-file-video';
    if (['doc', 'docx'].includes(ext)) return 'fa-file-word';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'fa-file-excel';
    if (['zip', 'rar', '7z'].includes(ext)) return 'fa-file-zipper';
    return 'fa-file-lines';
};

let uidCounter = 0;
const nextId = () => `file-${Date.now()}-${uidCounter++}`;

// --- Component -------------------------------------------------------------

export function FileInput({
    action,
    disabled,
    setDisabled,
    placeholder,
    children,
    multiple,
    includeFiles = false,
    value,
    category = 'others',      // carpeta destino en R2: assets | files | thirdPartiesDocs | others
    storeId,                  // opcional: sube bajo la tienda en vez del nivel compañía
    accept,                   // opcional: restringe el selector de archivos (ej. "image/*,.pdf")
    hint,                     // opcional: texto de formatos/tamaño permitidos
}) {
    const { appInfo, userInfo } = useAppInfo();
    const inRef = useRef();
    const itemsRef = useRef([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const applyItems = (next) => {
        itemsRef.current = next;
        setItems(next);
    };

    // Mantiene en sincronía los archivos cuando el padre controla el valor,
    // sin pisar las subidas que estén en curso.
    useEffect(() => {
        if (!Array.isArray(value)) return;
        const current = itemsRef.current;
        const uploading = current.filter((item) => item.status === 'uploading');
        const doneUrls = current
            .filter((item) => item.status === 'done')
            .map((item) => getUrl(item.payload))
            .join('|');
        const valueUrls = value.map(getUrl).join('|');
        if (doneUrls === valueUrls) return; // ya está sincronizado

        const doneItems = value.map((entry) => ({
            id: nextId(),
            name: getFileName(entry),
            sizeLabel: '',
            status: 'done',
            payload: entry,
        }));
        applyItems([...doneItems, ...uploading]);
    }, [value]);

    const emit = (list) => {
        if (action == null) return;
        const payloads = list
            .filter((item) => item.status === 'done')
            .map((item) => item.payload);
        action(multiple ? payloads : payloads.slice(0, 1));
    };

    const openPicker = () => {
        if (disabled || loading) return;
        inRef.current?.click();
    };

    const handleFiles = async (fileList) => {
        const files = Array.from(fileList || []);
        if (files.length === 0) return;

        const selected = multiple ? files : files.slice(0, 1);
        const tempItems = selected.map((file) => ({
            id: nextId(),
            name: file.name,
            sizeLabel: formatSize(file.size),
            status: 'uploading',
            payload: null,
            file,
        }));

        // En modo single, la nueva selección reemplaza; en multiple, se acumula.
        const base = multiple ? itemsRef.current : [];
        applyItems([...base, ...tempItems]);

        setDisabled?.(true);
        setLoading(true);

        try {
            const res = await uploadFiles(selected, {
                company_id: appInfo.company_id,
                user_id: userInfo.user_id,
                category,
                ...(storeId != undefined ? { store_id: storeId } : {}),
            });
            const uploaded = Array.isArray(res?.urls) ? res.urls : [];
            const tempIds = new Set(tempItems.map((item) => item.id));
            const rest = itemsRef.current.filter((item) => !tempIds.has(item.id));

            const doneItems = tempItems.map((temp, index) => {
                const uploadedFile = uploaded[index];
                const payloadBase = typeof uploadedFile === 'string'
                    ? { url: uploadedFile }
                    : (uploadedFile ?? {});
                return {
                    ...temp,
                    status: uploadedFile != null ? 'done' : 'error',
                    payload: includeFiles ? { ...payloadBase, file: temp.file } : uploadedFile,
                };
            });

            const next = [...rest, ...doneItems];
            applyItems(next);
            emit(next);
        } catch (error) {
            console.error('Error al subir los archivos:', error);
            const tempIds = new Set(tempItems.map((item) => item.id));
            applyItems(itemsRef.current.map((item) => (
                tempIds.has(item.id) ? { ...item, status: 'error' } : item
            )));
        } finally {
            setLoading(false);
            setDisabled?.(false);
        }
    };

    const removeItem = (id) => {
        const next = itemsRef.current.filter((item) => item.id !== id);
        applyItems(next);
        emit(next);
    };

    const onDrop = (event) => {
        event.preventDefault();
        setDragActive(false);
        if (disabled || loading) return;
        handleFiles(event.dataTransfer?.files);
    };

    return (
        <div className={`FileInput${dragActive ? ' isDragging' : ''}${disabled ? ' isDisabled' : ''}`}>
            <input
                ref={inRef}
                type="file"
                hidden
                disabled={disabled}
                multiple={multiple}
                accept={accept}
                onChange={(event) => {
                    handleFiles(event.currentTarget.files);
                    event.currentTarget.value = '';
                }}
            />

            <div
                className="fileDropzone"
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-disabled={disabled || undefined}
                aria-busy={loading || undefined}
                onClick={openPicker}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openPicker();
                    }
                }}
                onDragOver={(event) => {
                    event.preventDefault();
                    if (!disabled && !loading) setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={onDrop}
            >
                {children ? (
                    <div className="fileDropzoneCompact">
                        <span className="fileDropzoneGlyph">{children}</span>
                        <strong>{placeholder || 'Seleccionar archivo'}</strong>
                    </div>
                ) : (
                    <>
                        <span className="fileDropzoneIcon">
                            <i className="fa-solid fa-cloud-arrow-up" />
                        </span>
                        <strong className="fileDropzoneTitle">
                            {placeholder || 'Elige un archivo o arrástralo aquí.'}
                        </strong>
                        <span className="allowedTypes">JPEG, PNG, .XSLX, PDF</span>
                        {hint && <span className="fileDropzoneHint">{hint}</span>}
                        <span className="fileDropzoneButton">Adjuntar archivo(s)</span>
                    </>
                )}
            </div>

            {items.length > 0 && (
                <ul className="fileList">
                    {items.map((item) => (
                        <li key={item.id} className={`fileItem ${item.status}`}>
                            <span className="fileItemIcon">
                                <i className={`fa-solid ${getFileIcon(item.name)}`} />
                            </span>

                            <div className="fileItemInfo">
                                {item.status === 'done' ? (
                                    <a
                                        className="fileItemName"
                                        href={getUrl(item.payload)}
                                        target="_blank"
                                        rel="noreferrer"
                                        title={item.name}
                                    >
                                        {item.name}
                                    </a>
                                ) : (
                                    <span className="fileItemName" title={item.name}>
                                        {item.name}
                                    </span>
                                )}

                                <div className="fileItemMeta">
                                    {item.sizeLabel && <span className="fileItemSize">{item.sizeLabel}</span>}
                                    {item.sizeLabel && <span className="fileItemDot" aria-hidden="true">·</span>}
                                    <span className="fileItemStatus">
                                        {item.status === 'uploading' && (
                                            <>
                                                <i className="fa-solid fa-spinner fa-spin" />
                                                Subiendo…
                                            </>
                                        )}
                                        {item.status === 'done' && (
                                            <>
                                                <i className="fa-solid fa-circle-check" />
                                                Completado
                                            </>
                                        )}
                                        {item.status === 'error' && (
                                            <>
                                                <i className="fa-solid fa-circle-exclamation" />
                                                Error al subir
                                            </>
                                        )}
                                    </span>
                                </div>

                                {item.status === 'uploading' && (
                                    <div className="fileItemProgress">
                                        <span className="fileItemProgressBar" />
                                    </div>
                                )}

                                <button
                                    type="button"
                                    className="fileItemRemove"
                                    aria-label={`Quitar ${item.name}`}
                                    onClick={() => removeItem(item.id)}
                                    disabled={disabled}
                                >
                                    {item.status === 'done'
                                        ? <i className="bi bi-trash3" />
                                        : <i className="fa-solid fa-xmark" />}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
