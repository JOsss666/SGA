import geographyService from "../services/geographyService.js";

const geographyController = {};

const send = (res, statusCode, body) => {
    res.status(statusCode).json(body);
};

geographyController.getCountries = async (_req, res) => {
    try {
        send(res, 200, { status: 'OK', data: await geographyService.getCountries() });
    } catch (error) {
        console.error('Error consultando países:', error);
        send(res, 500, { status: 'ERROR', message: error.message });
    }
};

geographyController.getDepartments = async (req, res) => {
    try {
        const countryId = req.query.country_id;
        if (!countryId) return send(res, 400, { status: 'ERROR', message: 'country_id es obligatorio' });
        send(res, 200, { status: 'OK', data: await geographyService.getDepartments(countryId) });
    } catch (error) {
        console.error('Error consultando departamentos:', error);
        send(res, 500, { status: 'ERROR', message: error.message });
    }
};

geographyController.getMunicipalities = async (req, res) => {
    try {
        const { country_id: countryId, department_id: departmentId } = req.query;
        if (!countryId) return send(res, 400, { status: 'ERROR', message: 'country_id es obligatorio' });
        send(res, 200, {
            status: 'OK',
            data: await geographyService.getMunicipalities(countryId, departmentId)
        });
    } catch (error) {
        console.error('Error consultando municipios:', error);
        send(res, 500, { status: 'ERROR', message: error.message });
    }
};

geographyController.getLocalities = async (req, res) => {
    try {
        const municipalityId = req.query.municipality_id;
        if (!municipalityId) return send(res, 400, { status: 'ERROR', message: 'municipality_id es obligatorio' });
        send(res, 200, { status: 'OK', data: await geographyService.getLocalities(municipalityId) });
    } catch (error) {
        console.error('Error consultando localidades:', error);
        send(res, 500, { status: 'ERROR', message: error.message });
    }
};

export default geographyController;
