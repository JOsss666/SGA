// El orden se comparte entre la tabla, la búsqueda y la exportación.
export const otpColumns = [
    ['otpIdentifier', 'OTP', 9],
    ['parentIdentifier', 'OP padre', 9],
    ['clientOrder', 'Orden de cliente', 11],
    ['clientName', 'Cliente', 14],
    ['height', 'ALTO', 10],
    ['width', 'ANCHO', 10],
    ['processInstanceName', 'Nombre del proceso', 15],
    ['paramDocReference', 'Referencia', 18],
    ['processStage', 'Etapa proceso', 13],
    ['commitment', 'Compromiso', 11],
    ['createdDate', 'Fecha de creación', 11],
    ['deliveryDate', 'Fecha de entrega', 11],
    ['providers', 'Proveedores', 14],
    ['productionStates', 'Estado producción', 14]
].map(([key, label, width]) => ({ key, label, flex: `0 0 ${width}rem`, minWidth: `${width}rem` }));

export const getOtpColumns = (showClient = true, showParentStage = false) => {
    const columns = showClient ? otpColumns : otpColumns.filter(({ key }) => key !== 'clientName');
    if (!showParentStage) return columns;
    const parentStage = { key: 'parentStage', label: 'Etapa OP', flex: '0 0 13rem', minWidth: '13rem' };
    return columns.flatMap(column => column.key === 'parentIdentifier' ? [column, parentStage] : [column]);
};

export const normalizeOtpResponse = response => {
    if (response?.[0] === false) throw new Error('No fue posible cargar las OTP.');
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.[1])) return response[1];
    if (Array.isArray(response)) return response;
    throw new Error('La respuesta del informe no es válida.');
};

export const filterOtpRows = (rows, search, columns = otpColumns) => {
    const term = search.trim().toLocaleLowerCase('es-CO');
    return rows.filter(row => columns.some(({ key }) => String(row[key] ?? '').toLocaleLowerCase('es-CO').includes(term)));
};

export const exportOtpRows = (rows, columns = otpColumns) => rows.map(row => Object.fromEntries(
    columns.map(({ key, label }) => [label, row[key] ?? ''])
));
