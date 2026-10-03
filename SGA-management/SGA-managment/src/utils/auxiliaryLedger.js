// Sumas exactas a cinco decimales, igual que la lectura SQL del auxiliar.
const units = value => {
    const text = String(value ?? '0');
    if (!/^-?\d+(\.\d{1,5})?$/.test(text)) throw new Error('Importe contable inválido.');
    const [integer, fraction = ''] = text.replace('-', '').split('.');
    return (BigInt(integer) * 100000n + BigInt(fraction.padEnd(5, '0'))) * (text.startsWith('-') ? -1n : 1n);
};
const decimal = value => `${value < 0n ? '-' : ''}${(value < 0n ? -value : value) / 100000n}.${((value < 0n ? -value : value) % 100000n).toString().padStart(5, '0')}`;
export const sumAmounts = values => decimal(values.reduce((total, value) => total + units(value), 0n));
export const formatLedgerMoney = value => value == null ? '' : new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
export const formatLedgerDate = value => value ? value.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$3/$2/$1') : '';
const docCodes = { 'Sell Invoice': 'FV', 'Purchase Document': 'DC', 'Cash Recipt': 'RC', 'Cash Exit': 'CE', 'Credit Note': 'NC', 'Debit Note': 'ND', 'Client Order': 'OC', 'Production Order': 'OP', 'Inventory Consume': 'CI' };
export const documentLabel = row => row.document_type ? `${docCodes[row.document_type] || row.document_type}-${row.document_serial || ''}` : `TR-${row.transaction_id || ''}`;
export function buildLedgerView(data, grouping = 'account') {
    const pairs = new Map();
    for (const row of data) {
        const key = `${row.account_id ?? 'none'}:${row.third_party_id ?? 'none'}`;
        if (!pairs.has(key)) {
            const number = `${row.third_party_number || 'Sin identificación'}${row.third_party_dv != null ? `-${row.third_party_dv}` : ''}`;
            pairs.set(key, { ...row, key, account: `${row.account_code || 'Sin cuenta'} · ${row.account_name || ''}`, third: `${number} · ${row.third_party_name}`, movements: [] });
        }
        if (row.movement_id != null) pairs.get(key).movements.push(row);
    }
    const grouped = new Map();
    const sorted = [...pairs.values()].sort((a, b) => {
        const av = grouping === 'account' ? `${a.account}|${a.third}` : `${a.third}|${a.account}`;
        const bv = grouping === 'account' ? `${b.account}|${b.third}` : `${b.third}|${b.account}`;
        return av.localeCompare(bv, 'es', { numeric: true });
    });
    for (const pair of sorted) {
        const key = grouping === 'account' ? pair.account_id : pair.third_party_id;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(pair);
    }
    const rows = [];
    for (const group of grouped.values()) {
        const title = grouping === 'account' ? `Cuenta: ${group[0].account}` : `Tercero: ${group[0].third}`;
        rows.push({ kind: 'group', concept: title });
        for (const pair of group) {
            const subtitle = grouping === 'account' ? `Tercero: ${pair.third}${pair.third_party_address ? ` · ${pair.third_party_address}` : ''}` : `Cuenta: ${pair.account}`;
            const context = `${title} / ${subtitle}`;
            const meta = { account: pair.account, third: pair.third, context };
            rows.push({ ...meta, kind: 'subgroup', concept: `${subtitle} · Naturaleza ${pair.account_nature}` });
            rows.push({ ...meta, kind: 'opening', concept: 'Saldo inicial', balance: pair.opening_balance });
            for (const movement of pair.movements) rows.push({ ...meta, kind: 'movement', date: movement.document_date, business_date: movement.business_date, document: documentLabel(movement), concept: movement.concept || 'Sin concepto registrado', debit: movement.debit, credit: movement.credit, balance: movement.running_balance });
            rows.push({ ...meta, kind: 'subtotal', concept: `TOTAL ${grouping === 'account' ? pair.third : pair.account}`, debit: pair.period_debit, credit: pair.period_credit, balance: pair.closing_balance });
        }
        rows.push({ kind: 'total', concept: `TOTAL ${title}`, debit: sumAmounts(group.map(p => p.period_debit)), credit: sumAmounts(group.map(p => p.period_credit)), balance: grouping === 'account' ? sumAmounts(group.map(p => p.closing_balance)) : null });
    }
    const totals = { debit: sumAmounts(sorted.map(p => p.period_debit)), credit: sumAmounts(sorted.map(p => p.period_credit)), movements: data.filter(row => row.movement_id != null).length, pairs: pairs.size };
    if (rows.length) rows.push({ kind: 'total', concept: 'TOTAL GENERAL', debit: totals.debit, credit: totals.credit });
    return { rows, totals };
}
export const ledgerExportColumns = ['Cuenta', 'Tercero', 'Fecha', 'Fecha contable', 'Documento', 'Concepto', 'Débito', 'Crédito', 'Saldo acumulado'];
export function ledgerExportRows(report, rows) {
    const header = [
        { Concepto: report.company.name }, { Concepto: `NIT: ${report.company.number}` },
        { Concepto: report.filters.grouping === 'account' ? 'Libro Auxiliar por cuenta' : 'Libro Auxiliar por tercero' },
        { Concepto: `Período contable: ${report.filters.start_date} a ${report.filters.end_date}` },
        { Concepto: report.filter_description },
        { Concepto: `Generado: ${report.generated_at} · ${report.generated_by} · Zona: ${report.time_zone}` }
    ];
    return [...header, ...rows.map(row => ({ Cuenta: row.account || '', Tercero: row.third || '', Fecha: formatLedgerDate(row.date), 'Fecha contable': formatLedgerDate(row.business_date), Documento: row.document || '', Concepto: row.concept, Débito: row.debit == null ? '' : Number(row.debit), Crédito: row.credit == null ? '' : Number(row.credit), 'Saldo acumulado': row.balance == null ? '' : Number(row.balance) }))];
}

