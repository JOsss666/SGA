import { useDataBase } from '../app.js';

// Compatibilidad para las compañías existentes. La migración 0021 materializa
// este mismo valor en company_settings; las compañías nuevas deben configurarlo.
export const LEGACY_DEFAULT_TIME_ZONE = 'America/Bogota';

export const companyTimeZoneSql = (companyPlaceholder = '$1') => `
    COALESCE(
        (
            SELECT cs.time_zone
            FROM "Ecosystem".company_settings cs
            WHERE cs.company_id = ${companyPlaceholder}
            LIMIT 1
        ),
        '${LEGACY_DEFAULT_TIME_ZONE}'
    )
`;

/**
 * Agrega límites de fechas comerciales y los convierte a instantes UTC.
 * El límite final es exclusivo para no perder fracciones de segundo.
 */
export const appendBusinessDateRange = ({
    whereClauses,
    values,
    column,
    start,
    end,
    companyPlaceholder = '$1'
}) => {
    const timeZone = companyTimeZoneSql(companyPlaceholder);

    if (start) {
        values.push(start);
        whereClauses.push(
            `${column} >= ($${values.length}::date::timestamp AT TIME ZONE (${timeZone}))`
        );
    }

    if (end) {
        values.push(end);
        whereClauses.push(
            `${column} < ((($${values.length}::date + 1)::timestamp) AT TIME ZONE (${timeZone}))`
        );
    }
};

export const getCompanyTimeZone = async (companyId) => {
    const result = await useDataBase(
        `SELECT ${companyTimeZoneSql('$1')} AS time_zone`,
        [companyId],
        1
    );
    return result?.[1]?.[0]?.time_zone ?? LEGACY_DEFAULT_TIME_ZONE;
};

export const setCompanyTimeZone = async (companyId, timeZone) => {
    const validation = await useDataBase(
        `SELECT EXISTS (
            SELECT 1 FROM pg_timezone_names WHERE name = $1
        ) AS valid`,
        [timeZone],
        1
    );

    if (!validation?.[0] || validation[1]?.[0]?.valid !== true) {
        throw new Error(`Zona horaria IANA no válida: ${timeZone}`);
    }

    const update = await useDataBase(
        `UPDATE "Ecosystem".company_settings
         SET time_zone = $2, updated_at = CURRENT_TIMESTAMP
         WHERE company_id = $1`,
        [companyId, timeZone],
        2
    );

    if (!update?.[0]) throw new Error('No fue posible actualizar la zona horaria.');
    if (update[1] === 0) {
        throw new Error('La compañía no tiene un registro en company_settings.');
    }

    return { company_id: companyId, time_zone: timeZone };
};

