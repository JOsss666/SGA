import { useDataBase } from "../app.js";

const geographyService = {};

geographyService.getCountries = async () => {
    const [ok, rows] = await useDataBase(`
        SELECT id, iso_code_2, iso_code_3, name
        FROM "Fiscal".countries
        WHERE active
        ORDER BY name;
    `, [], 1);
    return ok ? rows : [];
};

geographyService.getDepartments = async (countryId) => {
    const [ok, rows] = await useDataBase(`
        SELECT id, code, name
        FROM "Fiscal".jurisdictions
        WHERE country_id = $1
          AND level = 'department'
          AND active
        ORDER BY name;
    `, [countryId], 1);
    return ok ? rows : [];
};

geographyService.getMunicipalities = async (countryId, departmentId) => {
    const values = [countryId];
    let departmentFilter = '';
    if (departmentId !== undefined && departmentId !== null && `${departmentId}`.trim() !== '') {
        values.push(departmentId);
        departmentFilter = `AND municipality.parent_id = $2`;
    }

    const [ok, rows] = await useDataBase(`
        SELECT
            municipality.id,
            municipality.code,
            municipality.external_code,
            municipality.name,
            department.id AS department_id,
            department.code AS department_code,
            department.name AS department_name
        FROM "Fiscal".jurisdictions municipality
        JOIN "Fiscal".jurisdictions department
          ON department.id = municipality.parent_id
        WHERE municipality.country_id = $1
          AND municipality.level = 'municipality'
          AND municipality.active
          ${departmentFilter}
        ORDER BY municipality.name;
    `, values, 1);
    return ok ? rows : [];
};

geographyService.getLocalities = async (municipalityId) => {
    const [ok, rows] = await useDataBase(`
        SELECT id, municipality_id, type, code, name, is_municipal_seat
        FROM "Fiscal".localities
        WHERE municipality_id = $1
          AND active
        ORDER BY is_municipal_seat DESC, name;
    `, [municipalityId], 1);
    return ok ? rows : [];
};

export default geographyService;