// PDF vectorial paginado: no depende del DOM visible ni de capturas de la tabla.
export function createLedgerPdf(Pdf, report, rows) {
    const doc = new Pdf({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const left = 12, right = 285, bottom = 188;
    const xs = [12, 36, 81, 208, 246, 284];
    const widths = [22, 43, 87, 37, 37, 37];
    let y;
    const header = () => {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
        doc.text(doc.splitTextToSize(report.company.name || 'Compañía', 270), left, 12);
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        doc.text(`NIT: ${report.company.number || ''} · Libro Auxiliar por ${report.filters.grouping === 'account' ? 'cuenta' : 'tercero'}`, left, 23);
        doc.text(`Período contable: ${report.filters.start_date} a ${report.filters.end_date} · Zona: ${report.time_zone}`, left, 29);
        const filterLines = doc.splitTextToSize(report.filter_description || '', 270);
        doc.setFontSize(7); doc.text(filterLines, left, 35);
        y = 38 + filterLines.length * 3;
        doc.setFillColor(235, 235, 235); doc.rect(left, y, right-left, 7, 'F');
        doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        ['Fecha', 'Documento', 'Concepto', 'Débito', 'Crédito', 'Saldo acumulado'].forEach((label, i) => doc.text(label, xs[i], y+5, i >= 3 ? { align: 'right' } : {}));
        y += 10;
    };
    const newPage = context => {
        doc.addPage(); header();
        if (context) {
            doc.setFontSize(7); doc.setFont('helvetica', 'bold');
            const lines = doc.splitTextToSize(`Continuación: ${context}`, 270);
            doc.text(lines, left, y); y += lines.length * 3.2 + 3;
        }
    };
    header();
    rows.forEach((row, index) => {
        const heading = ['group', 'subgroup'].includes(row.kind);
        doc.setFontSize(8);
        const texts = heading ? [row.concept] : [formatLedgerDate(row.date), row.document || '', row.concept || '', formatLedgerMoney(row.debit), formatLedgerMoney(row.credit), formatLedgerMoney(row.balance)];
        const lines = texts.map((text, i) => doc.splitTextToSize(String(text), heading ? 270 : widths[i]));
        const lineCount = Math.max(...lines.map(l => l.length));
        const height = Math.max(7, lineCount * 3.6 + 3);
        const keepNext = heading || row.kind === 'opening' ? 14 : 0;
        if (y + height + keepNext > bottom) newPage(heading ? '' : row.context);
        doc.setFontSize(8); doc.setFont('helvetica', row.kind === 'movement' ? 'normal' : 'bold');
        if (heading || row.kind === 'total') { doc.setFillColor(244,244,244); doc.rect(left,y-3,right-left,Math.min(height,bottom-y),'F'); }
        // Un concepto largo se divide entre páginas, sin cortar texto ni omitirlo.
        for (let line = 0; line < lineCount; line++) {
            if (y + 4 > bottom) { newPage(row.context); doc.setFontSize(8); doc.setFont('helvetica', row.kind === 'movement' ? 'normal' : 'bold'); }
            lines.forEach((parts, i) => { if (parts[line]) doc.text(parts[line], heading ? left : xs[i], y, !heading && i >= 3 ? { align:'right' } : {}); });
            y += 3.6;
        }
        y += 3;
    });
    const count = doc.getNumberOfPages();
    for (let page=1; page<=count; page++) {
        doc.setPage(page); doc.setFont('helvetica','normal'); doc.setFontSize(7);
        const stamp = new Intl.DateTimeFormat('es-CO', { timeZone:report.time_zone, dateStyle:'short', timeStyle:'short' }).format(new Date(report.generated_at));
        doc.text(`Generado: ${stamp} · ${report.generated_by || ''}`, left, 200);
        doc.text(`Página ${page} de ${count}`,right,200,{align:'right'});
    }
    return doc;
}
