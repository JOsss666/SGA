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

export function ClientOrderRepresentation({ id }) {
    const { appInfo } = useAppInfo();

    const [docInfo, setDocInfo] = useState({});
    const [thirdPartyInfo, setThirdPartyInfo] = useState({});
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        const loadClientOrder = async () => {
            if (!id || !appInfo.company_id) return;

            setLoading(true);
            setError("");

            try {
                const documentResponse = await postInfo("/getDocuments", {
                    company_id: appInfo.company_id,
                    id,
                    allowedTypes: ["Client Order"],
                });

                const order = documentResponse?.[0]
                    ? documentResponse[1]?.[0]
                    : undefined;

                if (!order) {
                    throw new Error("No fue posible encontrar la orden de cliente.");
                }

                if (!active) return;
                setDocInfo(order);

                const [thirdPartyResponse, itemsResponse] = await Promise.all([
                    postInfo("/getThirdParties", {
                        company_id: appInfo.company_id,
                        id: order.thirdParty_id,
                    }),
                    postInfo("/getServiceMovements", {
                        company_id: appInfo.company_id,
                        doc_id: order.id,
                    }),
                ]);

                if (!active) return;

                setThirdPartyInfo(
                    thirdPartyResponse?.[0]
                        ? thirdPartyResponse[1]?.[0] ?? {}
                        : {}
                );
                setItems(itemsResponse?.[0] ? itemsResponse[1] ?? [] : []);
            } catch (loadError) {
                if (active) {
                    setError(
                        loadError.message ||
                        "No fue posible cargar la orden de cliente."
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        loadClientOrder();

        return () => {
            active = false;
        };
    }, [id, appInfo.company_id]);

    const total = useMemo(
        () =>
            items.reduce((sum, item) => {
                const units = Number(item.units) || 0;
                const unitValue = Number(item.unit_value) || 0;
                return sum + (Number(item.total) || units * unitValue);
            }, 0),
        [items]
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

    const customerName =
        thirdPartyInfo.names ||
        thirdPartyInfo.legal_name ||
        docInfo.thirdParty_name ||
        "--";

    return (
        <article className="InvoiceVisualRepresentation">
            <div className="InvoiceVisualRepresentation_header">
                <h1>Orden de cliente</h1>
                <div className="InvoiceVisualRepresentation_brand">
                    <img src="https://cdnmain.sga360.co/static/LOGO%20SGA.png" />
                    <strong>SGA360°</strong>
                </div>
            </div>

            <dl className="InvoiceVisualRepresentation_metadata">
                <div>
                    <dt>Número de orden</dt>
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
                        <dt>Descripción</dt>
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
                    <h2>Cliente</h2>
                    <p>{customerName}</p>
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
                            <th>Descripción</th>
                            <th>Cant.</th>
                            <th>Precio unitario</th>
                            <th>Total item</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => {
                            const units = Number(item.units) || 0;
                            const unitValue = Number(item.unit_value) || 0;
                            const itemTotal =
                                Number(item.total) || units * unitValue;

                            return (
                                <tr key={item.id ?? index}>
                                    <td>
                                        <strong>
                                            {item.service_name ||
                                                item.product_name ||
                                                item.description ||
                                                `Ítem ${index + 1}`}
                                        </strong>
                                    </td>
                                    <td>{units}</td>
                                    <td>{currency(unitValue)}</td>
                                    <td>{currency(itemTotal)}</td>
                                </tr>
                            );
                        })}

                        {items.length === 0 && (
                            <tr className="InvoiceVisualRepresentation_empty">
                                <td colSpan="4">
                                    No se encontraron conceptos asociados a la
                                    orden.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <section className="InvoiceVisualRepresentation_summary">
                <div>
                    <span>Total de la orden</span>
                    <strong>{currency(Number(docInfo.total) || total)}</strong>
                </div>
            </section>

            <footer>
                <span>Página 1 de 1</span>
            </footer>
        </article>
    );
}