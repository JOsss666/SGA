import { AccountAjustemBlockItemRow } from './accountAjustemBlockItemRow';
import './accountAjustemBlockItems.css';

export function AccountAjustemBlockItems({
    lines,
    accounts,
    thirdParties,
    costCenters,
    totals,
    createLine,
    onLinesChange,
}) {
    const updateLine = (key, field, value) => onLinesChange(current => current.map(line => {
        if (line.key !== key) return line;
        if (field === 'debit' && Number(value || 0) > 0) return { ...line, debit: value, credit: '' };
        if (field === 'credit' && Number(value || 0) > 0) return { ...line, credit: value, debit: '' };
        return { ...line, [field]: value };
    }));

    const insertLine = index => onLinesChange(current => [
        ...current.slice(0, index),
        createLine(),
        ...current.slice(index),
    ]);

    const duplicateLine = (index, line) => onLinesChange(current => [
        ...current.slice(0, index + 1),
        { ...line, key: crypto.randomUUID() },
        ...current.slice(index + 1),
    ]);

    const removeLine = key => onLinesChange(current => (
        current.length > 1 ? current.filter(line => line.key !== key) : current
    ));

    return (
        <section className="accountAjustemBlockItems" aria-label="Detalle contable">
            <div className="accountAjustemBlockItemsHead">
                <span />
                <span>#</span>
                <span>Código cuenta</span>
                <span>Descripción</span>
                <span>Nombre tercero</span>
                <span>Débito</span>
                <span>Crédito</span>
                <span>CC</span>
                <span>Acción</span>
            </div>

            <div className="accountAjustemBlockItemsRows">
                {lines.map((line, index) => (
                    <AccountAjustemBlockItemRow
                        key={line.key}
                        line={line}
                        index={index}
                        accounts={accounts}
                        thirdParties={thirdParties}
                        costCenters={costCenters}
                        onChange={(field, value) => updateLine(line.key, field, value)}
                        onInsert={() => insertLine(index)}
                        onDuplicate={() => duplicateLine(index, line)}
                        onRemove={() => removeLine(line.key)}
                    />
                ))}
            </div>

            <div className="accountAjustemBlockItemsTotals">
                <span>TOTAL</span>
                <strong>{totals.debit.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</strong>
                <strong>{totals.credit.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</strong>
            </div>
        </section>
    );
}
