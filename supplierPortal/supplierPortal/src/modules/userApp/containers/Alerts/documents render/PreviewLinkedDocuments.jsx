import { useEffect, useMemo, useState } from "react";
import { useAlert, useAppInfo, useNotifications } from "../../../../../context/context";
import { formatDate, postInfo } from "../../../../../utils/functions";
import { SearchBar } from "../../../components/SearchBar";
import { MoreOptions } from "../../../components/MoreOptions";
import { getElectronicDocumentOptions } from "../../../components/ElectronicDocumentCard";
import { PreviewFile } from "../../Preview/PreviewFile";
import './PreviewLinkedDocuments.css';
import { LoadingSpace } from "../../LoadingSpace";

const documentTypeDictionary = {
    'Sell Invoice': 'Factura de venta',
    'Purchase Invoice': 'Factura de compra',
    'Cash Recipt': 'Recibo de caja',
    'Client Order': 'Orden de cliente',
    'Credit Note': 'Nota crédito',
    'Debit Note': 'Nota débito',
    'Accounting Recipt': 'Comprobante contable',
    'Transaction': 'Transacción'
};

const fileIcons = {
    'image/jpeg': 'fa-file-image',
    'image/png': 'fa-file-image',
    'image/gif': 'fa-file-image',
    'image/webp': 'fa-file-image',
    'application/pdf': 'fa-file-pdf',
    'application/msword': 'fa-file-word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'fa-file-word',
    'application/vnd.ms-excel': 'fa-file-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'fa-file-excel',
    'text/plain': 'fa-file-lines',
    'text/csv': 'fa-file-csv',
    'application/zip': 'fa-file-zipper'
};

const parseAttachedIds = (attached) => {
    if (!attached || attached === '-') return [];

    try {
        const parsed = typeof attached === 'string' ? JSON.parse(attached) : attached;
        if (!Array.isArray(parsed)) return [];
        return parsed.map((file) => file?.id ?? file).filter((fileId) => fileId != null);
    } catch {
        return [];
    }
};

const uniqueById = (elements) => Array.from(
    new Map(elements.filter(Boolean).map((element) => [String(element.id), element])).values()
);

