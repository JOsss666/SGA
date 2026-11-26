import { useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import { useAppInfo } from "../../../../Facturation/Facturation/src/context/context";
import { FormInput } from "../../../../Facturation/Facturation/src/modules/userApp/components/FormInput";
import { FileInput } from "../../../../Facturation/Facturation/src/modules/userApp/components/FileInput";
import { SearchinList } from "../../../../Facturation/Facturation/src/modules/userApp/components/SearchInList";
import { CheckSquare } from "../../../../Facturation/Facturation/src/modules/userApp/components/CheckSquare";
import { SwitchOption } from "../../../../Facturation/Facturation/src/modules/userApp/components/SwitchOption";
import { FormButton } from "../../../../Facturation/Facturation/src/modules/userApp/components/FormButton";
import { postInfo, uploadFiles } from "../../../../Facturation/Facturation/src/utils/functions";
import "./FormDeliveryOrder.css";

const getToday = () => {
    const date = new Date();

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");
};

const createInitialForm = () => ({
    issueDate: getToday(),
    deliveryDate: getToday(),
    deliveryTime: "",
    pickupPlace: "",
    carrier: "",
    plate: "",
    driverName: "",
    driverId: "",
    phone: "",
    packages: "",
    approximateWeight: "",
    departureTime: "",
    deliveryType: "Total",
    goodCondition: false,
    correctIdentification: false,
    countVerified: false,
    hasNovelties: false,
    evidenceAttached: false,
    notes: "",
    delivererName: "",
    delivererId: "",
    authorizationName: "",
    authorizationId: "",
    receiverName: "",
    receiverId: "",
});

const formatDate = (value) => {
    if (!value) return "—";

    const [year, month, day] = String(value).split("-");

    return year && month && day ? `${day}/${month}/${year}` : value;
};

const getProductName = (product) =>
    product?.name ??
    product?.description ??
    `Producto #${product?.id ?? "—"}`;

const getProductQuantity = (product) =>
    Number(product?.units ?? product?.quantity ?? 0);

const readImage = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () =>
            reject(new Error("No se pudo leer la imagen adjunta."));

        reader.readAsDataURL(file);
    });

function SignatureField({
    title,
    name,
    nameValue,
    idValue,
    onNameChange,
    onIdChange,
    signature,
    onSignatureChange,
}) {
    const canvasRef = useRef(null);
    const drawingRef = useRef(false);

    const getPoint = (event) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        return {
            x: ((event.clientX - rect.left) / rect.width) * canvas.width,
            y: ((event.clientY - rect.top) / rect.height) * canvas.height,
        };
    };

    const startDrawing = (event) => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        const point = getPoint(event);

        drawingRef.current = true;
        canvas.setPointerCapture(event.pointerId);
        context.beginPath();
        context.moveTo(point.x, point.y);
    };

    const draw = (event) => {
        if (!drawingRef.current) return;

        const context = canvasRef.current.getContext("2d");
        const point = getPoint(event);

        context.lineWidth = 2;
        context.lineCap = "round";
        context.strokeStyle = "#111827";
        context.lineTo(point.x, point.y);
        context.stroke();

        onSignatureChange(canvasRef.current.toDataURL("image/png"));
    };

    const stopDrawing = () => {
        drawingRef.current = false;
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;

        canvas
            .getContext("2d")
            .clearRect(0, 0, canvas.width, canvas.height);

        onSignatureChange("");
    };

    return (
        <section className="deliverySignature">
            <strong>{title}</strong>

            <canvas
                ref={canvasRef}
                width={900}
                height={220}
                aria-label={title}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
            />

            <FormInput
                title={name}
                placeholder="Nombre completo"
                value={nameValue}
                action={onNameChange}
                required={false}
            />

            <FormInput
                title="C.C."
                placeholder="Número de identificación"
                value={idValue}
                action={onIdChange}
                required={false}
            />

            <FormButton
                type="button"
                text="Limpiar firma"
                onClick={clearSignature}
            />

            {signature && <small>Firma capturada</small>}
        </section>
    );
}

