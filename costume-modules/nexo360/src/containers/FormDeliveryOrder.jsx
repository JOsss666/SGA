import { useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import "./FormDeliveryOrder.css";

const COMPANY = {
    name: "4K 360 S.A.S.",
    nit: "902107038-2",
    address: "CR 51 A NO. 38 A - 16 SUR",
    city: "Bogotá, D.C.",
    phone: "3178788214",
};

const localDate = () => {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${date.getFullYear()}-${month}-${day}`;
};

const createInitialForm = (delivererName) => ({
    issueDate: localDate(),
    deliveryDate: localDate(),
    deliveryTime: "",
    pickupPlace: "",
    authorizedName: delivererName,
    authorizedId: "",
    authorizedPhone: "",
    vehicleType: "",
    plate: "",
    receiverName: "",
    receiverId: "",
    notes: "",
});

const normalizeText = (value) =>
    String(value ?? "")
        .trim()
        .toLocaleLowerCase("es")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

const formatDate = (value) => {
    if (!value) return "—";

    const [year, month, day] = String(value).split("-");

    if (!year || !month || !day) return value;

    return `${day}/${month}/${year}`;
};

const getProductName = (product) =>
    product?.name ??
    product?.description ??
    `Producto #${product?.id ?? "—"}`;

const getProductQuantity = (product) =>
    product?.units ?? product?.quantity ?? "—";

function imageFileToPng(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onerror = () => reject(new Error("No se pudo leer la imagen."));

        reader.onload = () => {
            const image = new Image();

            image.onerror = () =>
                reject(new Error("No se pudo abrir la imagen adjunta."));

            image.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;

                const context = canvas.getContext("2d");

                if (!context) {
                    reject(new Error("No se pudo procesar la imagen adjunta."));
                    return;
                }

                context.drawImage(image, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            };

            image.src = String(reader.result);
        };

        reader.readAsDataURL(file);
    });
}

function SignatureField({ title, description, value, onChange }) {
    const canvasRef = useRef(null);
    const drawingRef = useRef(false);

    const getPoint = (event) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        return {
            x: (event.clientX - rect.left) * (canvas.width / rect.width),
            y: (event.clientY - rect.top) * (canvas.height / rect.height),
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

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        const point = getPoint(event);

        context.lineWidth = 2;
        context.lineCap = "round";
        context.strokeStyle = "#111827";
        context.lineTo(point.x, point.y);
        context.stroke();

        onChange(canvas.toDataURL("image/png"));
    };

    const stopDrawing = () => {
        drawingRef.current = false;
    };

    const clear = () => {
        const canvas = canvasRef.current;

        canvas
            .getContext("2d")
            .clearRect(0, 0, canvas.width, canvas.height);

        onChange("");
    };

    return (
        <div className="deliverySignature">
            <label>{title}</label>
            {description && <small>{description}</small>}

            <canvas
                ref={canvasRef}
                width={900}
                height={220}
                aria-label={title}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
                onPointerLeave={stopDrawing}
            />

            <button type="button" onClick={clear}>
                Limpiar firma
            </button>

            {value && <span>Firma capturada</span>}
        </div>
    );
}

