import { memo } from 'react';
import './universalRow.css';

const formatCellValue = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
};

function UniversalRowComponent({
    disabled = false,
    selected = false,
    info = {},
    columns = [],
    renderers = {},
    index = 0
}) {
    const visibleColumns = columns.filter((column) => column.visible !== false);

    const cellDictionary = {
        col1: ({ value }) => <span>{formatCellValue(value)}</span>,
        status: ({ value }) => (
            <span className="universalRowStatus">
                <i className="fa-solid fa-circle" aria-hidden="true" />
                {formatCellValue(value)}
            </span>
        ),
        default: ({ value }) => <span title={formatCellValue(value)}>{formatCellValue(value)}</span>,
        ...renderers
    };

    return (
        <div
            className={`universalRow${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
            role="row"
            aria-rowindex={index + 2}
            aria-selected={selected}
            aria-disabled={disabled}
        >
            {visibleColumns.map((column) => {
                const Renderer = cellDictionary[column.key] ?? cellDictionary.default;

                return (
                    <div
                        className="universalRowCell"
                        role="cell"
                        key={column.key}
                        style={{
                            flex: column.flex ?? '1 1 10rem',
                            minWidth: column.minWidth ?? '8rem',
                            maxWidth: column.maxWidth
                        }}
                        data-column-key={column.key}
                    >
                        <Renderer
                            value={info[column.key]}
                            info={info}
                            column={column}
                            disabled={disabled}
                            selected={selected}
                        />
                    </div>
                );
            })}
        </div>
    );
}

export const UniversalRow = memo(UniversalRowComponent);
