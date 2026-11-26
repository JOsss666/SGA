import { useDataBase } from "../../app.js";
import { createNexoOtpReportHandler } from "./nexoOtpReportController.js";
import { createNexoProcessReportHandler } from "./nexoProcessReportController.js";
import utilsController from "../utilsController.js";
import processController from "../processController.js";
import { createNexo360Service } from "../../services/costumeServices/nexo360service.js";
import { createProcessInstance } from "../../services/processInstanceService.js";

const nexo360Controller = createNexo360Service({
    withTransaction: utilsController.withTransaction,
    advanceProcessInstance: processController.advanceProcessInstance,
    createProcessInstance,
    registerDocument: utilsController.registerDocument,
    registerPurchaseItems: utilsController.registerPurchaseItems,
    linkDocumentInstances: utilsController.linkDocumentInstances,
});

nexo360Controller.getOtpProductionReport =
    createNexoOtpReportHandler({ useDataBase });

nexo360Controller.getProcessAdministrationReport =
    createNexoProcessReportHandler({ useDataBase });

nexo360Controller.registerDeliveryOrder = async (req, res) => {
    try {
        const body = req.body ?? {};
        const companyId = String(
            req.get?.("X-SGA-Company-Id") ?? body.company_id ?? ""
        ).trim();
        const userId = String(body.user_id ?? "").trim();
        const storeId = String(body.store_id ?? "").trim();

        if (!/^[1-9]\d*$/.test(companyId)) {
            return res.status(400).json({
                status: "ERROR",
                message: "Se requiere una empresa válida.",
            });
        }

        if (!/^[1-9]\d*$/.test(userId)) {
            return res.status(400).json({
                status: "ERROR",
                message: "Se requiere un usuario válido.",
            });
        }

        if (!/^[1-9]\d*$/.test(storeId)) {
            return res.status(400).json({
                status: "ERROR",
                message: "Seleccione una sede de despacho.",
            });
        }

        const submittedValues = body.values ?? {};
        const description = String(
            submittedValues.description ?? "Orden de entrega 4K 360"
        ).trim();

        const result = await utilsController.withTransaction(async (client) => {
            const document = await utilsController.registerDocument(
                {
                    company_id: companyId,
                    store_id: storeId,
                    thirdParty_id: null,
                    doc_type: "JSON Parametrization",
                    status: "active",
                    subTotal: 0,
                    total: 0,
                    created_by: userId,
                    description,
                    attached: Array.isArray(body.attached)
                        ? body.attached
                        : [],
                    specialConfig: {
                        type: "4KDeliveryOrder",
                        values: submittedValues,
                    },
                },
                { client }
            );

            if (!document?.id) {
                throw new Error("No se pudo registrar el documento de entrega.");
            }

            // El número de documento usa el serial que genera SGA.
            // El formulario no tiene que inventar ni enviar uno.
            const values = {
                ...submittedValues,
                deliveryNumber:
                    submittedValues.deliveryNumber ??
                    String(document.ownSerial ?? document.id),
                authorizedName:
                    submittedValues.authorizedName ??
                    submittedValues.delivererName,
            };

            const delivery = await nexo360Controller.create4KDeliveryOrder(
                {
                    payload: { values },
                    context: {
                        company_id: companyId,
                        user_id: userId,
                    },
                    doc_id: document.id,
                },
                { client }
            );

            return {
                ...delivery,
                ownSerial: document.ownSerial,
            };
        });

        return res.status(201).json({
            status: "OK",
            data: result,
            message: "Orden de entrega registrada y vinculada a las órdenes.",
        });
    } catch (error) {
        console.error("registerDeliveryOrder falló:", error);

        return res.status(error.statusCode ?? 500).json({
            status: "ERROR",
            message:
                error.statusCode && error.statusCode < 500
                    ? error.message
                    : "No fue posible registrar la orden de entrega.",
        });
    }
};

export default nexo360Controller;