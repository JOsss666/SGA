const normalizeControllerRows = (result, limit = 25) => {
    let rows = result;
    if (Array.isArray(result) && result[0] === true && Array.isArray(result[1])) {
        rows = result[1];
    }
    if (!Array.isArray(rows)) rows = [];

    const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
    return {
        total_count: rows.length,
        returned_count: Math.min(rows.length, safeLimit),
        records: rows.slice(0, safeLimit)
    };
};

export default normalizeControllerRows;
