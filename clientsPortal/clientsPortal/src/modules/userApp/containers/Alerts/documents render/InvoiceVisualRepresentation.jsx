import { useEffect, useMemo, useState } from 'react';
import { useAppInfo } from '../../../../../context/context';
import { moneyFormat, postInfo } from '../../../../../utils/functions';
import { LoadingAppDataPage } from '../../LoadingAppDataPage';
import './InvoiceVisualRepresentation.css';

const formatInvoiceDate = (value) => {
    if (!value) return '--';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return new Intl.DateTimeFormat('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
};

const currency = (value) => `$ ${moneyFormat(Number(value) || 0)}`;

export function InvoiceVisualRepresentation({id}) {
    const {appInfo} = useAppInfo();
    const [docInfo, setDocInfo] = useState({});
    const [thirdPartyInfo, setThirdPartyInfo] = useState({});
    const [items, setItems] = useState([]);
    const [payments, setPayments] = useState([]);
    const [electronicInfo, setElectronicInfo] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        const loadInvoice = async () => {
            if (!id || !appInfo.company_id) return;

            setLoading(true);
            setError('');

            try {
                const documentResponse = await postInfo('/getDocuments', {
                    company_id: appInfo.company_id,
                    id,
                    allowedTypes: ['Sell Invoice']
                });
                const invoice = documentResponse?.[0] ? documentResponse[1]?.[0] : undefined;

                if (!invoice) throw new Error('No fue posible encontrar la factura de venta.');
                if (!active) return;
                setDocInfo(invoice);

                const [thirdPartyResponse, paymentResponse, electronicResponse, ordersResponse] = await Promise.all([
                    postInfo('/getThirdParties', {
                        company_id: appInfo.company_id,
                        id: invoice.thirdParty_id
                    }),
                    postInfo('/facturation/getTransactionsOfCashRecord', {
                        company_id: appInfo.company_id,
                        doc_id: invoice.id
                    }),
                    postInfo('/electronicFacturation/getDocuments', {
                        company_id: appInfo.company_id,
                        doc_id: invoice.id
                    }),
                    postInfo('/getDocuments', {
                        company_id: appInfo.company_id,
                        instance_id: invoice.instance_id,
                        thirdParty_id: invoice.thirdParty_id,
                        status: 'active',
                        allowedTypes: ['Client Order']
                    })
                ]);

                const clientOrders = ordersResponse?.[0] ? ordersResponse[1] : [];
                const serviceResponses = await Promise.all(
                    clientOrders.map((order) => postInfo('/getServiceMovements', {
                        company_id: appInfo.company_id,
                        doc_id: order.id
                    }))
                );

                if (!active) return;
                setThirdPartyInfo(thirdPartyResponse?.[0] ? thirdPartyResponse[1]?.[0] ?? {} : {});
                setPayments(paymentResponse?.[0] ? paymentResponse[1] ?? [] : []);
                setElectronicInfo(electronicResponse?.[0] ? electronicResponse[1]?.[0] ?? {} : {});
                setItems(serviceResponses.flatMap((response) => response?.[0] ? response[1] ?? [] : []));
            } catch (loadError) {
                if (active) setError(loadError.message || 'No fue posible cargar la factura.');
            } finally {
                if (active) setLoading(false);
            }
        };

        loadInvoice();
        return () => {
            active = false;
        };
    }, [id, appInfo.company_id]);

    const totals = useMemo(() => {
        const itemsTotal = items.reduce((sum, item) => {
            const quantity = Number(item.units) || 0;
            const unitValue = Number(item.unit_value) || 0;
            return sum + (Number(item.total) || quantity * unitValue);
        }, 0);

        const groupedTaxes = items.reduce((groups, item) => {
            if (!item.tax_id) return groups;

            const quantity = Number(item.units) || 0;
            const unitValue = Number(item.unit_value) || 0;
            const itemTotal = Number(item.total) || quantity * unitValue;
            const rate = Number(item.tax_rate) || 0;
            const taxableBase = itemTotal / (1 + (rate / 100));
            const taxTotal = taxableBase * (rate / 100);

            if (!groups[item.tax_id]) {
                groups[item.tax_id] = {
                    id: item.tax_id,
                    name: item.tax_name || 'Impuesto',
                    rate,
                    total: taxTotal
                };
            } else {
                groups[item.tax_id].total += taxTotal;
            }

            return groups;
        }, {});

        const taxes = Object.values(groupedTaxes);
        const taxableBase = items.reduce((sum, item) => {
            if (item.tax_rate === undefined || item.tax_rate === null) return sum;

            const quantity = Number(item.units) || 0;
            const unitValue = Number(item.unit_value) || 0;
            const itemTotal = Number(item.total) || quantity * unitValue;
            return sum + (itemTotal / (1 + ((Number(item.tax_rate) || 0) / 100)));
        }, 0);
        const total = Number(docInfo.total) || itemsTotal;
        const subtotal = taxableBase || Number(docInfo.subTotal ?? docInfo.subtotal) || itemsTotal;
        const totalTaxes = taxes.reduce((sum, tax) => sum + tax.total, 0);
        const paid = payments.reduce((sum, payment) => sum + Number(payment.total ?? payment.value ?? 0), 0);

        return {
            subtotal,
            taxes,
            totalTaxes,
            total,
            paid,
            due: Math.max(total - paid, 0)
        };
    }, [docInfo, items, payments]);

    useEffect(()=>{
        console.log('&&&&& ',docInfo);
    },[docInfo])

    if (loading) return <LoadingAppDataPage/>;
    if (error) return <div className="InvoiceVisualRepresentation_error">{error}</div>;

    const ownSerial = docInfo.ownSerial || docInfo.id;
    const invoiceNumber = electronicInfo.number || docInfo.ownSerial || docInfo.id;
    const issueDate = docInfo.doc_date || docInfo.created_at;
    const dueDate = docInfo.due_date || docInfo.expiration_date;
    const companyName = appInfo.legal_name || appInfo.trade_name || appInfo.company_name || 'Empresa';
    const companyDocument = appInfo.nit || appInfo.identification || appInfo.document_number;
    const companyAddress = appInfo.address;
    const companyEmail = appInfo.company_mail;
    const companyPhone = appInfo.phone;
    const customerName = thirdPartyInfo.names || thirdPartyInfo.legal_name || docInfo.thirdParty_name || '--';

    return (
        <article className="InvoiceVisualRepresentation">
            <div className="InvoiceVisualRepresentation_header">
                <h1>Factura de venta</h1>
                <div className="InvoiceVisualRepresentation_brand">
                    <img src="https://cdnmain.sga360.co/static/LOGO%20SGA.png"/>
                    <strong>SGA360°</strong>
                </div>
            </div>

            <dl className="InvoiceVisualRepresentation_metadata">
                <div><dt>Número de factura</dt><dd>{ownSerial}</dd></div>
                {invoiceNumber != undefined && (
                    <div><dt>Factura electronica</dt><dd>{invoiceNumber}</dd></div>
                )}
                <div><dt>Fecha de emisión</dt><dd>{formatInvoiceDate(issueDate)}</dd></div>
                <div><dt>Vencimiento</dt><dd>{dueDate ? formatInvoiceDate(dueDate) : 'N/A'}</dd></div>
                {docInfo.description && <div><dt>Descripción</dt><dd>{docInfo.description}</dd></div>}
            </dl>

            <section className="InvoiceVisualRepresentation_parties">
                <div>
                    <h2>{companyName}</h2>
                    {companyDocument && <p>NIT {companyDocument}</p>}
                    {companyAddress && <p>{companyAddress}</p>}
                    {companyPhone && <p>{companyPhone}</p>}
                    {companyEmail && <p>{companyEmail}</p>}
                </div>
                <div>
                    <h2>Facturar a</h2>
                    <p>{customerName}</p>
                    <p>{`${thirdPartyInfo.indentification_type} ${thirdPartyInfo.indentification_number}`}</p>
                    {thirdPartyInfo.mail && <p>{thirdPartyInfo.mail}</p>}
                </div>
            </section>

            <div className="InvoiceVisualRepresentation_tableWrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Descripción</th>
                            <th>Cant.</th>
                            <th>Precio unitario</th>
                            <th>Total item</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => {
                            const quantity = Number(item.units) || 0;
                            const unitValue = Number(item.unit_value) || 0;
                            const itemTotal = Number(item.total) || quantity * unitValue;

                            return (
                                <tr key={item.id ?? index}>
                                    <td>
                                        <strong>{item.service_name || item.product_name || item.description || `Ítem ${index + 1}`}</strong>
                                        {item.description && item.description !== item.service_name && <small>{item.description}</small>}
                                    </td>
                                    <td>{quantity}</td>
                                    <td>{currency(unitValue)}</td>
                                    <td>{currency(itemTotal)}</td>
                                </tr>
                            );
                        })}
                        {items.length === 0 && (
                            <tr className="InvoiceVisualRepresentation_empty">
                                <td colSpan="4">No se encontraron conceptos asociados a la factura.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <section className="InvoiceVisualRepresentation_summary">
                <div><span>Subtotal</span><span>{currency(totals.subtotal)}</span></div>
                {totals.taxes.map((tax) => (
                    <div key={tax.id}>
                        <span>{tax.name} ({tax.rate}%)</span>
                        <span>{currency(tax.total)}</span>
                    </div>
                ))}
                <div><span>Total</span><span>{currency(totals.total)}</span></div>
                {totals.paid > 0 && <div><span>Pagado</span><span>- {currency(totals.paid)}</span></div>}
                <div className="InvoiceVisualRepresentation_total"><strong>Saldo pendiente</strong><strong>{currency(totals.due)}</strong></div>
            </section>

            <footer>
                {electronicInfo.code && <p><strong>CUFE:</strong> {electronicInfo.code}</p>}
                <span>Página 1 de 1</span>
            </footer>
        </article>
    );
}
