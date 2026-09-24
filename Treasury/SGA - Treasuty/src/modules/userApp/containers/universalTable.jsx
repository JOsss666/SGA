import { cloneElement, isValidElement, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { UniversalRow } from '../components/universalRow';
import { UniversalTableLoadingShader } from '../components/universalTableLoadingShader';
import './universalTable.css';

const normalizeText = (value) => String(value ?? '').trim().toLocaleLowerCase('es-CO');
const normalizeFilterValue = (value) => String(value ?? '');

// Una celda puede tener múltiples valores (arreglo): cada elemento se trata como
// un token independiente para filtrar/buscar. Los valores escalares se envuelven
// en un token único, así el comportamiento con columnas normales no cambia.
const toFilterTokens = (value) => (Array.isArray(value) ? value : [value]);

const getInitialSort = (columns) => {
    const sortedColumn = columns.find((column) => ['ASC', 'DESC'].includes(column.order));
    return sortedColumn ? { key: sortedColumn.key, order: sortedColumn.order } : null;
};

const normalizeColumnValues = (column, results) => {
    const providedValues = Array.isArray(column.values) ? column.values : [];
    const sourceValues = providedValues.length > 0
        ? providedValues
        : results.flatMap((result) => toFilterTokens(result?.[column.key]));
    const uniqueValues = new Map();

    sourceValues.forEach((entry) => {
        const isObjectOption = entry && typeof entry === 'object' && !Array.isArray(entry);
        const value = isObjectOption ? entry.value : entry;
        const label = isObjectOption ? (entry.label ?? entry.value) : entry;
        const normalizedValue = normalizeFilterValue(value);

        if (!uniqueValues.has(normalizedValue)) {
            uniqueValues.set(normalizedValue, {
                value: normalizedValue,
                label: String(label ?? 'Sin valor')
            });
        }
    });

    return [...uniqueValues.values()].sort((first, second) => (
        first.label.localeCompare(second.label, 'es', { numeric: true })
    ));
};

export function UniversalTable({
    columns = [],
    results,
    info = [],
    searchValue = '',
    loading = false,
    disabled = false,
    Row = UniversalRow,
    rowHeight = 56,
    height,
    selectedRows = [],
    getRowKey,
    rowProps = {},
    onFilteredResultsChange,
    fitColumnsToContent = false,
    emptyMessage = 'No hay resultados disponibles'
}) {
    const tableResults = Array.isArray(results) ? results : info;
    const visibleColumns = useMemo(
        () => columns.filter((column) => column.visible !== false),
        [columns]
    );
    const [sortConfig, setSortConfig] = useState(() => getInitialSort(columns));
    const [columnFilters, setColumnFilters] = useState({});
    const [openFilterKey, setOpenFilterKey] = useState(null);
    const [filterMenuPosition, setFilterMenuPosition] = useState(null);
    const [filterSearchValue, setFilterSearchValue] = useState('');
    const tableRef = useRef(null);
    const bodyRef = useRef(null);
    const headerRef = useRef(null);

    const [contentWidths, setContentWidths] = useState({});
    useLayoutEffect(() => {
        if (!fitColumnsToContent || !headerRef.current) return;
        const cells = [...headerRef.current.querySelectorAll('[role="columnheader"]')];
        const measure = () => {
            const widths = Object.fromEntries(cells.map((cell, index) => [
                visibleColumns[index].key, cell.getBoundingClientRect().width
            ]));
            setContentWidths(current => Object.keys(current).length === cells.length
                && Object.entries(widths).every(([key, width]) => current[key] === width) ? current : widths);
        };
        measure();
        const observer = new ResizeObserver(measure);
        cells.forEach(cell => observer.observe(cell));
        return () => observer.disconnect();
    }, [fitColumnsToContent, visibleColumns]);
    const rowColumns = useMemo(() => fitColumnsToContent ? visibleColumns.map(column => {
        const width = contentWidths[column.key];
        return width ? { ...column, flex: `0 0 ${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` } : column;
    }) : visibleColumns, [fitColumnsToContent, visibleColumns, contentWidths]);

    useEffect(() => {
        setSortConfig(getInitialSort(columns));
    }, [columns]);

    useEffect(() => {
        if (loading || disabled) {
            setOpenFilterKey(null);
            setFilterMenuPosition(null);
        }
    }, [disabled, loading]);

    useEffect(() => {
        const closeFilterWithEscape = (event) => {
            if (event.key === 'Escape') {
                setOpenFilterKey(null);
                setFilterMenuPosition(null);
            }
        };

        window.addEventListener('keydown', closeFilterWithEscape);
        return () => window.removeEventListener('keydown', closeFilterWithEscape);
    }, []);

    const columnValueOptions = useMemo(() => Object.fromEntries(
        visibleColumns.map((column) => [
            column.key,
            normalizeColumnValues(column, tableResults)
        ])
    ), [tableResults, visibleColumns]);

    const filteredResults = useMemo(() => {
        const normalizedSearch = normalizeText(searchValue);
        const filtered = tableResults.filter((result) => {
            const matchesSearch = !normalizedSearch || visibleColumns.some((column) => (
                toFilterTokens(result?.[column.key]).some((token) => normalizeText(token).includes(normalizedSearch))
            ));

            if (!matchesSearch) return false;

            // Una celda multi-valor pasa el filtro si cualquiera de sus tokens está seleccionado.
            return Object.entries(columnFilters).every(([columnKey, selectedValues]) => (
                toFilterTokens(result?.[columnKey]).some((token) => selectedValues.includes(normalizeFilterValue(token)))
            ));
        });

        if (!sortConfig) return filtered;

        return [...filtered].sort((firstResult, secondResult) => {
            const firstValue = firstResult?.[sortConfig.key];
            const secondValue = secondResult?.[sortConfig.key];
            const numericFirst = Number(firstValue);
            const numericSecond = Number(secondValue);
            const bothAreNumbers = firstValue !== ''
                && secondValue !== ''
                && Number.isFinite(numericFirst)
                && Number.isFinite(numericSecond);
            const comparison = bothAreNumbers
                ? numericFirst - numericSecond
                : String(firstValue ?? '').localeCompare(String(secondValue ?? ''), 'es', { numeric: true });

            return sortConfig.order === 'DESC' ? comparison * -1 : comparison;
        });
    }, [columnFilters, searchValue, sortConfig, tableResults, visibleColumns]);

    // Compartir todas las filas filtradas, no solo las renderizadas por virtualización.
    useEffect(() => {
        onFilteredResultsChange?.(filteredResults);
    }, [filteredResults, onFilteredResultsChange]);

    const rowVirtualizer = useVirtualizer({
        count: filteredResults.length,
        getScrollElement: () => bodyRef.current,
        estimateSize: () => rowHeight,
        overscan: 7
    });

    const minimumTableWidth = Math.max(fitColumnsToContent
        ? Object.values(contentWidths).reduce((sum, width) => sum + width, 0)
        : visibleColumns.length * 150, 620);
    const optionsForOpenColumn = useMemo(
        () => openFilterKey ? columnValueOptions[openFilterKey] ?? [] : [],
        [columnValueOptions, openFilterKey]
    );
    const visibleFilterOptions = useMemo(() => {
        const normalizedFilterSearch = normalizeText(filterSearchValue);
        if (!normalizedFilterSearch) return optionsForOpenColumn;
        return optionsForOpenColumn.filter((option) => normalizeText(option.label).includes(normalizedFilterSearch));
    }, [filterSearchValue, optionsForOpenColumn]);

    const handleSort = (column) => {
        if (disabled || loading || column.sortable === false) return;
        setSortConfig((currentSort) => ({
            key: column.key,
            order: currentSort?.key === column.key && currentSort.order === 'ASC' ? 'DESC' : 'ASC'
        }));
    };

    const toggleFilter = (columnKey, value) => {
        const allValues = (columnValueOptions[columnKey] ?? []).map((option) => option.value);
        setColumnFilters((currentFilters) => {
            const currentlySelected = Object.hasOwn(currentFilters, columnKey)
                ? currentFilters[columnKey]
                : allValues;
            const nextSelected = currentlySelected.includes(value)
                ? currentlySelected.filter((selectedValue) => selectedValue !== value)
                : [...currentlySelected, value];
            const nextFilters = { ...currentFilters };

            if (nextSelected.length === allValues.length) delete nextFilters[columnKey];
            else nextFilters[columnKey] = nextSelected;

            return nextFilters;
        });
    };

    const setAllColumnValues = (columnKey, selected) => {
        setColumnFilters((currentFilters) => {
            const nextFilters = { ...currentFilters };
            if (selected) delete nextFilters[columnKey];
            else nextFilters[columnKey] = [];
            return nextFilters;
        });
    };

    const renderRow = (result, index) => {
        const rowKey = getRowKey?.(result, index) ?? result?.id ?? index;
        const sharedProps = {
            ...rowProps,
            info: result,
            columns: rowColumns,
            disabled,
            selected: selectedRows.includes(rowKey),
            index
        };

        if (isValidElement(Row)) return cloneElement(Row, { ...sharedProps, key: rowKey });
        const RowComponent = Row;
        return <RowComponent {...sharedProps} key={rowKey} />;
    };

    const syncHeaderScroll = (event) => {
        if (headerRef.current) headerRef.current.scrollLeft = event.currentTarget.scrollLeft;
        if (openFilterKey) {
            setOpenFilterKey(null);
            setFilterMenuPosition(null);
        }
    };

    const openColumnFilter = (event, columnKey) => {
        if (openFilterKey === columnKey) {
            setOpenFilterKey(null);
            setFilterMenuPosition(null);
            return;
        }

        const tableRectangle = tableRef.current?.getBoundingClientRect();
        const buttonRectangle = event.currentTarget.getBoundingClientRect();
        const menuWidth = Math.min(288, (tableRectangle?.width ?? 320) - 16);
        const preferredLeft = buttonRectangle.right - (tableRectangle?.left ?? 0) - menuWidth;

        setFilterSearchValue('');
        setFilterMenuPosition({
            left: Math.max(8, Math.min(preferredLeft, (tableRectangle?.width ?? 320) - menuWidth - 8)),
            top: buttonRectangle.bottom - (tableRectangle?.top ?? 0) + 4,
            width: menuWidth
        });
        setOpenFilterKey(columnKey);
    };

    return (
        <section
            className={`universalTable${disabled ? ' disabled' : ''}${fitColumnsToContent ? ' fitContentColumns' : ''}`}
            ref={tableRef}
            style={height === undefined ? undefined : { height }}
            role="table"
            aria-busy={loading}
            aria-disabled={disabled}
            aria-rowcount={filteredResults.length}
            aria-colcount={visibleColumns.length}
        >
            <div className="universalTableHeaderViewport" ref={headerRef} role="rowgroup">
                <div
                    className="universalTableHeader"
                    role="row"
                    style={{ minWidth: `${minimumTableWidth}px` }}
                >
                    {visibleColumns.map((column) => {
                        const isFiltered = Object.hasOwn(columnFilters, column.key);
                        const isSorted = sortConfig?.key === column.key;

                        return (
                            <div
                                className="universalTableHeaderCell"
                                role="columnheader"
                                aria-sort={isSorted ? (sortConfig.order === 'ASC' ? 'ascending' : 'descending') : 'none'}
                                key={column.key}
                                style={{
                                    flex: fitColumnsToContent ? '0 0 auto' : column.flex ?? '1 1 10rem',
                                    width: fitColumnsToContent ? 'fit-content' : undefined,
                                    minWidth: fitColumnsToContent ? 'max-content' : column.minWidth ?? '8rem',
                                    maxWidth: fitColumnsToContent ? undefined : column.maxWidth
                                }}
                                data-status={column.status ?? undefined}
                            >
                                <button
                                    className="universalTableSortButton"
                                    type="button"
                                    disabled={disabled || loading || column.sortable === false}
                                    onClick={() => handleSort(column)}
                                >
                                    <span>{column.label}</span>
                                    <i
                                        className={`${isSorted? 'sortedColumIcon':''} ${isSorted
                                            ? `fa-solid fa-arrow-${sortConfig.order === 'ASC' ? 'down' : 'up'}-short-wide`
                                            : 'bi bi-caret-down'}`}
                                        aria-hidden="true"
                                    />
                                </button>
                                <button
                                    className={`universalTableFilterButton${isFiltered ? ' active' : ''}`}
                                    type="button"
                                    disabled={disabled || loading || column.filterable === false}
                                    aria-label={`Filtrar columna ${column.label}`}
                                    aria-expanded={openFilterKey === column.key}
                                    onClick={(event) => openColumnFilter(event, column.key)}
                                >
                                    <i className="bi bi-funnel"/>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {openFilterKey && filterMenuPosition && (
                <div
                    className="universalTableFilterMenu"
                    style={filterMenuPosition}
                    role="dialog"
                    aria-label={`Filtros de ${visibleColumns.find((column) => column.key === openFilterKey)?.label}`}
                >
                    <div className="universalTableFilterMenuHeader">
                        <strong>
                            <i className="bi bi-funnel"/>
                            Filtrar en {visibleColumns.find((column) => column.key === openFilterKey)?.label}
                        </strong>
                        <button
                            type="button"
                            aria-label="Cerrar filtros"
                            onClick={() => {
                                setOpenFilterKey(null);
                                setFilterMenuPosition(null);
                            }}
                        >
                            <i className="fa-solid fa-xmark" aria-hidden="true" />
                        </button>
                    </div>
                    <label>
                        <input
                            type="search"
                            value={filterSearchValue}
                            disabled={disabled || loading}
                            onChange={(event) => setFilterSearchValue(event.target.value)}
                            placeholder="Buscar valor…"
                            autoFocus
                        />
                    </label>
                    <div className="universalTableFilterActions">
                        <button type="button" onClick={() => {
                            setAllColumnValues(openFilterKey, true)
                            setFilterSearchValue("")
                        }}>Reestablecer</button>
                        <button type="button" onClick={() => setAllColumnValues(openFilterKey, true)}>Todos</button>
                        <button type="button" onClick={() => setAllColumnValues(openFilterKey, false)}>Ninguno</button>
                    </div>
                    <div className="universalTableFilterValues">
                        {visibleFilterOptions.map((option) => {
                            const selectedValues = Object.hasOwn(columnFilters, openFilterKey)
                                ? columnFilters[openFilterKey]
                                : optionsForOpenColumn.map((item) => item.value);
                            return (
                                <label key={option.value}>
                                    <input
                                        className='chechBoxValueColumn'
                                        type="checkbox"
                                        checked={selectedValues.includes(option.value)}
                                        disabled={disabled || loading}
                                        onChange={() => toggleFilter(openFilterKey, option.value)}
                                    />
                                    <span title={option.label}>{option.label}</span>
                                </label>
                            );
                        })}
                        {visibleFilterOptions.length === 0 && <p>No hay valores</p>}
                    </div>
                </div>
            )}

            <div
                className="universalTableBody"
                ref={bodyRef}
                role="rowgroup"
                onScroll={syncHeaderScroll}
            >
                <div className="universalTableBodyContent" style={{ minWidth: `${minimumTableWidth}px` }}>
                    {loading && <UniversalTableLoadingShader columns={rowColumns} />}

                    {!loading && filteredResults.length === 0 && (
                        <div className="universalTableEmpty" role="status">
                            <i className="bi bi-inbox" aria-hidden="true" />
                            <p>{emptyMessage}</p>
                        </div>
                    )}

                    {!loading && filteredResults.length > 0 && (
                        <div
                            className="universalTableVirtualSpace"
                            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                        >
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                                <div
                                    className="universalTableVirtualRow"
                                    key={virtualRow.key}
                                    ref={rowVirtualizer.measureElement}
                                    data-index={virtualRow.index}
                                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                                >
                                    {renderRow(filteredResults[virtualRow.index], virtualRow.index)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <footer className="universalTableFooter" aria-live="polite">
                {filteredResults.length} de {tableResults.length} resultados
            </footer>
        </section>
    );
}