export function FormDeliveryOrder({ orders = [], onCancel }) {
    const { appInfo, userInfo, userConfig } = useAppInfo();

    const [form, setForm] = useState(createInitialForm);
    const [deliveredQuantities, setDeliveredQuantities] = useState({});
    const [delivererSignature, setDelivererSignature] = useState("");
    const [authorizationSignature, setAuthorizationSignature] = useState("");
    const [receiverSignature, setReceiverSignature] = useState("");
    const [attachment, setAttachment] = useState(null);
    const [supportAttachment, setSupportAttachment] = useState(null);
    const [stores, setStores] = useState([]);
    const [storeId, setStoreId] = useState("");
    const [loadingStores, setLoadingStores] = useState(false);
    const [storeError, setStoreError] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const parentInstanceIds = useMemo(
        () =>
            [
                ...new Set(
                    orders
                        .map((order) => order.parentInstanceId)
                        .filter((id) => id != null)
                        .map(String)
                ),
            ],
        [orders]
    );

    const ordersWithoutProcess = useMemo(
        () => orders.filter((order) => !order.parentInstanceId),
        [orders]
    );

    useEffect(() => {
        let cancelled = false;

        const loadStores = async () => {
            if (!appInfo?.company_id) return;

            setLoadingStores(true);
            setStoreError("");

            try {
                const storeAccess = userConfig?.access?.stores;
                const allowedStores =
                    storeAccess?.overAll === true
                        ? undefined
                        : storeAccess
                          ? Array.isArray(storeAccess.enabled)
                              ? storeAccess.enabled
                              : []
                          : undefined;

                const response = await postInfo("/getStores", {
                    company_id: appInfo.company_id,
                    allowedStores,
                });

                if (!response?.[0]) {
                    throw new Error(
                        "No fue posible cargar las sedes disponibles."
                    );
                }

                const options = (response[1] ?? []).map((store) => ({
                    value: String(store.id),
                    text: store.name,
                }));

                if (!cancelled) {
                    setStores(options);

                    if (!options.length) {
                        setStoreError(
                            "No hay sedes disponibles para esta empresa."
                        );
                    }
                }
            } catch (loadError) {
                if (!cancelled) {
                    setStores([]);
                    setStoreError(
                        loadError?.message ??
                            "No fue posible cargar las sedes."
                    );
                }
            } finally {
                if (!cancelled) setLoadingStores(false);
            }
        };

        loadStores();

        return () => {
            cancelled = true;
        };
    }, [appInfo?.company_id, userConfig]);

    const updateField = (key, value) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const getQuantityKey = (order, product, index) =>
        `${order.id}-${product.id ?? index}`;

    const buildPdf = async () => {
        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4",
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const contentWidth = pageWidth - margin * 2;
        let y = margin;

        const addHeader = () => {
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(15);
            pdf.setTextColor(30, 50, 75);
            pdf.text("ORDEN DE ENTREGA AL CLIENTE", margin, y);

            y += 7;
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8);
            pdf.setTextColor(80, 90, 105);
            pdf.text(
                `Fecha de emisión: ${formatDate(form.issueDate)}   Fecha de entrega: ${formatDate(form.deliveryDate)}   Hora: ${form.deliveryTime || "—"}`,
                margin,
                y
            );

            y += 4;
            pdf.setDrawColor(190, 198, 208);
            pdf.line(margin, y, pageWidth - margin, y);
            y += 7;
        };

        const ensureSpace = (height) => {
            if (y + height > pageHeight - 14) {
                pdf.addPage();
                y = margin;
                addHeader();
            }
        };

        const addSectionTitle = (title) => {
            ensureSpace(10);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(9);
            pdf.setTextColor(30, 50, 75);
            pdf.text(title.toLocaleUpperCase("es"), margin, y);
            y += 6;
        };

        const addInfo = (label, value) => {
            ensureSpace(6);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8);
            pdf.setTextColor(65, 75, 90);
            pdf.text(`${label}:`, margin, y);

            pdf.setFont("helvetica", "normal");
            pdf.text(String(value || "—"), margin + 50, y, {
                maxWidth: contentWidth - 50,
            });

            y += 5;
        };

        addHeader();
        addSectionTitle("Datos de despacho");

        addInfo("Sede de despacho", stores.find((store) => store.value === storeId)?.text);
        addInfo("Dirección de recogida / origen de despacho", form.pickupPlace);
        addInfo("Transportadora", form.carrier);
        addInfo("Placa", form.plate);
        addInfo("Conductor / retira", form.driverName);
        addInfo("C.C.", form.driverId);
        addInfo("Teléfono", form.phone);
        addInfo("Bultos / cajas", form.packages);
        addInfo("Peso aproximado", form.approximateWeight);
        addInfo("Hora de salida", form.departureTime);

        const columnWidths = [12, 28, 25, 82, 38, 28, 24, 28];
        const headers = [
            "Ítem",
            "Proceso SGA",
            "Código",
            "Descripción",
            "Tienda",
            "Ciudad",
            "Cant. pedida",
            "Cant. entregada",
        ];

        for (const order of orders) {
            addSectionTitle(`Orden de cliente #${order.reference ?? order.id}`);
            addInfo("Cliente / tercero", order.clientName);
            addInfo(
                "Dirección de recogida / origen de despacho",
                form.pickupPlace
            );

            ensureSpace(9);
            pdf.setFillColor(235, 240, 246);
            pdf.rect(margin, y - 4, contentWidth, 8, "F");

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(6.5);
            pdf.setTextColor(40, 50, 65);

            let x = margin;
            headers.forEach((title, index) => {
                pdf.text(title, x + 1, y, {
                    maxWidth: columnWidths[index] - 2,
                });
                x += columnWidths[index];
            });

            y += 6;

            const products = Array.isArray(order.components)
                ? order.components
                : [];

            products.forEach((product, index) => {
                const key = getQuantityKey(order, product, index);
                const ordered = getProductQuantity(product);
                const delivered =
                    deliveredQuantities[key] ?? String(ordered);

                const description = pdf.splitTextToSize(
                    getProductName(product),
                    columnWidths[3] - 2
                );
                const rowHeight = Math.max(7, description.length * 3.5 + 2);

                ensureSpace(rowHeight);

                const rowValues = [
                    String(index + 1).padStart(2, "0"),
                    String(order.processOwnSerial ?? order.processCode ?? "—"),
                    String(product.code ?? product.productCode ?? "—"),
                    description,
                    String(order.storeName ?? order.store ?? "—"),
                    String(order.city ?? "—"),
                    String(ordered),
                    String(delivered),
                ];

                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(7);
                pdf.setTextColor(35, 42, 52);

                x = margin;
                rowValues.forEach((value, cellIndex) => {
                    pdf.text(
                        Array.isArray(value) ? value : String(value),
                        x + 1,
                        y + 3,
                        { maxWidth: columnWidths[cellIndex] - 2 }
                    );
                    x += columnWidths[cellIndex];
                });

                y += rowHeight;
                pdf.setDrawColor(215, 220, 226);
                pdf.line(margin, y, pageWidth - margin, y);
            });

            if (!products.length) {
                addInfo("Productos", "No hay detalles de productos disponibles.");
            }

            y += 3;
        }

        addSectionTitle("Verificación y recepción");
        addInfo("Tipo de entrega", form.deliveryType);
        addInfo("Persona autorizada para entregar", form.delivererName);
        addInfo("Identificación de quien entrega", form.delivererId);
        addInfo("Nombre de quien recibe", form.receiverName);
        addInfo("Identificación de quien recibe", form.receiverId);
        addInfo("Observaciones / novedades", form.notes);

        const checks = [
            ["Buen estado", form.goodCondition],
            ["Identificación correcta", form.correctIdentification],
            ["Conteo verificado", form.countVerified],
            ["Novedades", form.hasNovelties],
            ["Evidencia", form.evidenceAttached],
        ];

        addInfo(
            "Verificaciones",
            checks
                .filter(([, checked]) => checked)
                .map(([label]) => label)
                .join(", ") || "Ninguna marcada"
        );

        const signatures = [
            ["ENTREGA 4K 360", delivererSignature],
            ["AUTORIZA SALIDA", authorizationSignature],
            ["RECIBE CLIENTE / TRANSPORTADOR", receiverSignature],
        ].filter(([, signature]) => signature);

        if (signatures.length) {
            ensureSpace(48);
            addSectionTitle("Firmas");
            let x = margin;

            signatures.forEach(([label, signature]) => {
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(7);
                pdf.text(label, x, y);
                pdf.addImage(signature, "PNG", x, y + 2, 65, 25);
                x += 88;
            });

            y += 32;
        }

        if (attachment?.type?.startsWith("image/")) {
            const imageData = await readImage(attachment);
            pdf.addPage();
            y = margin;
            addHeader();
            addSectionTitle("Evidencia fotográfica");

            const image = pdf.getImageProperties(imageData);
            const scale = Math.min(
                contentWidth / image.width,
                (pageHeight - y - margin) / image.height
            );

            pdf.addImage(
                imageData,
                "PNG",
                margin,
                y,
                image.width * scale,
                image.height * scale
            );
        } else if (attachment?.name) {
            addInfo("Archivo de soporte adjunto", attachment.name);
        }

        const pageCount = pdf.getNumberOfPages();

        for (let page = 1; page <= pageCount; page += 1) {
            pdf.setPage(page);
            pdf.setFontSize(7);
            pdf.setTextColor(110, 118, 128);
            pdf.text(
                `${page} / ${pageCount}`,
                pageWidth - margin,
                pageHeight - 6,
                { align: "right" }
            );
        }

        return pdf;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!orders.length) {
            setError("Seleccione al menos una orden de cliente.");
            return;
        }

        if (ordersWithoutProcess.length || !parentInstanceIds.length) {
            setError("Una o más órdenes no tienen un proceso SGA asociado.");
            return;
        }

        if (!storeId) {
            setError("Seleccione la sede de despacho.");
            return;
        }

        if (!form.pickupPlace.trim()) {
            setError("Indique la dirección de recogida u origen de despacho.");
            return;
        }

        if (!form.delivererName.trim()) {
            setError("Indique quién realiza la entrega.");
            return;
        }

        if (!form.receiverName.trim()) {
            setError("Indique quién recibe físicamente los productos.");
            return;
        }

        if (!receiverSignature) {
            setError("Falta la firma de quien recibe los productos.");
            return;
        }

        if (!appInfo?.company_id || !userInfo?.user_id) {
            setError("No se pudo identificar la empresa o el usuario activo.");
            return;
        }

        setSaving(true);

        try {
            const pdf = await buildPdf();
            const pdfBlob = pdf.output("blob");
            const fileName = `orden-entrega-${Date.now()}.pdf`;
            const pdfFile = new File([pdfBlob], fileName, {
                type: "application/pdf",
            });

            const pdfUpload = await uploadFiles([pdfFile], {
                company_id: appInfo.company_id,
                user_id: userInfo.user_id,
                store_id: storeId,
                category: "files",
            });

            const uploadedPdf = pdfUpload?.urls?.[0];
            const pdfUrl =
                typeof uploadedPdf === "string"
                    ? uploadedPdf
                    : uploadedPdf?.url;

            if (!pdfUrl) {
                throw new Error("No se pudo guardar el PDF en SGA.");
            }

            const attached = [
                ...(supportAttachment?.url
                    ? [
                          {
                              url: supportAttachment.url,
                              name: supportAttachment.name,
                          },
                      ]
                    : []),
                {
                    url: pdfUrl,
                    name: fileName,
                },
            ];

            const response = await postInfo(
                "/nexo360/registerDeliveryOrder",
                {
                    company_id: appInfo.company_id,
                    user_id: userInfo.user_id,
                    store_id: storeId,
                    attached,
                    values: {
                        ...form,
                        parentInstanceIds,
                        authorizedName: form.delivererName,
                        delivererSignature,
                        authorizationSignature,
                        receiverSignature,
                        attachmentName: attachment?.name ?? null,
                        orders: orders.map((order) => ({
                            clientOrderId:
                                order.doc_id ?? order.documentId ?? order.id,
                            clientOrderNumber: order.reference ?? order.id,
                            parentInstanceId: order.parentInstanceId,
                            thirdPartyId: order.thirdPartyId,
                            thirdPartyName: order.clientName,
                            products: (order.components ?? []).map(
                                (product, index) => {
                                    const key = getQuantityKey(
                                        order,
                                        product,
                                        index
                                    );

                                    return {
                                        productId: product.id,
                                        code:
                                            product.code ??
                                            product.productCode ??
                                            null,
                                        description: getProductName(product),
                                        orderedQuantity:
                                            getProductQuantity(product),
                                        deliveredQuantity:
                                            deliveredQuantities[key] ??
                                            String(
                                                getProductQuantity(product)
                                            ),
                                    };
                                }
                            ),
                        })),
                    },
                }
            );

            if (response?.status !== "OK") {
                throw new Error(
                    response?.message ??
                        "SGA no confirmó el registro de la entrega."
                );
            }

            pdf.save(fileName);
            onCancel?.();
        } catch (submitError) {
            setError(
                submitError?.message ??
                    "No fue posible registrar la entrega ni descargar el PDF."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="FormDeliveryOrder">
            <header className="deliveryOrderHeader">
                <h2>Nueva orden de entrega</h2>
                <p>
                    Complete los datos de despacho y recepción. El PDF se
                    descargará en este dispositivo.
                </p>
            </header>

            <form onSubmit={handleSubmit}>
                <section className="deliverySelectedOrders">
                    <h3>
                        Órdenes y productos que se entregarán ({orders.length})
                    </h3>
                    <p>
                        Se muestra una tabla por orden de cliente. Revise las
                        cantidades antes de generar el documento.
                    </p>

                    {orders.map((order) => (
                        <article
                            className="deliverySelectedOrder"
                            key={`${order.id}-${order.parentInstanceId}`}
                        >
                            <header className="deliverySelectedOrderHeader">
                                <strong>
                                    Orden de cliente #{order.reference ?? order.id}
                                </strong>
                                <span>
                                    Proceso SGA:{" "}
                                    {order.processOwnSerial ??
                                        order.processCode ??
                                        "—"}
                                </span>
                            </header>

                            <p className="deliverySelectedOrderClient">
                                Cliente / tercero: {order.clientName || "—"} ·
                                Tienda: {order.storeName || order.store || "—"} ·
                                Ciudad: {order.city || "—"}
                            </p>

                            <div className="deliveryOrderTableWrap">
                                <table className="deliveryOrderTable">
                                    <thead>
                                        <tr>
                                            <th>Ítem</th>
                                            <th>Proceso SGA</th>
                                            <th>Código</th>
                                            <th>Descripción</th>
                                            <th>Tienda</th>
                                            <th>Ciudad</th>
                                            <th>Cant. pedida</th>
                                            <th>Cant. entregada</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(order.components ?? []).length ? (
                                            order.components.map(
                                                (product, index) => {
                                                    const key = getQuantityKey(
                                                        order,
                                                        product,
                                                        index
                                                    );
                                                    const ordered =
                                                        getProductQuantity(product);

                                                    return (
                                                        <tr
                                                            key={`${order.id}-${product.id ?? index}`}
                                                        >
                                                            <td>
                                                                {String(
                                                                    index + 1
                                                                ).padStart(2, "0")}
                                                            </td>
                                                            <td>
                                                                {order.processOwnSerial ??
                                                                    order.processCode ??
                                                                    "—"}
                                                            </td>
                                                            <td>
                                                                {product.code ??
                                                                    product.productCode ??
                                                                    "—"}
                                                            </td>
                                                            <td>
                                                                {getProductName(product)}
                                                            </td>
                                                            <td>
                                                                {order.storeName ??
                                                                    order.store ??
                                                                    "—"}
                                                            </td>
                                                            <td>
                                                                {order.city ?? "—"}
                                                            </td>
                                                            <td>{ordered}</td>
                                                            <td>
                                                                <FormInput
                                                                    title=""
                                                                    type="number"
                                                                    min="0"
                                                                    step="any"
                                                                    value={
                                                                        deliveredQuantities[
                                                                            key
                                                                        ] ??
                                                                        String(
                                                                            ordered
                                                                        )
                                                                    }
                                                                    action={(value) =>
                                                                        setDeliveredQuantities(
                                                                            (current) => ({
                                                                                ...current,
                                                                                [key]: value,
                                                                            })
                                                                        )
                                                                    }
                                                                    required={false}
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            )
                                        ) : (
                                            <tr>
                                                <td colSpan="8">
                                                    El informe no incluyó
                                                    productos para esta orden.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </article>
                    ))}
                </section>

                <div className="deliveryOrderGrid">
                    <div className="deliveryStoreField">
                        <SearchinList
                            title="Sede de despacho"
                            placeHolder={
                                loadingStores
                                    ? "Cargando sedes..."
                                    : "Seleccione la sede desde donde se despacha"
                            }
                            list={stores}
                            value={storeId}
                            action={setStoreId}
                            disabled={loadingStores || stores.length === 0}
                            canClear
                        />
                        {storeError && (
                            <small className="deliveryFormError">
                                {storeError}
                            </small>
                        )}
                    </div>

                    <FormInput
                        title="Fecha de emisión del documento"
                        type="date"
                        value={form.issueDate}
                        action={(value) => updateField("issueDate", value)}
                    />
                    <FormInput
                        title="Fecha prevista o real de entrega"
                        type="date"
                        value={form.deliveryDate}
                        action={(value) => updateField("deliveryDate", value)}
                    />
                    <FormInput
                        title="Hora de entrega"
                        type="time"
                        value={form.deliveryTime}
                        action={(value) => updateField("deliveryTime", value)}
                        required={false}
                    />
                    <FormInput
                        title="Dirección de recogida / origen de despacho"
                        placeholder="Dirección, bodega o sede de salida"
                        value={form.pickupPlace}
                        action={(value) => updateField("pickupPlace", value)}
                    />
                    <FormInput
                        title="Transportadora"
                        placeholder="Nombre de la transportadora"
                        value={form.carrier}
                        action={(value) => updateField("carrier", value)}
                        required={false}
                    />
                    <FormInput
                        title="Placa"
                        placeholder="Placa del vehículo"
                        value={form.plate}
                        action={(value) => updateField("plate", value)}
                        required={false}
                    />
                    <FormInput
                        title="Conductor / retira"
                        placeholder="Nombre completo de quien retira"
                        value={form.driverName}
                        action={(value) => updateField("driverName", value)}
                        required={false}
                    />
                    <FormInput
                        title="C.C."
                        placeholder="Identificación de quien retira"
                        value={form.driverId}
                        action={(value) => updateField("driverId", value)}
                        required={false}
                    />
                    <FormInput
                        title="Teléfono"
                        type="tel"
                        placeholder="Teléfono de contacto"
                        value={form.phone}
                        action={(value) => updateField("phone", value)}
                        required={false}
                    />
                    <FormInput
                        title="Bultos / cajas"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Cantidad de bultos o cajas"
                        value={form.packages}
                        action={(value) => updateField("packages", value)}
                        required={false}
                    />
                    <FormInput
                        title="Peso aproximado"
                        placeholder="Peso y unidad, por ejemplo 20 kg"
                        value={form.approximateWeight}
                        action={(value) =>
                            updateField("approximateWeight", value)
                        }
                        required={false}
                    />
                    <FormInput
                        title="Hora de salida"
                        type="time"
                        value={form.departureTime}
                        action={(value) =>
                            updateField("departureTime", value)
                        }
                        required={false}
                    />
                </div>

                <fieldset className="deliveryChecks">
                    <legend>Verificación de entrega</legend>
                    <SwitchOption
                        state1="Total"
                        state2="Parcial"
                        value={form.deliveryType === "Parcial"}
                        action={(isPartial) =>
                            updateField(
                                "deliveryType",
                                isPartial ? "Parcial" : "Total"
                            )
                        }
                    />
                    <CheckSquare
                        title="Buen estado"
                        checked={form.goodCondition}
                        action={(value) => updateField("goodCondition", value)}
                    />
                    <CheckSquare
                        title="Identificación correcta"
                        checked={form.correctIdentification}
                        action={(value) =>
                            updateField("correctIdentification", value)
                        }
                    />
                    <CheckSquare
                        title="Conteo verificado"
                        checked={form.countVerified}
                        action={(value) => updateField("countVerified", value)}
                    />
                    <CheckSquare
                        title="Novedades"
                        checked={form.hasNovelties}
                        action={(value) => updateField("hasNovelties", value)}
                    />
                    <CheckSquare
                        title="Evidencia"
                        checked={form.evidenceAttached}
                        action={(value) =>
                            updateField("evidenceAttached", value)
                        }
                    />
                </fieldset>

                <FormInput
                    title="Observaciones / novedades"
                    textArea
                    value={form.notes}
                    placeholder="Describa faltantes, novedades o condiciones de la entrega"
                    action={(value) => updateField("notes", value)}
                    required={false}
                />

                <section className="deliverySignatures">
                    <SignatureField
                        title="ENTREGA 4K 360"
                        name="Nombre / C.C. / cargo"
                        nameValue={form.delivererName}
                        idValue={form.delivererId}
                        onNameChange={(value) =>
                            updateField("delivererName", value)
                        }
                        onIdChange={(value) =>
                            updateField("delivererId", value)
                        }
                        signature={delivererSignature}
                        onSignatureChange={setDelivererSignature}
                    />
                    <SignatureField
                        title="AUTORIZA SALIDA"
                        name="Nombre / C.C. / cargo"
                        nameValue={form.authorizationName}
                        idValue={form.authorizationId}
                        onNameChange={(value) =>
                            updateField("authorizationName", value)
                        }
                        onIdChange={(value) =>
                            updateField("authorizationId", value)
                        }
                        signature={authorizationSignature}
                        onSignatureChange={setAuthorizationSignature}
                    />
                    <SignatureField
                        title="RECIBE CLIENTE / TRANSPORTADOR"
                        name="Nombre / C.C."
                        nameValue={form.receiverName}
                        idValue={form.receiverId}
                        onNameChange={(value) =>
                            updateField("receiverName", value)
                        }
                        onIdChange={(value) =>
                            updateField("receiverId", value)
                        }
                        signature={receiverSignature}
                        onSignatureChange={setReceiverSignature}
                    />
                </section>

                <div className="deliveryAttachmentOptions">
                    <strong>Adjuntar foto o documento de soporte</strong>
                    <small>
                        Las imágenes se agregan al PDF como anexo. Los PDF se
                        indican por nombre.
                    </small>
                    <FileInput
                        category="files"
                        accept=".pdf,image/*"
                        includeFiles
                        action={(files) => {
                            const selected = files?.[0] ?? null;

                            setAttachment(selected?.file ?? selected);
                            setSupportAttachment(
                                selected?.url
                                    ? {
                                          url: selected.url,
                                          name:
                                              selected.name ??
                                              selected.file?.name,
                                      }
                                    : null
                            );
                        }}
                        placeholder="Seleccionar archivo"
                    />
                </div>

                {error && (
                    <p className="deliveryFormError" role="alert">
                        {error}
                    </p>
                )}

                <footer className="deliveryOrderActions">
                    <FormButton
                        type="button"
                        text="Cancelar"
                        negative
                        onClick={onCancel}
                    />
                    <FormButton
                        type="submit"
                        text={
                            saving
                                ? "Registrando entrega..."
                                : "Registrar y descargar PDF"
                        }
                        disabled={
                            saving ||
                            !orders.length ||
                            loadingStores ||
                            !storeId
                        }
                    />
                </footer>
            </form>
        </section>
    );
}