export function FormDeliveryOrder({
    orders = [],
    delivererName = "",
    onCancel,
    onSubmit,
}) {
    const [form, setForm] = useState(() => createInitialForm(delivererName));
    const [delivererSignature, setDelivererSignature] = useState("");
    const [receiverSignature, setReceiverSignature] = useState("");
    const [attachment, setAttachment] = useState(null);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const parentInstanceIds = useMemo(
        () => [
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

    const updateField = (key, value) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const buildPdf = async () => {
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 9;
        const contentWidth = pageWidth - margin * 2;

        const colors = {
            black: [17, 17, 17],
            text: [35, 39, 47],
            muted: [89, 98, 114],
            border: [216, 221, 229],
            light: [248, 250, 252],
            white: [255, 255, 255],
        };

        let y = 0;

        const drawHeader = () => {
            pdf.setTextColor(...colors.black);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(16);
            pdf.text("4K 360", margin, 14);

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8.5);
            pdf.text(COMPANY.name, margin, 20);

            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(...colors.muted);
            pdf.setFontSize(7);
            pdf.text(
                `NIT ${COMPANY.nit} · ${COMPANY.address}`,
                margin,
                25
            );
            pdf.text(
                `${COMPANY.city} · Tel. ${COMPANY.phone}`,
                margin,
                29
            );

            pdf.setTextColor(...colors.black);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(15);
            pdf.text("ORDEN DE ENTREGA", pageWidth - margin, 15, {
                align: "right",
            });

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8);
            pdf.setTextColor(...colors.muted);
            pdf.text(
                `Emitida: ${formatDate(form.issueDate)}`,
                pageWidth - margin,
                21,
                { align: "right" }
            );
            pdf.text(
                `Entrega: ${formatDate(form.deliveryDate)}${
                    form.deliveryTime ? ` · ${form.deliveryTime}` : ""
                }`,
                pageWidth - margin,
                26,
                { align: "right" }
            );

            pdf.setDrawColor(...colors.black);
            pdf.setLineWidth(0.6);
            pdf.line(margin, 34, pageWidth - margin, 34);

            y = 39;
        };

        const newPage = () => {
            pdf.addPage();
            drawHeader();
        };

        const ensureSpace = (height) => {
            if (y + height > pageHeight - 12) {
                newPage();
            }
        };

        const addSection = (title) => {
            ensureSpace(9);

            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(...colors.black);
            pdf.setFontSize(9);
            pdf.text(title.toLocaleUpperCase("es"), margin, y + 4);

            pdf.setDrawColor(...colors.border);
            pdf.setLineWidth(0.25);
            pdf.line(margin, y + 6, pageWidth - margin, y + 6);

            y += 9;
        };

        const addInfoCell = (label, value, x, cellY, width, height = 13) => {
            pdf.setDrawColor(...colors.border);
            pdf.setFillColor(...colors.white);
            pdf.roundedRect(x, cellY, width, height, 1.5, 1.5, "FD");

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(6.5);
            pdf.setTextColor(...colors.muted);
            pdf.text(label.toLocaleUpperCase("es"), x + 2, cellY + 4);

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8);
            pdf.setTextColor(...colors.text);

            const lines = pdf.splitTextToSize(
                String(value || "—"),
                width - 4
            );

            pdf.text(lines.slice(0, 2), x + 2, cellY + 8);
        };

        const addCompactStrip = (items) => {
            const gap = 2;
            const cellWidth =
                (contentWidth - gap * (items.length - 1)) / items.length;
            const cellHeight = 13;

            ensureSpace(cellHeight + 2);

            items.forEach((item, index) => {
                addInfoCell(
                    item.label,
                    item.value,
                    margin + index * (cellWidth + gap),
                    y,
                    cellWidth,
                    cellHeight
                );
            });

            y += cellHeight + 2;
        };

        // Única definición: agrega una imagen como anexo al PDF.
        const addAttachmentPage = async (file) => {
            if (!file) return;

            pdf.addPage();
            drawHeader();
            y += 2;
            addSection("Anexo · soporte de la entrega");

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8);
            pdf.setTextColor(...colors.muted);
            pdf.text(`Archivo: ${file.name}`, margin, y + 2);
            y += 8;

            if (!file.type.startsWith("image/")) {
                pdf.setDrawColor(...colors.border);
                pdf.roundedRect(
                    margin,
                    y,
                    contentWidth,
                    22,
                    1.5,
                    1.5,
                    "S"
                );

                pdf.setTextColor(...colors.muted);
                pdf.setFontSize(8);
                pdf.text(
                    "El archivo adjunto es un PDF y no se combina dentro de la orden. Se indica aquí su nombre como referencia.",
                    margin + 3,
                    y + 9,
                    { maxWidth: contentWidth - 6 }
                );

                return;
            }

            const imageData = await imageFileToPng(file);
            const imageProperties = pdf.getImageProperties(imageData);
            const maxWidth = contentWidth;
            const maxHeight = pageHeight - y - 16;
            const scale = Math.min(
                maxWidth / imageProperties.width,
                maxHeight / imageProperties.height
            );
            const width = imageProperties.width * scale;
            const height = imageProperties.height * scale;
            const x = margin + (contentWidth - width) / 2;

            pdf.setDrawColor(...colors.border);
            pdf.roundedRect(
                margin,
                y,
                contentWidth,
                Math.min(height + 6, pageHeight - y - 14),
                1.5,
                1.5,
                "S"
            );

            pdf.addImage(imageData, "PNG", x, y + 3, width, height);
        };

        drawHeader();

        addSection("Datos generales");

        const gap = 2;
        const infoCellWidth = (contentWidth - gap * 3) / 4;

        [
            { label: "Fecha de emisión", value: formatDate(form.issueDate) },
            { label: "Fecha de entrega", value: formatDate(form.deliveryDate) },
            { label: "Hora", value: form.deliveryTime || "—" },
            { label: "Órdenes incluidas", value: String(orders.length) },
        ].forEach((item, index) => {
            addInfoCell(
                item.label,
                item.value,
                margin + index * (infoCellWidth + gap),
                y,
                infoCellWidth,
                13
            );
        });

        y += 15;

        pdf.setFillColor(...colors.light);
        pdf.setDrawColor(...colors.border);
        pdf.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, "FD");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(...colors.muted);
        pdf.text("LUGAR DE RECOGIDA", margin + 3, y + 4);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(...colors.text);
        pdf.text(
            pdf.splitTextToSize(
                form.pickupPlace || "No especificado",
                contentWidth - 6
            )[0],
            margin + 3,
            y + 9
        );

        y += 15;

        addSection("Transporte y personas responsables");

        addCompactStrip([
            {
                label: "Persona autorizada para entregar",
                value: form.authorizedName,
            },
            { label: "Identificación", value: form.authorizedId },
            { label: "Teléfono de contacto", value: form.authorizedPhone },
        ]);

        addCompactStrip([
            { label: "Tipo de vehículo", value: form.vehicleType },
            { label: "Placa", value: form.plate },
            { label: "Persona que recibe", value: form.receiverName },
            { label: "Identificación de quien recibe", value: form.receiverId },
        ]);

        addSection(`Productos a entregar · ${orders.length} orden(es)`);

        const productX = margin + 3;
        const quantityX = pageWidth - margin - 24;
        const productWidth = quantityX - productX - 4;

        orders.forEach((order) => {
            const orderNumber = order.reference ?? order.id ?? "—";
            const productionNumber =
                order.processCode && order.processOwnSerial
                    ? `${order.processCode}#${order.processOwnSerial}`
                    : order.processOwnSerial ?? "—";
            const products = Array.isArray(order.components)
                ? order.components
                : [];

            ensureSpace(17);

            pdf.setFillColor(245, 247, 250);
            pdf.setDrawColor(...colors.border);
            pdf.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, "FD");

            pdf.setTextColor(...colors.black);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8);
            pdf.text(`Orden cliente #${orderNumber}`, margin + 3, y + 5);

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(7);
            pdf.text(
                `OP ${productionNumber} · ${
                    order.clientName || "Tercero sin nombre"
                }${
                    order.thirdPartyId
                        ? ` · ID ${order.thirdPartyId}`
                        : ""
                }`,
                margin + 3,
                y + 10
            );

            y += 14;

            pdf.setFillColor(...colors.light);
            pdf.rect(margin, y, contentWidth, 7, "F");

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(6.5);
            pdf.setTextColor(...colors.muted);
            pdf.text("PRODUCTO / DESCRIPCIÓN", productX, y + 4.7);
            pdf.text("CANT.", quantityX, y + 4.7);

            y += 7;

            if (!products.length) {
                ensureSpace(8);
                pdf.setFont("helvetica", "italic");
                pdf.setFontSize(7);
                pdf.setTextColor(...colors.muted);
                pdf.text(
                    "El informe no incluyó productos para esta orden.",
                    productX,
                    y + 5
                );
                y += 8;
            } else {
                products.forEach((product) => {
                    const lines = pdf.splitTextToSize(
                        getProductName(product),
                        productWidth
                    );
                    const rowHeight = Math.max(7, lines.length * 3.5 + 3);

                    ensureSpace(rowHeight);

                    pdf.setFont("helvetica", "normal");
                    pdf.setFontSize(7.5);
                    pdf.setTextColor(...colors.text);
                    pdf.text(lines, productX, y + 4.5);

                    pdf.setFont("helvetica", "bold");
                    pdf.text(
                        String(getProductQuantity(product)),
                        quantityX,
                        y + 4.5
                    );

                    pdf.setDrawColor(...colors.border);
                    pdf.setLineWidth(0.2);
                    pdf.line(
                        margin,
                        y + rowHeight,
                        pageWidth - margin,
                        y + rowHeight
                    );

                    y += rowHeight;
                });
            }

            y += 3;
        });

        const totalProducts = orders.reduce(
            (sum, order) =>
                sum +
                (Array.isArray(order.components)
                    ? order.components.length
                    : 0),
            0
        );

        const totalUnits = orders.reduce(
            (sum, order) =>
                sum +
                (order.components ?? []).reduce((subtotal, product) => {
                    const quantity = Number(
                        product.units ?? product.quantity ?? 0
                    );

                    return subtotal + (Number.isFinite(quantity) ? quantity : 0);
                }, 0),
            0
        );

        addCompactStrip([
            { label: "Órdenes cliente relacionadas", value: orders.length },
            { label: "Referencias / líneas", value: totalProducts },
            { label: "Unidades totales", value: totalUnits },
        ]);

        if (form.notes.trim()) {
            addSection("Observaciones generales");

            const noteLines = pdf.splitTextToSize(
                form.notes.trim(),
                contentWidth - 6
            );
            const noteHeight = Math.max(14, noteLines.length * 3.6 + 6);

            ensureSpace(noteHeight);

            pdf.setDrawColor(...colors.border);
            pdf.roundedRect(
                margin,
                y,
                contentWidth,
                noteHeight,
                1.5,
                1.5,
                "S"
            );

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(7.5);
            pdf.setTextColor(...colors.text);
            pdf.text(noteLines, margin + 3, y + 5);

            y += noteHeight + 3;
        }

        ensureSpace(37);
        addSection("Constancia de entrega y recepción");

        const signatureGap = 4;
        const signatureWidth = (contentWidth - signatureGap) / 2;
        const signatureHeight = 27;

        const drawSignature = (x, title, name, id, image) => {
            pdf.setDrawColor(...colors.border);
            pdf.roundedRect(
                x,
                y,
                signatureWidth,
                signatureHeight,
                1.5,
                1.5,
                "S"
            );

            if (image) {
                pdf.addImage(
                    image,
                    "PNG",
                    x + 3,
                    y + 1,
                    signatureWidth - 6,
                    14
                );
            }

            pdf.setDrawColor(150, 150, 150);
            pdf.line(x + 3, y + 17, x + signatureWidth - 3, y + 17);

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(6.5);
            pdf.setTextColor(...colors.text);
            pdf.text(title.toLocaleUpperCase("es"), x + 3, y + 21);

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(6);
            pdf.setTextColor(...colors.muted);
            pdf.text(
                pdf.splitTextToSize(
                    `${name || "Nombre: —"}${id ? ` · ID ${id}` : ""}`,
                    signatureWidth - 6
                )[0],
                x + 3,
                y + 25
            );
        };

        drawSignature(
            margin,
            "Firma de quien entrega",
            form.authorizedName,
            form.authorizedId,
            delivererSignature
        );

        drawSignature(
            margin + signatureWidth + signatureGap,
            "Firma de quien recibe",
            form.receiverName,
            form.receiverId,
            receiverSignature
        );

        y += signatureHeight + 4;

        if (attachment) {
            await addAttachmentPage(attachment);
        }

        const pageCount = pdf.internal.getNumberOfPages();

        for (let page = 1; page <= pageCount; page += 1) {
            pdf.setPage(page);
            pdf.setDrawColor(...colors.border);
            pdf.setLineWidth(0.2);
            pdf.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);

            pdf.setTextColor(...colors.muted);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(6.5);
            pdf.text(
                "Documento generado localmente · 4K 360 S.A.S.",
                margin,
                pageHeight - 5
            );
            pdf.text(
                `${page} / ${pageCount}`,
                pageWidth - margin,
                pageHeight - 5,
                { align: "right" }
            );
        }

        return pdf;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!orders.length) {
            setError("Selecciona al menos una orden.");
            return;
        }

        if (ordersWithoutProcess.length) {
            setError(
                "Una o más órdenes no tienen una orden de producción asociada."
            );
            return;
        }

        if (!parentInstanceIds.length) {
            setError("No se encontraron órdenes de producción para entregar.");
            return;
        }

        if (!form.authorizedName.trim()) {
            setError(
                "Escribe el nombre de la persona autorizada para entregar los productos."
            );
            return;
        }

        if (!form.receiverName.trim()) {
            setError(
                "Escribe el nombre completo de quien recibe físicamente los productos."
            );
            return;
        }

        if (!receiverSignature) {
            setError("Falta la firma de quien recibe la mercancía.");
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

            const payload = {
                parentInstanceIds,
                issueDate: form.issueDate,
                deliveryDate: form.deliveryDate,
                deliveryTime: form.deliveryTime,
                pickupPlace: form.pickupPlace,
                authorizedName: form.authorizedName,
                authorizedId: form.authorizedId,
                authorizedPhone: form.authorizedPhone,
                vehicleType: form.vehicleType,
                plate: form.plate,
                receiverName: form.receiverName,
                receiverId: form.receiverId,
                notes: form.notes,
                delivererSignature,
                receiverSignature,
                orders: orders.map((order) => ({
                    clientOrderId: order.doc_id ?? order.id,
                    clientOrderNumber: order.reference ?? order.id,
                    parentInstanceId: order.parentInstanceId,
                    productionOrderNumber: order.processOwnSerial,
                    thirdPartyId: order.thirdPartyId,
                    thirdPartyName: order.clientName,
                    products: (order.components ?? []).map((product) => ({
                        productId: product.id,
                        name: getProductName(product),
                        quantity:
                            product.units ?? product.quantity ?? null,
                        provider: product.provider ?? null,
                        workOrder: product.workOrder ?? null,
                    })),
                })),
            };

            if (onSubmit) {
                await onSubmit({
                    payload,
                    attachment,
                    pdfFile,
                    pdfBlob,
                });
            } else {
                pdf.save(fileName);
            }
            
            onCancel?.();

        } catch (submitError) {
            setError(
                submitError.message ||
                    "No se pudo generar el PDF de la orden de entrega."
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
                    Completa los datos de transporte y recepción. El PDF se
                    descargará en este dispositivo.
                </p>
            </header>

            <form onSubmit={handleSubmit}>
                <div className="deliveryOrderGrid">
                    <label>
                        Fecha de emisión del documento
                        <input
                            type="date"
                            required
                            value={form.issueDate}
                            onChange={(event) =>
                                updateField("issueDate", event.target.value)
                            }
                        />
                        <small>Fecha en que preparas esta orden.</small>
                    </label>

                    <label>
                        Fecha prevista o real de entrega
                        <input
                            type="date"
                            required
                            value={form.deliveryDate}
                            onChange={(event) =>
                                updateField("deliveryDate", event.target.value)
                            }
                        />
                    </label>

                    <label>
                        Hora de entrega
                        <input
                            type="time"
                            value={form.deliveryTime}
                            onChange={(event) =>
                                updateField("deliveryTime", event.target.value)
                            }
                        />
                    </label>

                    <label>
                        Lugar de recogida de los productos
                        <input
                            value={form.pickupPlace}
                            placeholder="Ejemplo: bodega, dirección o sede"
                            onChange={(event) =>
                                updateField("pickupPlace", event.target.value)
                            }
                        />
                    </label>

                    <label>
                        Persona autorizada para entregar la mercancía
                        <input
                            required
                            value={form.authorizedName}
                            placeholder="Nombre completo de quien entrega"
                            onChange={(event) =>
                                updateField("authorizedName", event.target.value)
                            }
                        />
                    </label>

                    <label>
                        Documento de identidad de quien entrega
                        <input
                            value={form.authorizedId}
                            placeholder="Cédula u otro documento"
                            onChange={(event) =>
                                updateField("authorizedId", event.target.value)
                            }
                        />
                    </label>

                    <label>
                        Teléfono de contacto de quien entrega
                        <input
                            type="tel"
                            value={form.authorizedPhone}
                            placeholder="Número de contacto"
                            onChange={(event) =>
                                updateField("authorizedPhone", event.target.value)
                            }
                        />
                    </label>

                    <label>
                        Tipo de vehículo que transporta los productos
                        <input
                            value={form.vehicleType}
                            placeholder="Ejemplo: camión, furgón o camioneta"
                            onChange={(event) =>
                                updateField("vehicleType", event.target.value)
                            }
                        />
                    </label>

                    <label>
                        Placa del vehículo
                        <input
                            value={form.plate}
                            placeholder="Ejemplo: ABC123"
                            onChange={(event) =>
                                updateField("plate", event.target.value)
                            }
                        />
                    </label>

                    <label>
                        Nombre completo de quien recibe los productos
                        <input
                            required
                            value={form.receiverName}
                            placeholder="Persona que recibe físicamente la mercancía"
                            onChange={(event) =>
                                updateField("receiverName", event.target.value)
                            }
                        />
                    </label>

                    <label>
                        Documento de identidad de quien recibe
                        <input
                            value={form.receiverId}
                            placeholder="Cédula u otro documento"
                            onChange={(event) =>
                                updateField("receiverId", event.target.value)
                            }
                        />
                    </label>
                </div>

                <section className="deliverySelectedOrders">
                    <h3>
                        Productos seleccionados para entrega ({orders.length})
                    </h3>
                    <p>
                        Confirma las órdenes, los clientes o terceros y los
                        productos incluidos.
                    </p>

                    {orders.map((order) => (
                        <article
                            className="deliverySelectedOrder"
                            key={`${order.id}-${order.parentInstanceId}`}
                        >
                            <div className="deliverySelectedOrderHeader">
                                <strong>
                                    Orden de cliente #{order.reference ?? order.id}
                                </strong>
                                <span>
                                    OP {order.processCode}#
                                    {order.processOwnSerial ?? "—"}
                                </span>
                            </div>

                            <p className="deliverySelectedOrderClient">
                                Cliente o tercero:{" "}
                                {order.clientName || "Sin nombre"}
                                {order.thirdPartyId
                                    ? ` · ID ${order.thirdPartyId}`
                                    : ""}
                            </p>

                            {order.components?.length > 0 ? (
                                <ul>
                                    {order.components.map((product, index) => (
                                        <li
                                            key={
                                                product.id ??
                                                `${order.id}-product-${index}`
                                            }
                                        >
                                            <span>{getProductName(product)}</span>
                                            <span>
                                                Cantidad: {getProductQuantity(product)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>
                                    El informe no incluyó el detalle de productos
                                    de esta orden.
                                </p>
                            )}
                        </article>
                    ))}
                </section>

                <label className="deliveryNotes">
                    Observaciones generales de la entrega
                    <textarea
                        rows="3"
                        placeholder="Ejemplo: entrega completa, entrega parcial o novedad durante el transporte"
                        value={form.notes}
                        onChange={(event) =>
                            updateField("notes", event.target.value)
                        }
                    />
                </label>

                <div className="deliverySignatures">
                    <SignatureField
                        title="Firma de quien entrega"
                        description="Firma la persona autorizada que entrega los productos."
                        value={delivererSignature}
                        onChange={setDelivererSignature}
                    />

                    <SignatureField
                        title="Firma de quien recibe"
                        description="Firma la persona que confirma la recepción."
                        value={receiverSignature}
                        onChange={setReceiverSignature}
                    />
                </div>

                <div className="deliveryAttachmentOptions">
                    <label className="deliveryAttachment">
                        Adjuntar foto o documento de soporte
                        <small>
                            Las imágenes se agregan al PDF como anexo. Los PDF
                            adjuntos se indican por nombre, pero no se combinan.
                        </small>
                        <input
                            type="file"
                            accept=".pdf,image/*"
                            onChange={(event) =>
                                setAttachment(event.target.files?.[0] ?? null)
                            }
                        />
                    </label>

                    <label className="deliveryAttachment">
                        Tomar foto con la cámara
                        <small>
                            En un celular, abre la cámara para fotografiar el
                            soporte de la entrega.
                        </small>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(event) =>
                                setAttachment(event.target.files?.[0] ?? null)
                            }
                        />
                    </label>

                    {attachment && (
                        <div className="deliveryAttachmentSelected">
                            Archivo seleccionado: {attachment.name}
                            <button
                                type="button"
                                onClick={() => setAttachment(null)}
                            >
                                Quitar archivo
                            </button>
                        </div>
                    )}
                </div>

                {error && (
                    <p className="deliveryFormError" role="alert">
                        {error}
                    </p>
                )}

                <footer className="deliveryOrderActions">
                    <button type="button" onClick={() => onCancel?.()}>
                        Cancelar
                    </button>

                    <button type="submit" disabled={saving || !orders.length}>
                        {saving ? "Generando PDF…" : "Generar y descargar PDF"}
                    </button>
                </footer>
            </form>
        </section>
    );
}


