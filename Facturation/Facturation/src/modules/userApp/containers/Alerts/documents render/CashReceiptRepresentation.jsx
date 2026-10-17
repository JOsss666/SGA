import { useEffect, useMemo, useState } from "react";
import { useAppInfo } from "../../../../../context/context";
import { moneyFormat, postInfo } from "../../../../../utils/functions";
import { LoadingAppDataPage } from "../../LoadingAppDataPage";
import "./InvoiceVisualRepresentation.css";

const formatDocumentDate = (value) => {
    if (!value) return "--";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return new Intl.DateTimeFormat("es-CO", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(date);
};

const currency = (value) => `$ ${moneyFormat(Number(value) || 0)}`;

export function CashReceiptRepresentation({ id }) {
    const { appInfo } = useAppInfo();

    const [docInfo, setDocInfo] = useState({});
    const [thirdPartyInfo, setThirdPartyInfo] = useState({});
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        const loadCashReceipt = async () => {
            if (!id || !appInfo.company_id) return;

            setLoading(true);
            setError("");

            try {
                const documentResponse = await postInfo("/getDocuments", {
                    company_id: appInfo.company_id,
                    id,
                    allowedTypes: ["Cash Recipt"],
                });

                const receipt = documentResponse?.[0]
                    ? documentResponse[1]?.[0]
                    : undefined;

                if (!receipt) {
                    throw new Error("No fue posible encontrar el recibo de caja.");
                }

                if (!active) return;
                setDocInfo(receipt);

                const [thirdPartyResponse, paymentResponse] = await Promise.all([
                    postInfo("/getThirdParties", {
                        company_id: appInfo.company_id,
                        id: receipt.thirdParty_id,
                    }),
                    postInfo("/getTransactionDetails", {
                        company_id: appInfo.company_id,
                        doc_id: receipt.id,
                    }),
                ]);

                if (!active) return;

                setThirdPartyInfo(
                    thirdPartyResponse?.[0]
                        ? thirdPartyResponse[1]?.[0] ?? {}
                        : {}
                );

                const transactionDetails = paymentResponse?.[0]
                    ? paymentResponse[1] ?? []
                    : [];

                setPayments(
                    transactionDetails.filter(
                        (detail) =>
                            String(detail.type).toLowerCase() === "payment" &&
                            detail.paymentMethod_id != null
                    )
                );
            } catch (loadError) {
                if (active) {
                    setError(
                        loadError.message ||
                            "No fue posible cargar el recibo de caja."
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        loadCashReceipt();

        return () => {
            active = false;
        };
    }, [id, appInfo.company_id]);

    const total = useMemo(
        () =>
            payments.reduce(
                (sum, payment) =>
                    sum + (Number(payment.total ?? payment.value) || 0),
                0
            ),
        [payments]
    );

    if (loading) return <LoadingAppDataPage />;

    if (error) {
        return (
            <div className="InvoiceVisualRepresentation_error">
                {error}
            </div>
        );
    }

    const companyName =
        appInfo.legal_name ||
        appInfo.trade_name ||
        appInfo.company_name ||
        "Empresa";

    const thirdPartyName =
        thirdPartyInfo.names ||
        thirdPartyInfo.legal_name ||
        docInfo.thirdParty_name ||
        "--";

    return (
        <article className="InvoiceVisualRepresentation">
            <div className="InvoiceVisualRepresentation_header">
                <h1>Recibo de caja</h1>
                <div className="InvoiceVisualRepresentation_brand">
                    <img
                        src="https://cdnmain.sga360.co/static/LOGO%20SGA.png"
                        alt="Logo SGA360"
                    />
                    <strong>SGA360°</strong>
                </div>
            </div>

            <dl className="InvoiceVisualRepresentation_metadata">
                <div>
                    <dt>Número de recibo</dt>
                    <dd>{docInfo.ownSerial || docInfo.id}</dd>
                </div>

                <div>
                    <dt>Fecha</dt>
                    <dd>
                        {formatDocumentDate(
                            docInfo.doc_date || docInfo.created_at
                        )}
                    </dd>
                </div>

                {docInfo.description && (
                    <div>
                        <dt>Concepto</dt>
                        <dd>{docInfo.description}</dd>
                    </div>
                )}
            </dl>

            <section className="InvoiceVisualRepresentation_parties">
                <div>
                    <h2>{companyName}</h2>
                    {appInfo.nit && <p>NIT {appInfo.nit}</p>}
                    {appInfo.address && <p>{appInfo.address}</p>}
                    {appInfo.phone && <p>{appInfo.phone}</p>}
                    {appInfo.company_mail && <p>{appInfo.company_mail}</p>}
                </div>

                <div>
                    <h2>Recibido de</h2>
                    <p>{thirdPartyName}</p>
                    {thirdPartyInfo.indentification_number && (
                        <p>
                            {thirdPartyInfo.indentification_type}{" "}
                            {thirdPartyInfo.indentification_number}
                        </p>
                    )}
                    {thirdPartyInfo.mail && <p>{thirdPartyInfo.mail}</p>}
                </div>
            </section>

            <div className="InvoiceVisualRepresentation_tableWrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Método de pago</th>
                            <th>Valor</th>
                        </tr>
                    </thead>

                    <tbody>
                        {payments.map((payment, index) => (
                            <tr key={payment.id ?? index}>
                                <td>
                                    {payment.payment_name || "Método de pago"}
                                </td>
                                <td>
                                    {currency(payment.total ?? payment.value)}
                                </td>
                            </tr>
                        ))}

                        {payments.length === 0 && (
                            <tr className="InvoiceVisualRepresentation_empty">
                                <td colSpan="2">
                                    No se encontraron pagos asociados al recibo.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <section className="InvoiceVisualRepresentation_summary">
                <div>
                    <span>Total recibido</span>
                    <strong>{currency(total || docInfo.total)}</strong>
                </div>
            </section>

            <footer>
                <span>Página 1 de 1</span>
            </footer>
        </article>
    );
}