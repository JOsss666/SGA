import { createNexoDeliveryOrderService } from '../../services/nexoDeliveryOrderService.js';
import utilsController from '../utilsController.js';

const service = createNexoDeliveryOrderService({ withTransaction: utilsController.withTransaction });

export const createDeliveryOrder = async (req, res, next) => {
    try {
        res.status(201).json(await service.create(req.body, req.auth));
    } catch (error) {
        if (error.statusCode && error.statusCode < 500) return res.status(error.statusCode).json({ error: error.message });
        next(error);
    }
};
