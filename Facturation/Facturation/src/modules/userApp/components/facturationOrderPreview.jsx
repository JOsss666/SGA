import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAppInfo } from '../../../context/context';
import { moneyFormat, postInfo } from '../../../utils/functions';
import './facturationOrderPreview.css';

const currency = value => `$ ${moneyFormat(Number(value) || 0)}`;

const formatDate = value => {
    if (!value) return '--';
    const date = new Date(`${value}`.length === 10 ? `${value}T12:00:00` : value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('es-CO', {
        day:'2-digit', month:'2-digit', year:'numeric'
    }).format(date);
};

const getCustomerName = thirdParty => thirdParty.names
    || thirdParty.legal_name
    || [thirdParty.first_name, thirdParty.second_name, thirdParty.first_surname, thirdParty.second_surname]
        .filter(Boolean).join(' ')
    || '--';

export function FacturationOrderPreview({ data, documentId, documentType = 'Client Order' }) {
    const { appInfo } = useAppInfo();
    const [docInfo, setDocInfo] = useState(data?.docInfo ?? {});
    const [thirdPartyInfo, setThirdPartyInfo] = useState({});
    const [items, setItems] = useState(data?.items ?? []);
    const [loading, setLoading] = useState(Boolean(documentId) || Boolean(data?.thirdParty_id));
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        const loadPreview = async () => {
            if (!appInfo.company_id) return;
            setLoading(true);
            setError('');

            try {
                let currentDoc = data?.docInfo ?? {};
                let currentItems = data?.items ?? [];

                if (documentId) {
                    const documentResponse = await postInfo('/getDocuments', {
                        company_id:appInfo.company_id,
                        id:documentId,
                        allowedTypes:[documentType]
                    });
                    currentDoc = documentResponse?.[0] ? documentResponse[1]?.[0] : undefined;
                    if (!currentDoc) throw new Error('No fue posible encontrar el documento.');

                    const itemResponse = await postInfo('/getServiceMovements', {
                        company_id:appInfo.company_id,
                        doc_id:currentDoc.id
                    });
                    currentItems = itemResponse?.[0] ? itemResponse[1] ?? [] : [];
                }

                const thirdPartyId = currentDoc?.thirdParty_id ?? data?.thirdParty_id;
                const thirdPartyResponse = thirdPartyId
                    ? await postInfo('/getThirdParties', {
                        company_id:appInfo.company_id,
                        id:thirdPartyId,
                        comercialInfo:true
                    })
                    : null;

                if (!active) return;
                setDocInfo(currentDoc ?? {});
                setItems(currentItems);
                setThirdPartyInfo(thirdPartyResponse?.[0] ? thirdPartyResponse[1]?.[0] ?? {} : {});
            } catch (loadError) {
                if (active) setError(loadError?.message || 'No fue posible cargar la prefactura.');
            } finally {
                if (active) setLoading(false);
            }
        };

        loadPreview();
        return () => { active = false; };
    }, [appInfo.company_id, data, documentId, documentType]);

    const summary = useMemo(() => items.reduce((result, item) => {
        const units = Number(item.units) || 0;
        const unitValue = Number(item.unit_value ?? item.value) || 0;
        const gross = units * unitValue;
        const discount = Number(item.discount_value ?? item.discount) || 0;
        const lineTotal = Math.max(0, gross - discount);
        const rate = Math.max(0, Number(item.tax_rate) || 0);
        const base = rate > 0 ? lineTotal / (1 + rate / 100) : lineTotal;
        const taxValue = lineTotal - base;

        result.gross += gross;
        result.discount += discount;
        result.base += base;
        result.taxesTotal += taxValue;
        result.total += lineTotal;

        if (rate > 0 || item.tax_id) {
            const key = `${item.tax_id ?? item.tax_name ?? rate}`;
            if (!result.taxes[key]) {
                result.taxes[key] = {
                    id:key,
                    name:item.tax_name || 'Impuesto',
                    rate,
                    value:0
                };
            }
            result.taxes[key].value += taxValue;
        }
        return result;
    }, { gross:0, discount:0, base:0, taxesTotal:0, total:0, taxes:{} }), [items]);

    if (loading) {
        return <div className="facturationOrderPreview facturationOrderPreviewLoading" role="status" aria-live="polite">
            <i className="bi bi-arrow-repeat" aria-hidden="true" /> Cargando datos de la prefactura…
        </div>;
    }

    if (error) {
        return <div className="facturationOrderPreview facturationOrderPreviewError" role="alert">{error}</div>;
    }

    const companyName = appInfo.legal_name || appInfo.trade_name || appInfo.company_name || 'Empresa';
    const customerName = thirdPartyInfo.names
        || thirdPartyInfo.legal_name
        || docInfo.thirdParty_name
        || getCustomerName(thirdPartyInfo);
    const customerDocument = [thirdPartyInfo.indentification_type, thirdPartyInfo.indentification_number]
        .filter(Boolean).join(' ');
    const savedDocument = Boolean(documentId);
    const qrValue = `https://facturation.sga360.co/preview/Document/${appInfo.company_key}/${documentId}`;
    const documentLabel = documentType === 'Client Order' ? 'Orden de cliente' : 'Orden de facturación';

    return (
        <article className="facturationOrderPreview">
            <header className="facturationOrderPreviewHeader">
                <div className="facturationOrderPreviewLogo">
                    <img src="https://cdnmain.sga360.co/static/LOGO%20SGA.png" alt="SGA 360" />
                </div>
                <div className="facturationOrderPreviewCompany">
                    <strong>FACTURA ELECTRÓNICA DE VENTA</strong>
                    <strong>{savedDocument ? `NÚMERO ${docInfo.ownSerial || docInfo.id}` : 'SIMULACIÓN DE FACTURACIÓN'}</strong>
                    {(appInfo.tax_regime || appInfo.tax_responsibilities) && (
                        <p>{appInfo.tax_regime || appInfo.tax_responsibilities}</p>
                    )}
                    <span>{companyName}</span>
                    {(appInfo.nit || appInfo.identification || appInfo.document_number) && (
                        <span>NIT {appInfo.nit || appInfo.identification || appInfo.document_number}</span>
                    )}
                    {appInfo.phone && <span>{appInfo.phone}</span>}
                    {appInfo.company_mail && <span>{appInfo.company_mail}</span>}
                    {appInfo.address && <span>{appInfo.address}</span>}
                </div>
                <div className={`facturationOrderPreviewQr ${savedDocument ? '' : 'facturationOrderPreviewQrPlaceholder'}`}>
                    <QRCodeSVG value={savedDocument ? qrValue : 'PREVISUALIZACION-SIN-DOCUMENTO'} size={104} level="M" />
                    {!savedDocument && <span>QR disponible al guardar</span>}
                </div>
            </header>

            <section className="facturationOrderPreviewDetails" aria-label="Datos del cliente y la orden">
                <dl className="facturationOrderPreviewParty">
                    <div><dt>CC/NIT:</dt><dd>{customerDocument || '--'}</dd></div>
                    <div><dt>Cliente:</dt><dd>{customerName}</dd></div>
                    <div><dt>País:</dt><dd>{thirdPartyInfo.country || '--'}</dd></div>
                    <div><dt>Municipio:</dt><dd>{thirdPartyInfo.city || thirdPartyInfo.municipality || '--'}</dd></div>
                    <div><dt>Dirección:</dt><dd>{thirdPartyInfo.address || '--'}</dd></div>
                    <div><dt>Email:</dt><dd>{thirdPartyInfo.mail || '--'}</dd></div>
                </dl>
                <dl className="facturationOrderPreviewDates">
                    <div><dt>Fecha de generación:</dt><dd>{formatDate(docInfo.doc_date || docInfo.created_at || new Date())}</dd></div>
                    <div><dt>Fecha de validación:</dt><dd>{savedDocument ? formatDate(docInfo.updated_at || docInfo.doc_date || docInfo.created_at) : 'Pendiente'}</dd></div>
                    <div><dt>Documento:</dt><dd>{savedDocument ? documentLabel : 'Prefactura'}</dd></div>
                </dl>
            </section>

            <div className="facturationOrderPreviewTableWrapper">
                <table className="facturationOrderPreviewItemsTable">
                    <thead><tr>
                        <th>#</th><th>Código</th><th>Descripción</th><th>Val. Unit</th>
                        <th>Cantidad</th><th>Descuento</th><th>Impuesto</th><th>Val. Ítem</th>
                    </tr></thead>
                    <tbody>
                        {items.map((item, index) => {
                            const units = Number(item.units) || 0;
                            const unitValue = Number(item.unit_value ?? item.value) || 0;
                            const discount = Number(item.discount_value ?? item.discount) || 0;
                            const total = Math.max(0, units * unitValue - discount);
                            const description = item.facturation_description || item.description || item.service_name || item.product_name || `Ítem ${index + 1}`;
                            return <tr key={item.id ?? `${item.service_id ?? item.product_id}-${index}`}>
                                <td>{index + 1}</td>
                                <td>{item.code || item.service_code || item.product_code || item.service_id || item.product_id || '--'}</td>
                                <td>{description}{item.sourceDocument && <small>Orden #{item.sourceDocument}</small>}</td>
                                <td>{currency(unitValue)}</td>
                                <td>{moneyFormat(units)}</td>
                                <td>{currency(discount)}</td>
                                <td>{item.tax_name || (Number(item.tax_rate) ? `${item.tax_rate}%` : 'Exento')}</td>
                                <td>{currency(total)}</td>
                            </tr>;
                        })}
                        {items.length === 0 && <tr><td colSpan="8">No hay ítems incluidos en esta prefactura.</td></tr>}
                    </tbody>
                </table>
            </div>

            <section className="facturationOrderPreviewBottom">
                <div className="facturationOrderPreviewObservations">
                    <h2>Observaciones</h2>
                    <p>{(data?.observations ?? docInfo.description) || 'Sin observaciones'}</p>
                </div>
                <div className="facturationOrderPreviewTotals">
                    <h2>Totales</h2>
                    <div className="facturationOrderPreviewTotalHead"><span>Concepto</span><span>Valor</span></div>
                    <div><span>Valor bruto</span><span>{currency(summary.gross)}</span></div>
                    <div><span>Base imponible</span><span>{currency(summary.base)}</span></div>
                    {Object.values(summary.taxes).map(tax => (
                        <div key={tax.id}><span>{tax.name}{tax.rate > 0 ? ` (${tax.rate}%)` : ''}</span><span>{currency(tax.value)}</span></div>
                    ))}
                    <div><span>Descuento global (-)</span><span>{currency(summary.discount)}</span></div>
                    <div><span>Recargo global (+)</span><span>{currency(0)}</span></div>
                    <div className="facturationOrderPreviewInvoiceTotal"><strong>Total factura</strong><strong>{currency(summary.total)}</strong></div>
                </div>
            </section>
        </article>
    );
}
