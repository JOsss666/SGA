import { useEffect, useState } from "react";
import { useAppInfo } from "../../../../context/context";
import { formatDate, moneyFormat, postInfo } from "../../../../utils/functions";

export function AccountingAdjustmentDesign({ id }) {
    const { appInfo } = useAppInfo();
    const [transactionDetails, setTransactionDetails] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const getTransactionDetails = async () => {
            setLoading(true);

            try {
                const res = await postInfo("/getTransactionDetails", {
                    doc_id: id,
                    typePlanAccount: appInfo.accountPlanType,
                    company_id: appInfo.company_id,
                    Type: "TR_details"
                });

                setTransactionDetails(res?.[0] ? res[1] : []);
            } catch (error) {
                console.error("Error al cargar el ajuste contable:", error);
                setTransactionDetails([]);
            } finally {
                setLoading(false);
            }
        };

        getTransactionDetails();
    }, [id, appInfo.accountPlanType, appInfo.company_id]);

    const documentInfo = transactionDetails[0] ?? {};

    const totalDebit = transactionDetails
        .filter((detail) => detail.nature === "DB")
        .reduce((total, detail) => total + Number(detail.total || 0), 0);

    const totalCredit = transactionDetails
        .filter((detail) => detail.nature === "CR")
        .reduce((total, detail) => total + Number(detail.total || 0), 0);

    return (
        <div style={{
            width: "100%",
            maxWidth: "900px",
            margin: "1rem auto",
            padding: "2rem",
            boxSizing: "border-box",
            color: "#222",
            background: "#fff",
            fontFamily: "Arial, sans-serif"
        }}>
            <div style={{
                marginBottom: "1.5rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid #ccc"
            }}>
                <h1 style={{ margin: "0 0 .5rem" }}>
                    {appInfo.legal_name}
                </h1>
                <h2 style={{ margin: "0 0 .75rem" }}>
                    Ajuste contable #{documentInfo.ownSerial ?? id}
                </h2>
                <div style={{ display: "flex", gap: "2rem", color: "#666" }}>
                    <span>Tercero: {documentInfo.thirdparty_name || "—"}</span>
                    <span>Fecha: {documentInfo.created_at
                        ? formatDate(documentInfo.created_at)
                        : "—"}
                    </span>
                </div>
            </div>

            {loading ? (
                <p>Cargando los movimientos del ajuste...</p>
            ) : transactionDetails.length === 0 ? (
                <p>No se encontraron movimientos para este ajuste.</p>
            ) : (
                <>
                    <table style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        textAlign: "left"
                    }}>
                        <thead>
                            <tr style={{ background: "#f1f2f4" }}>
                                <th style={{ padding: ".75rem" }}>Cuenta</th>
                                <th style={{ padding: ".75rem" }}>Concepto</th>
                                <th style={{ padding: ".75rem" }}>Naturaleza</th>
                                <th style={{ padding: ".75rem", textAlign: "right" }}>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactionDetails.map((detail, index) => (
                                <tr key={detail.id ?? index}>
                                    <td style={{ padding: ".75rem", borderBottom: "1px solid #ddd" }}>
                                        {detail.account_code || "—"}
                                    </td>
                                    <td style={{ padding: ".75rem", borderBottom: "1px solid #ddd" }}>
                                        {detail.concept_name || "—"}
                                    </td>
                                    <td style={{ padding: ".75rem", borderBottom: "1px solid #ddd" }}>
                                        {detail.nature === "DB" ? "Débito" : detail.nature === "CR" ? "Crédito" : detail.nature}
                                    </td>
                                    <td style={{ padding: ".75rem", borderBottom: "1px solid #ddd", textAlign: "right" }}>
                                        {moneyFormat(detail.total || 0)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <footer style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "2rem",
                        marginTop: "1.5rem",
                        paddingTop: "1rem",
                        borderTop: "1px solid #ccc",
                        fontWeight: "bold"
                    }}>
                        <span>Total débitos: {moneyFormat(totalDebit)}</span>
                        <span>Total créditos: {moneyFormat(totalCredit)}</span>
                    </footer>
                </>
            )}
        </div>
    );
}