export function PreviewLinkedDocument({id}){
    const {appInfo} = useAppInfo();
    const {popInAlert} = useAlert();
    const {addNotification} = useNotifications();
    const [documents, setDocuments] = useState([]);
    const [files, setFiles] = useState([]);
    const [electronicDocuments, setElectronicDocuments] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        const loadLinkedDocuments = async () => {
            if (!id || !appInfo.company_id) return;

            setLoading(true);
            setError('');

            try {
                const currentResponse = await postInfo('/getDocuments', {
                    company_id: appInfo.company_id,
                    id
                });
                const currentDocument = currentResponse?.[0] ? currentResponse[1]?.[0] : undefined;

                if (!currentDocument) throw new Error('No se encontró el documento seleccionado.');

                const requests = [postInfo('/process/getOpAttached', {
                    id,
                    company_id: appInfo.company_id
                })];
                if (currentDocument.instance_id != null) {
                    requests.push(postInfo('/getDocuments', {
                        company_id: appInfo.company_id,
                        instance_id: currentDocument.instance_id
                    }));
                }

                const responses = await Promise.allSettled(requests);
                const groupedDocuments = responses[0].status === 'fulfilled' && responses[0].value?.[0]
                    ? responses[0].value[1] ?? []
                    : [];
                const instanceDocuments = responses[1]?.status === 'fulfilled' && responses[1].value?.[0]
                    ? responses[1].value[1] ?? []
                    : [];
                const relatedDocuments = uniqueById([
                    currentDocument,
                    ...groupedDocuments,
                    ...instanceDocuments
                ]);

                const attachedIds = [...new Set(relatedDocuments.flatMap((document) => parseAttachedIds(document.attached)))];
                const [filesResponse, ...electronicResponses] = await Promise.all([
                    attachedIds.length > 0
                        ? postInfo('/getAttachedFiles', {
                            company_id: appInfo.company_id,
                            allowedDocs: attachedIds
                        })
                        : Promise.resolve([true, []]),
                    ...relatedDocuments.map((document) => postInfo('/electronicFacturation/getDocuments', {
                        company_id: appInfo.company_id,
                        doc_id: document.id
                    }).catch(() => [false, []]))
                ]);

                if (!active) return;
                setDocuments(relatedDocuments.filter((document) => String(document.id) !== String(id)));
                setFiles(filesResponse?.[0] ? filesResponse[1] ?? [] : []);
                setElectronicDocuments(uniqueById(
                    electronicResponses.flatMap((response) => response?.[0] ? response[1] ?? [] : [])
                ));
            } catch (loadError) {
                if (active) setError(loadError.message || 'No fue posible cargar los documentos asociados.');
            } finally {
                if (active) setLoading(false);
            }
        };

        loadLinkedDocuments();
        return () => {
            active = false;
        };
    }, [id, appInfo.company_id]);

    const filteredContent = useMemo(() => {
        const search = searchValue.trim().toLocaleLowerCase('es');
        if (!search) return {documents, files, electronicDocuments};

        const includesSearch = (...values) => values.some((value) =>
            String(value ?? '').toLocaleLowerCase('es').includes(search)
        );

        return {
            documents: documents.filter((document) => includesSearch(
                documentTypeDictionary[document.document_type],
                document.document_type,
                document.ownSerial,
                document.description
            )),
            files: files.filter((file) => includesSearch(file.name, file.type)),
            electronicDocuments: electronicDocuments.filter((document) => includesSearch(
                document.type,
                document.number,
                document.document_type
            ))
        };
    }, [documents, electronicDocuments, files, searchValue]);

    const noResults = !loading
        && filteredContent.documents.length === 0
        && filteredContent.files.length === 0
        && filteredContent.electronicDocuments.length === 0;

    return(
        <div className="PreviewLinkedDocument">
            <div className="header">
                <h6>Documentos y archivos adjuntos</h6>
                <span>Documentos de SGA360° y archivos asociados a este documento</span>
                <SearchBar value={searchValue} action={setSearchValue} placeholder={'Buscar documento'}/>
            </div>

            {loading && (
                <LoadingSpace title={'Cargando documentos'} description={'Esto no deberia tardar mucho'}/>
            )}
            {error && <div className="linkedStatus linkedError">{error}</div>}

            {!loading && !error && (
                <div className="body">
                    {filteredContent.electronicDocuments.length > 0 && (
                        <section>
                            <h6>Documentos electrónicos</h6>
                            <div className="linkedList">
                                {filteredContent.electronicDocuments.map((document) => (
                                    <div className="linkedCard" key={`electronic-${document.id}`}>
                                        <i className="fa-solid fa-file-invoice"/>
                                        <div>
                                            <strong>{document.type === 'cr_note' ? 'Nota crédito electrónica' : document.type === 'db_note' ? 'Nota débito electrónica' : 'Factura electrónica'}</strong>
                                            <span>{document.number}</span>
                                        </div>
                                        <MoreOptions options={getElectronicDocumentOptions(document, addNotification)}/>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                    {filteredContent.documents.length > 0 && (
                        <section>
                            <h6>Documentos relacionados</h6>
                            <div className="linkedList">
                                {filteredContent.documents.map((document) => (
                                    <div className="linkedCard" key={document.id}>
                                        <i className="fa-regular fa-file-lines"/>
                                        <div>
                                            <strong>
                                                {documentTypeDictionary[document.document_type] || document.document_type}
                                                <span>#{document.ownSerial ?? document.id}</span>
                                            </strong>
                                            <small>{formatDate(document.created_at)}</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                    {filteredContent.files.length > 0 && (
                        <section>
                            <h6>Archivos adjuntos</h6>
                            <div className="linkedList">
                                {filteredContent.files.map((file) => (
                                    <button className="linkedCard linkedFile" key={file.id} onClick={() => popInAlert(<PreviewFile id={file.id}/>)}>
                                        <i className={`fa-regular ${fileIcons[file.type] || 'fa-file'}`}/>
                                        <div>
                                            <strong>{file.name}</strong>
                                            <span>{file.type}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {noResults && <div className="linkedStatus">No hay documentos o archivos asociados.</div>}
                </div>
            )}
        </div>
    )
}
