import {
    createAccount,
    createBank,
    createInstitution,
    listAccounts,
    listBanks,
    listInstitutions,
} from "../services/banksService.js";
import {
    getAccountBalance,
    getReports,
    ingestMovement,
    listMovements,
} from "../services/banksMovementsService.js";
import utilsController from "./utilsController.js";

const createHandler = (service, { includeActor = false } = {}) =>
    async (req, res) => {
        try {
            const info = await utilsController.readJsonBody(req);
            const authenticatedCompanyId = req.auth?.companyId;

            if (!authenticatedCompanyId) {
                const error = new Error(
                    "Se requiere una compañía activa válida."
                );
                error.statusCode = 400;
                throw error;
            }

            if (
                info.company_id != null &&
                String(info.company_id) !== String(authenticatedCompanyId)
            ) {
                const error = new Error(
                    "La compañía del body no coincide con la compañía activa."
                );
                error.statusCode = 403;
                throw error;
            }

            info.company_id = String(authenticatedCompanyId);

            if (includeActor) {
                info.actor = {
                    ...(info.actor &&
                    typeof info.actor === "object" &&
                    !Array.isArray(info.actor)
                        ? info.actor
                        : {}),
                    user_id: String(req.auth.userId),
                };
            }

            const result = await utilsController.withTransaction((client) =>
                service(client, info)
            );

            return res.status(200).json(result);
        } catch (error) {
            return res
                .status(error.statusCode ?? 500)
                .json({ status: "Error", message: error.message });
        }
    };

const banksController = {
    listInstitutions: createHandler(listInstitutions),
    createInstitution: createHandler(createInstitution),
    listBanks: createHandler(listBanks),
    createBank: createHandler(createBank),
    listAccounts: createHandler(listAccounts),
    getReports: createHandler(getReports),
    createAccount: createHandler(createAccount),
    registerMovement: createHandler(ingestMovement, { includeActor: true }),
    getAccountBalance: createHandler(getAccountBalance),
    listMovements: createHandler(listMovements),
};

export default banksController;