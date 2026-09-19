import { useEffect, useMemo, useRef, useState } from 'react';
import { DayPicker } from '@daypicker/react';
import { es } from '@daypicker/react/locale';
import { format, parseISO } from 'date-fns';
import { FormInput } from './FormInput';
import '@daypicker/react/style.css';
import './RangeDate.css';

const isValidDate = (date) => date instanceof Date && !Number.isNaN(date.getTime());

const toDate = (value) => {
    if (!value) return undefined;
    if (isValidDate(value)) return value;

    const parsedDate = parseISO(value);
    return isValidDate(parsedDate) ? parsedDate : undefined;
};

const normalizeRange = (value) => {
    if (!value) return undefined;

    const from = toDate(value.from ?? value.minDate);
    const to = toDate(value.to ?? value.maxDate);
    return from || to ? { from, to } : undefined;
};

const toBusinessDate = (date) => date ? format(date, 'yyyy-MM-dd') : '';

const formatVisibleDate = (date) => date
    ? new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
    : '';

export function RangeDate({
    value,
    defaultValue,
    updateRange,
    label = 'Rango de fechas',
    minDate,
    maxDate,
    disabled = false,
    disabledDates = [],
    align = 'left'
}) {
    const [selectedRange, setSelectedRange] = useState(() => normalizeRange(value ?? defaultValue));
    const [open, setOpen] = useState(false);
    const [activeBoundary, setActiveBoundary] = useState('from');
    const rangeDateRef = useRef(null);

    useEffect(() => {
        if (value !== undefined) setSelectedRange(normalizeRange(value));
    }, [value]);

    useEffect(() => {
        const closeOnOutsideClick = (event) => {
            if (!rangeDateRef.current?.contains(event.target)) setOpen(false);
        };
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };

        document.addEventListener('pointerdown', closeOnOutsideClick);
        window.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', closeOnOutsideClick);
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, []);

    const dateMatchers = useMemo(() => {
        const matchers = Array.isArray(disabledDates) ? [...disabledDates] : [disabledDates];
        const minimumDate = toDate(minDate);
        const maximumDate = toDate(maxDate);

        if (minimumDate) matchers.push({ before: minimumDate });
        if (maximumDate) matchers.push({ after: maximumDate });
        return matchers.filter(Boolean);
    }, [disabledDates, maxDate, minDate]);

    const notifyRangeChange = (range) => {
        updateRange?.({
            minDate: toBusinessDate(range?.from),
            maxDate: toBusinessDate(range?.to)
        });
    };

    const handleSelect = (range) => {
        if (value === undefined) setSelectedRange(range);
        notifyRangeChange(range);
    };

    const clearRange = () => {
        if (value === undefined) setSelectedRange(undefined);
        notifyRangeChange(undefined);
    };

    const openCalendar = (boundary) => {
        if (disabled) return;
        setActiveBoundary(boundary);
        setOpen(true);
    };

    const visibleStartDate = toBusinessDate(selectedRange?.from);
    const visibleEndDate = toBusinessDate(selectedRange?.to);
    const calendarMonth = activeBoundary === 'to'
        ? selectedRange?.to ?? selectedRange?.from
        : selectedRange?.from;

    return (
        <div className={`RangeDate align${align === 'right' ? 'Right' : 'Left'}`} ref={rangeDateRef}>
            <div className="RangeDateInputs" role="group" aria-label={label}>
                <FormInput
                    type="date"
                    value={visibleStartDate}
                    min={minDate}
                    max={visibleEndDate || maxDate}
                    disabled={disabled}
                    required={false}
                    readOnly
                    hideLabel
                    ariaLabel="Fecha inicial"
                    onFocus={() => openCalendar('from')}
                    onClick={() => openCalendar('from')}
                />
                <span className="RangeDateSeparator" aria-hidden="true">–</span>
                <FormInput
                    type="date"
                    value={visibleEndDate}
                    min={visibleStartDate || minDate}
                    max={maxDate}
                    disabled={disabled}
                    required={false}
                    readOnly
                    hideLabel
                    ariaLabel="Fecha final"
                    onFocus={() => openCalendar('to')}
                    onClick={() => openCalendar('to')}
                />
            </div>

            {open && (
                <div className="RangeDatePopover" role="dialog" aria-label={label}>
                    <DayPicker
                        mode="range"
                        selected={selectedRange}
                        onSelect={handleSelect}
                        locale={es}
                        weekStartsOn={1}
                        showOutsideDays
                        disabled={dateMatchers}
                        defaultMonth={calendarMonth ?? toDate(minDate) ?? new Date()}
                        footer={selectedRange?.from
                            ? selectedRange.to
                                ? `${formatVisibleDate(selectedRange.from)} – ${formatVisibleDate(selectedRange.to)}`
                                : 'Selecciona la fecha final'
                            : 'Selecciona la fecha inicial'}
                    />

                    <footer className="RangeDateActions">
                        <button type="button" disabled={!selectedRange} onClick={clearRange}>
                            Limpiar
                            <i className="bi bi-trash3"/>
                        </button>
                        <button className="primary" type="button" onClick={() => setOpen(false)}>Listo</button>
                    </footer>
                </div>
            )}
        </div>
    );
}
