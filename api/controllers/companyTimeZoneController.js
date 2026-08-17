import {
    getCompanyTimeZone,
    setCompanyTimeZone
} from '../services/businessTimeZoneService.js';

const parseCompanyId = (value) => {
    const companyId = Number(value);
    if (!Number.isSafeInteger(companyId) || companyId <= 0) {
        throw new Error('company_id debe ser un entero positivo.');
    }
    return companyId;
};

const companyTimeZoneController = {};

companyTimeZoneController.get = async (req, res) => {
    try {
        const companyId = parseCompanyId(req.body?.company_id);
        res.json({
            company_id: companyId,
            time_zone: await getCompanyTimeZone(companyId)
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

companyTimeZoneController.update = async (req, res) => {
    try {
        const companyId = parseCompanyId(req.body?.company_id);
        const timeZone = String(req.body?.time_zone ?? '').trim();
        if (!timeZone) throw new Error('time_zone es obligatorio.');
        res.json(await setCompanyTimeZone(companyId, timeZone));
    } catch (error) {
        const status = /no tiene un registro/i.test(error.message) ? 404 : 400;
        res.status(status).json({ error: error.message });
    }
};

export default companyTimeZoneController;

